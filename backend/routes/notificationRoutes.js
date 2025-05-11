const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification-controller');

// Assure-toi d'utiliser un middleware d'authentification si tu relies à `req.user._id`
router.get('/', notificationController.getAllNotifications);
router.delete('/:id',  notificationController.deleteNotification);
router.put('/:id/mark-as-read',  notificationController.markAsRead); // Marquer une notification comme lue
router.put('/mark-all-as-read', notificationController.markAllAsRead); // Marquer toutes les notifications comme lues
router.delete('/',  notificationController.deleteAllNotifications); // Supprimer toutes les notifications

module.exports = router;
