const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Person = require("../models/person_model");
const Admin = require("../models/admin_model");
const User = require("../models/user_model");

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";
const REFRESH_SECRET_KEY =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";

/**
 * Generate JWT token for authentication
 * @param {string} userId - User ID to include in token
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (id, role, firstName, lastName, email) => {
  return jwt.sign({ id, role, firstName, lastName, email }, SECRET_KEY, {
    expiresIn: "2h",
  });
};

/**
 * Generate refresh token for long-lived sessions
 * @param {string} userId - User ID to include in refresh token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id: id }, REFRESH_SECRET_KEY, { expiresIn: "7d" });
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
  const token = generateToken(
    newUser._id,
    newPerson.firstName,
    newPerson.LastName,
    newPerson.email,
    newPerson.role
  );
  const refreshToken = generateRefreshToken(newUser._id);

  return {
    token,
    refreshToken,
    userId: newUser._id,
  };
};

const login = async (loginData) => {
  try {
    const { email, password } = loginData;
    if (typeof email !== "string" || typeof password !== "string") {
      throw new Error("Invalid email or password format");
    }

    const person = await Person.findOne({ email: email.trim() });

    if (!person) {
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    let token;
    let refreshToken;
    if (person.role === "admin") {
      const admin = await Admin.findOne({ person: person._id });

      if (!admin) {
        throw new Error("Admin data not found");
      }
      token = generateToken(
        admin._id,
        person.firstName,
        person.LastName,
        person.email,
        person.role
      );
      refreshToken = generateRefreshToken(admin._id);
      return {
        token,
        refreshToken,
        id: admin._id,
        role: person.role,
        email: person.email,
        fullName: `${person.firstName} ${person.lastName}`,
      };
    } else {
      const user = await User.findOne({ person: person._id });

      if (!user) {
        throw new Error("User data not found");
      }
      token = generateToken(
        user._id,
        person.firstName,
        person.LastName,
        person.email,
        person.role
      );
      refreshToken = generateRefreshToken(user._id);
      return {
        token,
        refreshToken,
        email: person.email,
        fullName: `${person.firstName} ${person.lastName}`,
        id: user._id,
        role: person.role,
      };
    }
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

module.exports = { signup, login };

