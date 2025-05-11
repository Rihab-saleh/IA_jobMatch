const mongoose = require('mongoose');
const Notification = require('../models/notification_model');
const User = require('../models/user_model');

const notificationController = {
  // Récupérer toutes les notifications avec pagination
  getAllNotifications: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized: Missing user authentication' 
        });
      }

      const page = parseInt(req.query.page) || 1; // Page actuelle
      const limit = parseInt(req.query.limit) || 10; // Nombre de notifications par page
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({
        userId: new mongoose.Types.ObjectId(req.user._id)
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalNotifications = await Notification.countDocuments({
        userId: new mongoose.Types.ObjectId(req.user._id)
      });

      res.json({ 
        success: true, 
        notifications, 
        pagination: {
          total: totalNotifications,
          page,
          limit,
          totalPages: Math.ceil(totalNotifications / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  },

  // Supprimer une notification
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
  },

// Marquer une notification comme lue
markAsRead: async (req, res) => {
  try {
    // Vérification de l'authentification de l'utilisateur
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user authentication',
      });
    }

    // Vérification de l'ID de la notification
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    // Mise à jour de la notification
    const result = await Notification.updateOne(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } }
    );

    // Vérification si la notification a été trouvée et mise à jour
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read successfully',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
    });
  }
},

// Marquer toutes les notifications comme lues
markAllAsRead: async (req, res) => {
  try {
    // Vérification de l'authentification de l'utilisateur
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user authentication',
      });
    }

    // Mise à jour de toutes les notifications non lues
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read successfully`,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
    });
  }
},

  // Supprimer toutes les notifications
  deleteAllNotifications: async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized: Missing user authentication' 
        });
      }

      const result = await Notification.deleteMany({
        userId: new mongoose.Types.ObjectId(req.user._id)
      });

      res.json({ 
        success: true, 
        message: `${result.deletedCount} notifications deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to delete all notifications',
        error: error.message
      });
    }
  }
};

module.exports = notificationController;