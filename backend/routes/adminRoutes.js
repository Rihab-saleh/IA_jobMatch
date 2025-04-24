const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin_controller")
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware")
const User = require("../models/user_model")
const AccountStatusRequest = require("../models/accountstatus_request")

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
router.get("/:id", authMiddleware, adminMiddleware, adminController.getAdminById)
router.put("/:id", authMiddleware, adminMiddleware, adminController.updateAdmin)
router.delete("/:id", authMiddleware, adminMiddleware, adminController.deleteAdmin)

module.exports = router