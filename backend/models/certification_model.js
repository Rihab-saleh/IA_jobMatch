const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: function() { return !this.noExpiration; }
  },
  noExpiration: {
    type: Boolean,
    default: false
  },
  credentialId: String,
  credentialURL: String,
  description: String,
}, { timestamps: true });

const Certification = mongoose.model('Certification', certificationSchema);

module.exports = Certification;