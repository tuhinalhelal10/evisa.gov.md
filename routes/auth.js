const express = require('express');
const User = require('../models/User');
const router = express.Router();

// লগিন রাউট
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // ভ্যালিডেশন
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // ইউজার খুঁজুন
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // পাসওয়ার্ড চেক করুন
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // সেশনে ইউজার তথ্য সেভ করুন
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// লগআউট রাউট
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
    });
});

// বর্তমান ইউজার চেক করার রাউট
router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

module.exports = router;