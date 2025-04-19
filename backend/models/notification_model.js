const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationType: {
    type: String,
    enum: ['jobAlert', 'systemUpdate'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    required: true
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
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