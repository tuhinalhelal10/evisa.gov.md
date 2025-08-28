const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
    visaNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    surname: {
        type: String,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: String,
        required: true
    },
    passportNumber: {
        type: String,
        required: true,
        trim: true
    },
    visaValidity: {
        type: String,
        required: true
    },
    visaStatus: {
        type: String,
        required: true,
        enum: ['Viza emisa', 'Processing', 'Rejected'],
        default: 'Processing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// আপডেট করার সময় updatedAt ফিল্ড আপডেট করার middleware
visaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Visa', visaSchema);