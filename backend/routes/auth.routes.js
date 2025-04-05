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
});

// Route pour mot de passe oublié
router.post('/forgot-password', authController.forgotPassword);

// Route pour réinitialisation du mot de passe
router.post('/reset-password', authController.resetPassword);
router.get("/debug/emails", async (req, res) => {
  try {
    const users = await Person.find({}, 'email');
    res.json(users.map(u => u.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Route pour vérifier le token (optionnel)
router.post('/verify-reset-token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  const email = await authService.verifyResetToken(token);
  if (!email) return res.status(400).json({ error: "Invalid token" });

  const person = await Person.findOne({ email, resetToken: token });
  if (!person) return res.status(400).json({ error: "Invalid token" });

  res.status(200).json({ message: "Token is valid" });
});
module.exports = router

