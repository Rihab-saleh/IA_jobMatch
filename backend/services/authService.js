const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Person = require("../models/person_model");
const User = require("../models/user_model");

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";

/**
 * Generate JWT token for authentication
 * @param {string} userId - User ID to include in token
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, userId: userId, role: role }, SECRET_KEY, { expiresIn: "1h" });
};

/**
 * Generate refresh token for long-lived sessions
 * @param {string} userId - User ID to include in refresh token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, REFRESH_SECRET_KEY, { expiresIn: "7d" });
};

/**
 * Handle user signup
 * @param {Object} userData - User data for signup
 * @returns {Object} User data and tokens
 */
const signup = async (userData) => {
  const { firstName, lastName, email, password, age } = userData;

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    throw new Error("All fields are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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
    email,
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

  // Generate token and refresh token
  const token = generateToken(newUser._id, newPerson.role);
  const refreshToken = generateRefreshToken(newUser._id);

  return {
    token,
    refreshToken,
    userId: newUser._id,
  };
};


const login = async (loginData) => {
  try {
    const { email, password } =loginData;
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid email or password format");
    }

    console.log("Logging in with email:", email);

    const person = await Person.findOne({ email: email.trim() });

    if (!person) {
      console.log("User not found");
      throw new Error("User not found");
    }

    console.log("User found:", person);

    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) {
      console.log("Invalid password");
      throw new Error("Invalid password");
    }

    console.log("Password matched");

    const user = await User.findOne({ person: person._id });
    if (!user) {
      throw new Error("User data not found");
    }

    console.log("User data:", user);

    const token = generateToken(user._id, person.role);
    const refreshToken = generateRefreshToken(user._id);

    console.log("Generated token:", token);
    console.log("Generated refresh token:", refreshToken);

    return {
      token,
      refreshToken,
      userId: user._id,
    };
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};


module.exports = { signup, login };
