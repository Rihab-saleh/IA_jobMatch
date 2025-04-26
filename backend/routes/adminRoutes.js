const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin_controller")
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware")
const User = require("../models/user_model")
const AccountStatusRequest = require("../models/accountstatus_request")
const AdminConfig = require("../models/adminConfig_model");

router.get("/check", authMiddleware, adminMiddleware, (req, res) => {
  res.json({
    message: "Admin authentication successful",
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  })
})

router.get("/account-requests", authMiddleware, adminMiddleware, adminController.getAccountStatusRequests);
router.put("/account-requests/:requestId", authMiddleware, adminMiddleware, adminController.processAccountStatusRequest);

router.delete("/user/delete/:userId", authMiddleware, adminMiddleware, adminController.deleteUser)
router.put("/users/toggle-status/:userId", authMiddleware, adminMiddleware, adminController.toggleUserStatus);
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers)
router.post("/ai/configure", authMiddleware, adminMiddleware, adminController.configureAI)
router.post("/", authMiddleware, adminMiddleware, adminController.createAdmin)
router.get("/", authMiddleware, adminMiddleware, adminController.getAllAdmins)
router.get('/admin-config', async (req, res) => {
  try {
    const adminConfig = await AdminConfig.findOne(); // Fetch first config
    if (!adminConfig) {
      return res.status(404).json({ success: false, message: 'Admin config not found' });
    }
    res.status(200).json( adminConfig );
  } catch (error) {
    console.error('Error fetching admin config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get("/:id", authMiddleware, adminMiddleware, adminController.getAdminById)
router.put('/admin-config', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let config = await AdminConfig.findOne().sort({ updatedAt: -1 });

    if (!config) {
      config = new AdminConfig();
    }

    const { llmModel, dailyRunTime, allowedApiSources } = req.body;
    if (llmModel) config.llmModel = llmModel;
    if (dailyRunTime) config.dailyRunTime = dailyRunTime;
    if (allowedApiSources) config.allowedApiSources = allowedApiSources;

    await config.save();
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, adminController.updateAdmin)

router.delete("/:id", authMiddleware, adminMiddleware, adminController.deleteAdmin)


module.exports = router