const authService = require("../services/authService");

/**
 * Handle user signup
 */
const signup = async (req, res) => {
  try {
    // Validate request body
    const { firstName, lastName, email, password, age, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Call auth service to handle signup
    const response = await authService.signup({ 
      firstName, 
      lastName, 
      email, 
      password, 
      age, 
      phoneNumber 
    });
    
    res.status(201).json(response);
  } catch (err) {
    console.error("Signup error:", err);

    // Handle specific errors
    if (err.message === "User already exists") {
      return res.status(409).json({ error: err.message });
    }

    if (err.message.includes("Invalid email")) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "An error occurred during signup" });
  }
};

/**
 * Handle user login with isActive check
 */
const login = async (req, res) => {
  try {
    // Validate request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Call auth service to handle login
    const response = await authService.login({ email, password });
    
    // Check if user is active (assuming authService.login now returns user status)
    if (response.user && !response.user.isActive) {
      return res.status(403).json({ 
        error: "Your account has been deactivated. Please contact support." 
      });
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Login error:", err);

    // Handle specific errors
    if (err.message === "User not found" || err.message === "Invalid credentials") {
      return res.status(401).json({ error: err.message });
    }

    if (err.message.includes("deactivated")) {
      return res.status(403).json({ error: err.message });
    }

    res.status(500).json({ error: "An error occurred during login" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ message: "Reset email sent" });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { 
  signup, 
  login,
  forgotPassword,
  resetPassword
};