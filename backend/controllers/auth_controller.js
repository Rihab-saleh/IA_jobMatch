const authService = require("../services/authService");
const crypto = require('crypto');
const PasswordResetToken = require("../models/PasswordResetToken");
const { transporter } = require("../config/emailConfig");

/**
 * Handle user signup
 */
const signup = async (req, res) => {
  try {
    // Validate request body
    const { firstName, lastName, email, password, age } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Call auth service to handle signup
    const response = await authService.signup({ firstName, lastName, email, password, age });
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
 * Handle user login
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
    res.status(200).json(response);
  } catch (err) {
    console.error("Login error:", err);

    // Handle specific errors
    if (err.message === "User not found" || err.message === "Invalid credentials") {
      return res.status(401).json({ error: err.message });
    }

    res.status(500).json({ error: "An error occurred during login" });
  }
};

/**
 * Handle forgot password request
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Call auth service to handle forgot password
    const response = await authService.forgotPassword(email, hashedToken);

    // Send email with reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&id=${response.userId}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error("Forgot password error:", err);

    // Handle specific errors
    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "An error occurred during password reset request" });
  }
};

/**
 * Handle password reset
 */
const resetPassword = async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;

    if (!userId || !token || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Call auth service to handle password reset
    const response = await authService.resetPassword(userId, hashedToken, newPassword);

    // Send password changed notification
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: response.email,
      subject: 'Password Changed Successfully',
      html: `<p>Your password has been successfully changed.</p>`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Reset password error:", err);

    // Handle specific errors
    if (err.message === "Invalid or expired token") {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === "User not found") {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: "An error occurred during password reset" });
  }
};

module.exports = { 
  signup, 
  login, 
  forgotPassword, 
  resetPassword 
};