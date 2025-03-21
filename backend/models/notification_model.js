const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    content: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    isRead: { type: Boolean, required: true, default: false },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
