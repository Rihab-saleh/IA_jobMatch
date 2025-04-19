const Notification = require('../models/notification_model');
const User = require('../models/user_model');

const notificationController = {
  getUnreadNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({
        userId: req.user._id,
        read: false
      }).sort('-createdAt');

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch notifications'
      });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate(
        { 
          _id: req.params.id, 
          userId: req.user._id 
        },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ 
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({ 
        success: true, 
        message: 'Notification marked as read' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to update notification'
      });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      const result = await Notification.deleteOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ 
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({ 
        success: true, 
        message: 'Notification deleted' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete notification'
      });
    }
  },

  getJobAlerts: async (req, res) => {
    try {
      const alerts = await Notification.find({
        userId: req.user._id,
        notificationType: 'jobAlert'
      }).sort('-createdAt');

      res.json(alerts);
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch job alerts'
      });
    }
  }
};

module.exports = notificationController;