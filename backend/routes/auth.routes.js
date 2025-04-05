const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth_controller")
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware")

router.post(
  "/signup",
  (req, res, next) => {
    
    if (req.body.role === "admin") {
      return res.status(403).json({ error: "Admin signup is not allowed" })
    }
    next()
  },
  authController.signup,
)

router.post("/login", authController.login)


router.get("/verify", authMiddleware, (req, res) => {
  res.status(200).json({
    isValid: true,
    user: {
      _id: req.user._id,
      role: req.user.role,
    },
  })
})


router.get("/admin-data", authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ message: "Admin data accessed successfully" })
})

module.exports = router

