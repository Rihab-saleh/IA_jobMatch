const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const nodemailer = require("nodemailer")
const Person = require("../models/person_model")
const Admin = require("../models/admin_model")
const User = require("../models/user_model")
const crypto = require("crypto")

dotenv.config()

// Configuration JWT
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key"

// Configuration Nodemailer améliorée
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true pour le port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
  logger: true,
  debug: true,
})

// Vérification de la connexion SMTP
transporter.verify((error) => {
  if (error) {
    console.error("❌ Erreur de connexion SMTP:", error)
  } else {
    console.log("✅ Serveur SMTP prêt")
  }
})

// Fonctions d'authentification
const generateToken = (id, role, fullName, email) => {
  return jwt.sign({ id, role, fullName, email }, SECRET_KEY, { expiresIn: "2h" })
}

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, REFRESH_SECRET_KEY, { expiresIn: "7d" })
}

// Fonction d'inscription
const signup = async (userData) => {
  const { firstName, lastName, email, password, age } = userData

  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required")
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format")
  }

  const existingPerson = await Person.findOne({ email })
  if (existingPerson) throw new Error("User already exists")

  const hashedPassword = await bcrypt.hash(password, 10)

  const newPerson = new Person({
    firstName,
    lastName,
    email,
    age: age || null,
    password: hashedPassword,
    role: "user",
    accountStatusRequests: [],
  })

  await newPerson.save()

  const newUser = new User({
    person: newPerson._id,
  })

  await newUser.save()

  const token = generateToken(
    newUser._id,
    newPerson.role,
    `${newPerson.firstName} ${newPerson.lastName}`,
    newPerson.email,
  )

  const refreshToken = generateRefreshToken(newUser._id)

  return {
    token,
    refreshToken,
    id: newUser._id,
    email: newPerson.email,
    fullName: `${newPerson.firstName} ${newPerson.lastName}`,
    role: newPerson.role,
  }
}

// Fonction de connexion
const login = async (loginData) => {
  try {
    const { email, password } = loginData
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid email or password format")
    }

    const person = await Person.findOne({ email: email.trim() })
    if (!person) throw new Error("User not found")

    const isMatch = await bcrypt.compare(password, person.password)
    if (!isMatch) throw new Error("Invalid password")

    let token, refreshToken, id

    if (person.role === "admin") {
      const admin = await Admin.findOne({ person: person._id })
      if (!admin) throw new Error("Admin data not found")
      id = admin._id
    } else {
      const user = await User.findOne({ person: person._id })
      if (!user) throw new Error("User data not found")
      id = user._id
    }

    token = generateToken(id, person.role, `${person.firstName} ${person.lastName}`, person.email)

    refreshToken = generateRefreshToken(id)

    return {
      token,
      refreshToken,
      id,
      email: person.email,
      fullName: `${person.firstName} ${person.lastName}`,
      role: person.role,
    }
  } catch (error) {
    console.error("Login error:", error.message)
    throw error
  }
}

// Fonctions de réinitialisation de mot de passe
const generateResetToken = (person) => {
  return jwt.sign({ email: person.email, id: person._id }, SECRET_KEY, { expiresIn: "24h" })
}

const verifyResetToken = (token) => {
  return new Promise((resolve) => {
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      resolve(err ? false : decoded.email)
    })
  })
}

const forgotPassword = async (email) => {
  const person = await Person.findOne({ email })
  if (!person) throw new Error("User not found")

  // Generate a simple token that's easier to debug
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Store the token and set expiration
  person.resetToken = resetToken
  person.resetTokenExpires = Date.now() + 3600000 // 1 hour from now
  await person.save()

  // Create a reset URL that points to your frontend
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`

  // Log the URL for testing (you can copy-paste this in your browser)
  console.log("Password reset link:", resetUrl)

  // Send email with the reset link
  try {
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
        <p>If the link doesn't work, copy and paste this URL into your browser:</p>
        <p>${resetUrl}</p>
      `,
    })

    console.log("Reset email sent successfully")
    return { message: "Reset email sent" }
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Failed to send reset email")
  }
}


const resetPassword = async (token, newPassword) => {
  try {
    // Find the person by the reset token directly instead of trying to verify it as a JWT
    const person = await Person.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    })

    if (!person) throw new Error("Invalid or expired token")

    // Update the password
    person.password = await bcrypt.hash(newPassword, 10)

    // Clear the reset token fields
    person.resetToken = undefined
    person.resetTokenExpires = undefined

    await person.save()

    return { message: "Password reset successful" }
  } catch (err) {
    console.error("Reset password error:", err)
    throw new Error(err.message || "Invalid token")
  }
}

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  generateToken,
  generateRefreshToken,
}

