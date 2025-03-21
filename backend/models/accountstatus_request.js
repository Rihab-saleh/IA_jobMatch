const mongoose = require('mongoose');

const accountStatusRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestType: {
    type: String,
    enum: ["deactivate"], 
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, {
  timestamps: true, 
});

module.exports = mongoose.model('AccountStatusRequest', accountStatusRequestSchema);