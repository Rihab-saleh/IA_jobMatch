const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification-controller');
const authMiddleware = require('../middlewares/authMiddleware');



// Récupérer les notifications non lues
router.get('/', notificationController.getUnreadNotifications);

// Marquer une notification comme lue
router.put('/:id/read', notificationController.markAsRead);

// Supprimer une notification
router.delete('/:id', notificationController.deleteNotification);

// Récupérer les alertes emploi spécifiques
router.get('/job-alerts', notificationController.getJobAlerts);

module.exports = router;