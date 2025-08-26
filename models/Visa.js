const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
  visaNumber: {
    type: String,
    required: true,
    unique: true
  },
  surname: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  passportNumber: {
    type: String,
    required: true
  },
  visaValidity: {
    type: String,
    required: true
  },
  visaStatus: {
    type: String,
    default: 'Viza emisa'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Visa', visaSchema);