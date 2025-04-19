// models/RecommendedJob_model.js
const mongoose = require('mongoose');

const recommendedJobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  score: Number,
  viewed: {
    type: Boolean,
    default: false
  },
  recommendedAt: {
    type: Date,
    default: Date.now
  }
});

recommendedJobSchema.index({ user: 1, recommendedAt: -1 });

module.exports = mongoose.model('RecommendedJob', recommendedJobSchema);
