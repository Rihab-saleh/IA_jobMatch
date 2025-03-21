const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const Person = require("../models/person_model")
const User = require("../models/user_model")

dotenv.config()
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key"

/**
 * Generate JWT token for authentication
 * @param {string} userId - User ID to include in token
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  console.log("Generating token for user:", userId, "with role:", role)
  // Include both id and userId for backward compatibility
  return jwt.sign({ id: userId, userId: userId, role: role }, SECRET_KEY, { expiresIn: "7d" })
}

/**
 * Handle user signup
 * @param {Object} userData - User data for signup
 * @returns {Object} User data and token
 */
const signup = async (userData) => {
  const { firstName, lastName, email, password, age } = userData

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required")
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format")
  }

  // Check if user already exists
  const existingPerson = await Person.findOne({ email })
  if (existingPerson) throw new Error("User already exists")

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create new person
  const newPerson = new Person({
    firstName,
    lastName,
    email,
    age: age || null,
    password: hashedPassword,
    role: "user", // Always set to "user" for signup
    accountStatusRequests: [], // Initialize empty array
  })

  await newPerson.save()

  // Create new user
  const newUser = new User({
    person: newPerson._id,
  })

  await newUser.save()

  // Generate token and return user data
  const token = generateToken(newUser._id, newPerson.role)

  console.log("User signed up successfully:", newUser._id)

  return {
    token,
    user: {
      _id: newUser._id,
      person: {
        _id: newPerson._id,
        firstName: newPerson.firstName,
        lastName: newPerson.lastName,
        email: newPerson.email,
        role: newPerson.role,
      },
    },
  }
}

/**
 * Handle user login
 * @param {Object} credentials - Login credentials
 * @returns {Object} User data and token
 */
const login = async ({ email, password }) => {
  // Validate required fields
  if (!email || !password) {
    throw new Error("Email and password are required")
  }

  // Find person by email
  const person = await Person.findOne({ email })
  if (!person) throw new Error("User not found")

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, person.password)
  if (!isPasswordValid) throw new Error("Invalid credentials")

  // For admin users, we don't need to find a User record
  if (person.role === "admin") {
    const token = generateToken(person._id, person.role)

    console.log("Admin logged in successfully:", person._id)

    return {
      token,
      user: {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        role: person.role,
      },
      role: person.role,
    }
  }

  // For regular users, find the associated User record
  const user = await User.findOne({ person: person._id })
  if (!user) throw new Error("User not found")

  // Generate token and return user data
  const token = generateToken(user._id, person.role)

  console.log("User logged in successfully:", user._id)

  return {
    token,
    user: {
      _id: user._id,
      person: {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        role: person.role,
      },
    },
    role: person.role,
  }
}

module.exports = { signup, login }

