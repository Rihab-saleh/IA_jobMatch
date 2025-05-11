const mongoose = require('mongoose');
const Notification = require('../models/notification_model');
const User = require('../models/user_model');

const notificationController = {
  getAllNotifications: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized: Missing user authentication' 
        });
      }

      const notifications = await Notification.find({
        userId: new mongoose.Types.ObjectId(req.user._id)
      }).sort({ createdAt: -1 });

      res.json({ success: true, notifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized: Missing user authentication' 
        });
      }

      const result = await Notification.deleteOne({
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId(req.user._id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({ 
        success: true, 
        message: 'Notification deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;
