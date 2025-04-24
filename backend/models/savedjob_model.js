
const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  salary: { type: String },
  url: { type: String },
  datePosted: { type: Date },
  jobType: { type: String },
  source: { type: String },
  favorited: {
    type: Boolean,
    default: false
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recommended: { type: Boolean, default: false }, // New field
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SavedJob', SavedJobSchema);
