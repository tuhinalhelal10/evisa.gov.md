const express = require('express');
const auth = require('../middleware/auth');
const Visa = require('../models/Visa');

const router = express.Router();

// সব ভিসা পান (শুধু এডমিনের জন্য)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const visas = await Visa.find().sort({ createdAt: -1 });
    res.json(visas);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ভিসা নম্বর দিয়ে খুঁজুন
router.get('/:visaNumber', async (req, res) => {
  try {
    const visa = await Visa.findOne({ visaNumber: req.params.visaNumber });
    if (!visa) {
      return res.status(404).json({ message: 'Visa not found' });
    }
    res.json(visa);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// নতুন ভিসা যোগ করুন (শুধু এডমিনের জন্য)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
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

    // ভিসা নম্বর already exists কিনা check করুন
    const existingVisa = await Visa.findOne({ visaNumber });
    if (existingVisa) {
      return res.status(400).json({ message: 'Visa number already exists' });
    }

    const newVisa = new Visa({
      visaNumber,
      surname,
      firstName,
      dateOfBirth,
      passportNumber,
      visaValidity,
      visaStatus,
      createdBy: req.user.id
    });

    await newVisa.save();
    res.status(201).json({ message: 'Visa created successfully', visa: newVisa });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ভিসা আপডেট করুন (শুধু এডমিনের জন্য)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const updatedVisa = await Visa.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVisa) {
      return res.status(404).json({ message: 'Visa not found' });
    }

    res.json({ message: 'Visa updated successfully', visa: updatedVisa });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ভিসা ডিলিট করুন (শুধু এডমিনের জন্য)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const deletedVisa = await Visa.findByIdAndDelete(req.params.id);
    if (!deletedVisa) {
      return res.status(404).json({ message: 'Visa not found' });
    }

    res.json({ message: 'Visa deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;