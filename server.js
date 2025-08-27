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

// MongoDB connection string সেটআপ
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visa-system';

// সেশন মিডলওয়্যার যোগ করুন
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri
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
    res.json({ status: 'OK', message: 'Server is running' });
});

// রাউটস - API রাউটগুলো আগে ডিফাইন করতে হবে
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visas', require('./routes/visas'));

// স্ট্যাটিক ফাইল সার্ভ করা - এই লাইনটি সবচেয়ে গুরুত্বপূর্ণ
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
    // যদি রিকোয়েস্ট API এর জন্য হয় তাহলে 404 রিটার্ন করুন
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // অন্যথায় check-my-visa ফোল্ডারের index.html সার্ভ করুন
    res.sendFile(path.join(__dirname, 'check-my-visa', 'index.html'));
});

// MongoDB connection
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.log('MongoDB connection error:', err);
  console.log('Using connection string:', mongoUri.replace(/:[^:]*@/, ':****@')); // পাসওয়ার্ড লুকানোর জন্য
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));