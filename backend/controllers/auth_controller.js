const authService = require("../services/authService")

/**
 * Handle user signup
 */
const signup = async (req, res) => {
  try {
    // Validate request body
    const { firstName, lastName, email, password, age } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    // Call auth service to handle signup
    const response = await authService.signup({ firstName, lastName, email, password, age })
    res.status(201).json(response)
  } catch (err) {
    console.error("Signup error:", err)

    // Handle specific errors
    if (err.message === "User already exists") {
      return res.status(409).json({ error: err.message })
    }

    if (err.message.includes("Invalid email")) {
      return res.status(400).json({ error: err.message })
    }

    res.status(500).json({ error: "An error occurred during signup" })
  }
}

/**
 * Handle user login
 */
const login = async (req, res) => {
  try {
    // Validate request body
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Call auth service to handle login
    const response = await authService.login({ email, password })
    res.status(200).json(response)
  } catch (err) {
    console.error("Login error:", err)

    // Handle specific errors
    if (err.message === "User not found" || err.message === "Invalid credentials") {
      return res.status(401).json({ error: err.message })
    }

    res.status(500).json({ error: "An error occurred during login" })
  }
}

module.exports = { signup, login }

