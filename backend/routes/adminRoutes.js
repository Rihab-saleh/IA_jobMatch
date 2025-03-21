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

router.get("/account-requests", authMiddleware, adminMiddleware, adminController.getAccountStatusRequests)
router.get("/account-requests/:userId", authMiddleware, adminMiddleware, adminController.getUserAccountStatusRequests)
router.delete("/user/delete/:userId", authMiddleware, adminMiddleware, adminController.deleteUser)
router.put("/user/toggleStatus/:userId", authMiddleware, adminMiddleware, adminController.toggleUserStatus)
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers)
router.post("/ai/configure", authMiddleware, adminMiddleware, adminController.configureAI)
router.post("/", authMiddleware, adminMiddleware, adminController.createAdmin)
router.get("/", authMiddleware, adminMiddleware, adminController.getAllAdmins)
router.get("/:adminId", authMiddleware, adminMiddleware, adminController.getAdminById)
router.put("/:adminId", authMiddleware, adminMiddleware, adminController.updateAdmin)
router.delete("/:adminId", authMiddleware, adminMiddleware, adminController.deleteAdmin)

module.exports = router

