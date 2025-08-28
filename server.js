const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// CORS কনফিগারেশন
app.use(cors({
    origin: true,
    credentials: true
}));

// middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection string
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://mdtuhinhelal0_db_user:84LW4mUTY6rD0CVU@cluster0.zhazzet.mongodb.net/visa-system?retryWrites=true&w=majority';

// সেশন মিডলওয়্যার
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-super-secret-key-12345',
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// ক্যাপচা জেনারেটর ফাংশন
const svgCaptcha = require('svg-captcha');
function generateCaptcha() {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 2,
        color: true,
        background: '#f0f0f0',
        width: 150,
        height: 50,
        fontSize: 45
    });
    return captcha;
}

// ক্যাপচা রাউট
app.get('/api/captcha', (req, res) => {
    try {
        const captcha = generateCaptcha();
        req.session.captcha = captcha.text;
        console.log('Generated CAPTCHA:', captcha.text);
        res.type('svg');
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.status(200).send(captcha.data);
    } catch (error) {
        console.error('CAPTCHA generation error:', error);
        res.status(500).json({ error: 'Failed to generate CAPTCHA' });
    }
});

// ক্যাপচা ভেরিফিকেশন রাউট
app.post('/api/verify-captcha', (req, res) => {
    try {
        const { captchaInput } = req.body;
        
        console.log('Received CAPTCHA input:', captchaInput);
        console.log('Session CAPTCHA:', req.session.captcha);
        console.log('Session ID:', req.sessionID);
        
        if (!captchaInput) {
            return res.status(400).json({ error: 'CAPTCHA input is required' });
        }
        
        if (!req.session.captcha) {
            return res.status(400).json({ error: 'CAPTCHA session expired or not generated' });
        }
        
        // কেস-ইনসেনসিটিভ কম্পেয়ারিশন
        if (captchaInput.toLowerCase() === req.session.captcha.toLowerCase()) {
            req.session.captchaVerified = true;
            res.json({ success: true, message: 'CAPTCHA verification successful' });
        } else {
            res.status(400).json({ error: 'Invalid CAPTCHA code' });
        }
    } catch (error) {
        console.error('CAPTCHA verification error:', error);
        res.status(500).json({ error: 'CAPTCHA verification failed' });
    }
});

// হেলথ চেক এন্ডপয়েন্ট
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString(),
        session: req.sessionID ? 'Active' : 'Inactive'
    });
});

// মিডলওয়্যার ইম্পোর্ট করুন
const authMiddleware = require('./middleware/auth');

// রাউটস ইম্পোর্ট করুন
const authRoutes = require('./routes/auth');
const visaRoutes = require('./routes/visas');

// রাউটস ব্যবহার করুন
app.use('/api/auth', authRoutes);
app.use('/api/visas', visaRoutes);

// স্ট্যাটিক ফাইল সার্ভ করুন
app.use(express.static(path.join(__dirname)));

// মূল হোমপেজ রাউট
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'check-my-visa', 'index.html'));
});

// check-my-visa রাউট
app.get('/check-my-visa', (req, res) => {
    res.sendFile(path.join(__dirname, 'check-my-visa', 'index.html'));
});

// API রাউট ছাড়া অন্য সকল রাউটের জন্য check-my-visa ফোল্ডারের index.html সার্ভ করুন
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, 'check-my-visa', 'index.html'));
});

// MongoDB connection with better error handling
const connectWithRetry = function() {
    console.log('Attempting MongoDB connection...');
    
    mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    })
    .then(() => {
        console.log('MongoDB connected successfully');
        console.log('Database:', mongoose.connection.name);
        
        // ডাটাবেস কানেকশন成功后 admin user check করুন
        const User = require('./models/User');
        User.findOne({ role: 'admin' })
            .then(admin => {
                if (!admin) {
                    console.log('No admin user found. Please run: npm run setup-admin');
                } else {
                    console.log('Admin user exists');
                }
            })
            .catch(err => {
                console.error('Error checking admin user:', err);
            });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        
        // Retry after 5 seconds
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    });
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Start connection
connectWithRetry();

// Handle application termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Frontend: http://localhost:${PORT}`);
});