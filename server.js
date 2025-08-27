const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection string
const mongoUri = 'mongodb+srv://mdtuhinhelal0_db_user:84LW4mUTY6rD0CVU@cluster0.zhazzet.mongodb.net/visa-system?retryWrites=true&w=majority';

// সেশন মিডলওয়্যার যোগ করুন
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri,
        mongoOptions: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
    }),
    cookie: { 
        secure: false,
        maxAge: 15 * 60 * 1000
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
        height: 50
    });
    return captcha;
}

// ক্যাপচা রাউট
app.get('/api/captcha', (req, res) => {
    try {
        const captcha = generateCaptcha();
        req.session.captcha = captcha.text;
        res.type('svg');
        res.status(200).send(captcha.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate CAPTCHA' });
    }
});

// ক্যাপচা ভেরিফিকেশন রাউট
app.post('/api/verify-captcha', (req, res) => {
    const { captchaInput } = req.body;
    
    if (!captchaInput) {
        return res.status(400).json({ error: 'CAPTCHA input is required' });
    }
    
    if (!req.session.captcha) {
        return res.status(400).json({ error: 'CAPTCHA session expired or not generated' });
    }
    
    if (captchaInput.toLowerCase() === req.session.captcha.toLowerCase()) {
        delete req.session.captcha;
        res.json({ success: true, message: 'CAPTCHA verification successful' });
    } else {
        res.status(400).json({ error: 'Invalid CAPTCHA code' });
    }
});

// হেলথ চেক এন্ডপয়েন্ট
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// রাউটস - API রাউটগুলো আগে ডিফাইন করতে হবে
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visas', require('./routes/visas'));

// স্ট্যাটিক ফাইল সার্ভ করা
app.use(express.static(path.join(__dirname)));

// মূল হোমপেজ রাউট
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
      console.log('Connection string:', mongoUri.replace(/:[^:]*@/, ':****@'));
    })
    .catch(err => {
      console.log('MongoDB connection error:', err.message);
      console.log('Using connection string:', mongoUri.replace(/:[^:]*@/, ':****@'));
      
      // Retry after 5 seconds
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

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
});