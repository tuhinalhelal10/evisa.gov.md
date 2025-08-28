const express = require('express');
const Visa = require('../models/Visa');
const router = express.Router();

// সমস্ত ভিসা দেখার রাউট (শুধুমাত্র অ্যাডমিনের জন্য)
router.get('/', async (req, res) => {
    try {
        // অথেন্টিকেশন চেক
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const visas = await Visa.find().sort({ createdAt: -1 });
        res.json(visas);
    } catch (error) {
        console.error('Get all visas error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ভিসা নাম্বার দ্বারা খোঁজার রাউট
router.get('/search/:visaNumber', async (req, res) => {
    try {
        const { visaNumber } = req.params;

        // ক্যাপচা ভেরিফিকেশন চেক
        if (!req.session.captchaVerified) {
            return res.status(400).json({ error: 'CAPTCHA verification required' });
        }

        const visa = await Visa.findOne({ visaNumber });
        if (!visa) {
            return res.status(404).json({ error: 'Visa not found' });
        }

        // ক্যাপচা ভেরিফিকেশন রিসেট করুন
        req.session.captchaVerified = false;

        res.json(visa);
    } catch (error) {
        console.error('Search visa error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// নতুন ভিসা যোগ করার রাউট (শুধুমাত্র অ্যাডমিনের জন্য)
router.post('/', async (req, res) => {
    try {
        // অথেন্টিকেশন চেক
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const {
            visaNumber,
            surname,
            firstName,
            dateOfBirth,
            passportNumber,
            visaValidity,
            visaStatus
        } = req.body;

        // ভ্যালিডেশন
        if (!visaNumber || !surname || !firstName || !dateOfBirth || !passportNumber || !visaValidity) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // ভিসা নাম্বার ইউনিক কিনা চেক করুন
        const existingVisa = await Visa.findOne({ visaNumber });
        if (existingVisa) {
            return res.status(400).json({ error: 'Visa number already exists' });
        }

        // নতুন ভিসা তৈরি করুন
        const newVisa = new Visa({
            visaNumber,
            surname,
            firstName,
            dateOfBirth,
            passportNumber,
            visaValidity,
            visaStatus: visaStatus || 'Processing'
        });

        await newVisa.save();

        res.status(201).json({
            message: 'Visa created successfully',
            visa: newVisa
        });
    } catch (error) {
        console.error('Create visa error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ভিসা ডিলিট করার রাউট (শুধুমাত্র অ্যাডমিনের জন্য)
router.delete('/:id', async (req, res) => {
    try {
        // অথেন্টিকেশন চেক
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const { id } = req.params;

        const visa = await Visa.findByIdAndDelete(id);
        if (!visa) {
            return res.status(404).json({ error: 'Visa not found' });
        }

        res.json({ message: 'Visa deleted successfully' });
    } catch (error) {
        console.error('Delete visa error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;