const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Person = require("../models/person_model");
const Admin = require("../models/admin_model");
const User = require("../models/user_model");

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";

// Helper function to validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate JWT token for authentication
 * @param {string} id - User ID to include in token
 * @param {string} role - User role
 * @param {string} fullName - User's full name
 * @param {string} email - User's email
 * @returns {string} JWT token
 */
const generateToken = (id, role, fullName, email) => {
  if (!id || !role || !fullName || !email) {
    throw new Error("Missing required fields for token generation");
  }
  return jwt.sign({ id, role, fullName, email }, SECRET_KEY, {
    expiresIn: "2h",
  });
};

/**
 * Generate refresh token for long-lived sessions
 * @param {string} id - User ID to include in refresh token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id) => {
  if (!id) throw new Error("User ID is required for refresh token");
  return jwt.sign({ id }, REFRESH_SECRET_KEY, { expiresIn: "7d" });
};

/**
 * Handle user signup
 * @param {Object} userData - User data for signup
 * @returns {Object} User data and tokens
 */
const signup = async (userData) => {
  try {
    const { firstName, lastName, email, password, age } = userData;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      throw new Error("All fields are required");
    }

    // Validate email format
    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    // Check if user already exists
    const existingPerson = await Person.findOne({ email });
    if (existingPerson) throw new Error("User already exists");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new person
    const newPerson = new Person({
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      age: age || null,
      password: hashedPassword,
      role: "user",
      accountStatusRequests: [],
    });

    await newPerson.save();

    // Create new user
    const newUser = new User({
      person: newPerson._id,
    });

    await newUser.save();

    // Generate tokens
    const fullName = `${firstName} ${lastName}`;
    const token = generateToken(newUser._id, newPerson.role, fullName, newPerson.email);
    const refreshToken = generateRefreshToken(newUser._id);

    return {
      token,
      refreshToken,
      userId: newUser._id,
      email: newPerson.email,
      fullName,
      role: newPerson.role,
    };
  } catch (error) {
    console.error("Signup error:", error.message);
    throw error;
  }
};

/**
 * Handle user login
 * @param {Object} loginData - Login credentials
 * @returns {Object} User data and tokens
 */
const login = async (loginData) => {
  try {
    const { email, password } = loginData;

    // Validate input
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid email or password format");
    }

    const cleanEmail = email.trim().toLowerCase();
    const person = await Person.findOne({ email: cleanEmail });

    if (!person) {
      throw new Error("User not found");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const fullName = `${person.firstName} ${person.lastName}`;
    let userData, token, refreshToken;

    if (person.role === "admin") {
      const admin = await Admin.findOne({ person: person._id });
      if (!admin) {
        throw new Error("Admin data not found");
      }
      userData = admin;
    } else {
      const user = await User.findOne({ person: person._id });
      if (!user) {
        throw new Error("User data not found");
      }
      userData = user;
    }

    // Generate tokens
    token = generateToken(userData._id, person.role, fullName, person.email);
    refreshToken = generateRefreshToken(userData._id);

    return {
      token,
      refreshToken,
      id: userData._id,
      role: person.role,
      email: person.email,
      fullName,
    };
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

module.exports = { 
  signup, 
  login,
  generateToken,
  generateRefreshToken
};