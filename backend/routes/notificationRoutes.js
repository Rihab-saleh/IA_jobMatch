const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification-controller');

// Assure-toi d'utiliser un middleware d'authentification si tu relies à `req.user._id`
router.get('/', notificationController.getAllNotifications);
router.delete('/:id',  notificationController.deleteNotification);

module.exports = router;
