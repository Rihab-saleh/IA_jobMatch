const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: Boolean,
    default: true
  },
  jobAlerts: {
    type: Boolean,
    default: true
  },
  applicationUpdates: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['immediately', 'daily', 'weekly'],
    default: 'daily'
  },
  read: {
    type: Boolean,
    default: false // Par défaut, les notifications ne sont pas lues
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

notificationSettingsSchema.index({ userId: 1 });

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);


