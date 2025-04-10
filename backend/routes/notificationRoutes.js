const express = require("express");
const notificationController = require("../controllers/notification-controller.js");
const { authMiddleware, userMiddleware } = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Route to check if the user is authenticated
router.get("/check-auth", authMiddleware, (req, res) => {
  if (req.user) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});
// Route to verify email configuration
router.get("/verify-email-config", authMiddleware, notificationController.checkEmailConfig);

// Route to get notification settings for a user
router.get("/:userId", authMiddleware, userMiddleware, notificationController.getSettings);

// Route to update notification settings for a user
router.put("/:userId", authMiddleware, userMiddleware, notificationController.updateSettings);

// Route to send job notifications to a user
router.post("/:userId/job-alert", authMiddleware, userMiddleware, notificationController.sendJobAlertEmail);

router.get("/", authMiddleware, notificationController.getNotifications);

router.put("/:notificationId/mark-as-read", authMiddleware, notificationController.markAsReadNotification);

module.exports = router;
