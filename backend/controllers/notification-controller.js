import * as emailService from '../services/emailService.js';
import Notification from '../models/notification_model.js';

/**
 * Récupère les paramètres de notification
 */
export const getSettings = async (req, res) => {
  try {
    console.log('getSettings appelé avec userId:', req.params.userId);
    console.log('User dans la requête:', req.user);
    
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    
    // Vérifier que l'utilisateur demande ses propres paramètres
    // Ou est un administrateur (si vous avez cette logique)
    if (req.params.userId !== req.user._id && !req.user.isAdmin) {
      return res.status(403).json({ error: "Non autorisé à accéder à ces paramètres" });
    }
    
    // Utiliser l'ID et l'email du token
    const settings = await emailService.getNotificationSettings(
      req.user._id,  // Utiliser l'ID du token plutôt que celui de l'URL
      req.user.email,
      req.user.fullName
    );
    
    res.json(settings);
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(400).json({ error: error.message });
  }
};


/**
 * Met à jour les paramètres de notification
 */
export const updateSettings = async (req, res) => {
  try {
    const updatedSettings = await emailService.updateNotificationSettings(
      req.params.userId,
      req.body
    );
    res.json(updatedSettings);
  } catch (error) {
    console.error("Error in updateSettings:", error.message);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Envoie un email d'alerte d'emploi
 */
export const sendJobAlertEmail = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: "Type and data are required" });
    }

    const result = await emailService.sendJobAlertEmail(type, data, req);

    if (result.success) {
      res.status(200).json({ message: "Email sent successfully", messageId: result.messageId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Error in sendJobAlertEmail:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Récupère les notifications de l'utilisateur
 */
export const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const userId = req.user._id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/**
 * Marque une notification comme lue
 */
export const markAsReadNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Notification marked as read", 
      notification: updatedNotification 
    });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

/**
 * Vérifie la configuration email
 */
export const checkEmailConfig = async (req, res) => {
  try {
    const result = await emailService.verifyEmailConfig();
    res.json(result);
  } catch (error) {
    console.error("Error in checkEmailConfig:", error.message);
    res.status(500).json({ error: error.message });
  }
};