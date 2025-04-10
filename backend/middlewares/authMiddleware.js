const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const Person = require("../models/person_model");
const e = require("express");

dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// Public routes that don't require authentication
const publicRoutes = new Set([
  // Auth routes
  { path: /^\/api\/auth\/signup$/, method: "POST" },
  { path: /^\/api\/auth\/login$/, method: "POST" },

  // Public user routes
  { path: /^\/api\/users\/profile\/[^/]+$/, method: "GET" },
  { path: /^\/api\/users\/skills\/[^/]+$/, method: "GET" },
  { path: /^\/api\/users\/jobs\/[^/]+$/, method: "GET" },
  { path: /^\/api\/users\/recommendations\/[^/]+$/, method: "GET" },
  { path: /^\/api\/users\/formations\/[^/]+$/, method: "GET" },
  { path: /^\/api\/users\/experiences\/[^/]+$/, method: "GET" },
]);

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données et a le rôle "user"
 */
const userMiddleware = (req, res, next) => {
  console.log("User Middleware: Checking user ownership and role")
  console.log("Request params:", req.params)
  console.log("Authenticated user:", req.user ? req.user._id : "None")

  if (!req.user) {
    console.log("User Middleware: No authenticated user found")
    return res.status(401).json({ error: "Authentication required" })
  }

  // IMPORTANT: Change from req.params.id to req.params.userId to match your routes
  const requestedUserId = req.params.userId
  const authUserId = req.user._id
  const authUserRole = req.user.role

  console.log("Comparing IDs:", requestedUserId, "vs", authUserId.toString())

  // Check if IDs match
  if (!requestedUserId || requestedUserId !== authUserId.toString()) {
    console.log("User Middleware: Unauthorized access attempt")
    console.log("  Requested ID:", requestedUserId)
    console.log("  Auth User ID:", authUserId.toString())
    return res.status(403).json({
      error: "You can only access your own data",
      requestedId: requestedUserId,
      yourId: authUserId.toString(),
    })
  }

  // Check role
  if (authUserRole !== "user") {
    console.log("User Middleware: User does not have the required role. Role:", authUserRole)
    return res.status(403).json({ error: "Access restricted to users with role 'user'" })
  }

  console.log("User Middleware: User ownership and role verified")
  next()
}



/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authMiddleware = async (req, res, next) => {
  console.log("Auth Middleware: Checking route", req.method, req.originalUrl);

  // Check if the route is public
  const isPublicRoute = [...publicRoutes].some(
    (route) => route.method === req.method && route.path.test(req.originalUrl)
  );

  if (isPublicRoute) {
    console.log("Auth Middleware: Public route, skipping authentication");
    return next();
  }

  // Get the token from the Authorization header
  const authHeader = req.header("Authorization");
  console.log("Authorization Header Received:", authHeader);

  if (!authHeader) {
    console.log("No Authorization header provided");
    return res.status(401).json({ error: "Authentication required" });
  }
  // Check if the header follows the Bearer token format
  if (!authHeader.startsWith("Bearer ")) {
    console.log("Auth Middleware: Invalid Authorization format");
    return res.status(401).json({ error: "Invalid token format" });
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify token structure
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    console.log("Auth Middleware: Invalid token structure");
    return res.status(401).json({ error: "Invalid token structure" });
  }

  try {
    console.log("Auth Middleware: Verifying token");
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Auth Middleware: Decoded token:", decoded);

    // Check if the token contains a user ID
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      console.log("Auth Middleware: Token does not contain user ID");
      return res.status(401).json({ error: "Invalid token structure" });
    }

    console.log("Auth Middleware: Finding user with ID:", userId);

    // First check in User model
    const user = await User.findById(userId);
    let personData = null;

    if (user) {
      console.log("Auth Middleware: User found in User model");
      personData = await Person.findById(user.person).select("-password");

      if (!personData) {
        console.log("Auth Middleware: Person data not found for User");
        return res.status(401).json({ error: "User data incomplete" });
      }

      req.user = {
        _id: userId,
        person: personData._id,
        email: personData.email,
        fullName: `${personData.firstName} ${personData.lastName}`,
        role: personData.role,
      };
    } else {
      const admin = await Admin.findById(userId);
      if (admin) {
        console.log("Auth Middleware: User found in Admin model");
        req.user = {
          _id: userId,
          role: "admin",
        };
      } else {
        console.log("Auth Middleware: User not found in User or Admin model");
        return res.status(401).json({ error: "User not found" });
      }
    }

    console.log("Auth Middleware: User authenticated:", req.user);
    next();
  } catch (err) {
    console.log("Auth Middleware: Error verifying token:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(401).json({ error: "Authentication failed" });
  }
};

const adminMiddleware = (req, res, next) => {
  console.log("Admin Middleware: Checking user role");
  if (!req.user) {
    console.log("Admin Middleware: No user object found");
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    console.log(
      "Admin Middleware: User is not an admin. User role:",
      req.user.role
    );
    return res.status(403).json({ error: "Admin access required" });
  }
  console.log("Admin Middleware: Admin access granted");
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  userMiddleware, // Export the new middleware
};
