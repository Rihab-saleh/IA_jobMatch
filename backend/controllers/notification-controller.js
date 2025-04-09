const emailService = require("../services/emailService.js");

/**
 * Récupère les paramètres de notification
 */
const getSettings = async (req, res) => {
    try {
      const settings = await emailService.getNotificationSettings(
        req.params.userId,
        req.user.email, // Email du token
        req.user.fullName // Nom complet du token
      );
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

/**
 * Met à jour les paramètres de notification
 */
const updateSettings = async (req, res) => {
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

const sendJobAlertEmail = async (req, res) => {
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
 * Vérifie la configuration email
 */
const checkEmailConfig = async (req, res) => {
  try {
    const result = await emailService.verifyEmailConfig();
    res.json(result);
  } catch (error) {
    console.error("Error in checkEmailConfig:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions using CommonJS
module.exports = {
  getSettings,
  updateSettings,
  sendJobAlertEmail,
  checkEmailConfig,
};