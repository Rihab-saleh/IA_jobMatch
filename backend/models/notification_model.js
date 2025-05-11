const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationType: {
    type: String,
    enum: ['jobAlert', 'systemUpdate',"email_job_recommendation"],
    required: false
  },
  read: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: false
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  jobTitle: {
    type: String,
    required: false,
  },
  jobUrl: {
    type: String,
    required: false,
  },
  jobCompany: {
    type: String,
    required: false,
  },
  jobLocation: {
    type: String,
    required: false,
  },
  jobMatchPercentage: {
    type: Number,
    required: false,
  },
  jobSkills: {
    type: [String],
    required: false,
  },
  jobDescription: {
    type: String,
    required: false,
  },
  
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

notificationSchema.index({ userId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);