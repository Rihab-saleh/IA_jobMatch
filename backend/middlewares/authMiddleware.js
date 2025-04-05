const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const Person = require("../models/person_model");

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

  if (!authHeader) {
    console.log("Auth Middleware: No Authorization header provided");
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check if the header follows the Bearer token format
  if (!authHeader.startsWith("Bearer ")) {
    console.log(
      "Auth Middleware: Invalid Authorization format, expected 'Bearer token'"
    );
    return res.status(401).json({ error: "Invalid token format" });
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify token structure (should have 3 parts separated by dots)
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    console.log("Auth Middleware: Invalid token structure, expected 3 parts");
    return res.status(401).json({ error: "Invalid token structure" });
  }

  try {
    console.log("Auth Middleware: Verifying token");
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log(
      "Auth Middleware: Decoded token:",
      JSON.stringify(decoded, null, 2)
    );

    // Check if the token contains a user ID (could be either id or userId)
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      console.log("Auth Middleware: Token does not contain user ID");
      return res.status(401).json({ error: "Invalid token structure" });
    }

    console.log("Auth Middleware: Finding user with ID:", userId);

    // First check in User model
    const user = await User.findById(userId);
    let personData = null;

    // If found in User model, get the associated Person data
    if (user) {
      console.log(
        "Auth Middleware: User found in User model, getting Person data"
      );
      personData = await Person.findById(user.person).select("-password");

      if (!personData) {
        console.log("Auth Middleware: Person data not found for User");
        return res.status(401).json({ error: "User data incomplete" });
      }

      // Set user object with necessary data
      req.user = {
        _id: userId, // Use the ID from the token directly
        person: personData._id,
        role: personData.role,
      };
    } else {
      // If not found in User model, check in Admin model
      const admin = await Admin.findById(userId);
      if (admin) {
        console.log("Auth Middleware: User found in Admin model");
        req.user = {
          _id: userId, // Use the ID from the token directly
          role: "admin",
        };
      } else {
        // If not found in User or Admin model, check in Person model (for other users)
        console.log(
          "Auth Middleware: User not found in User or Admin model, checking Person model"
        );
        personData = await Person.findById(userId).select("-password");

        if (!personData) {
          console.log("Auth Middleware: User not found in any model");
          return res.status(401).json({ error: "User not found" });
        }

        // Set user object with necessary data
        req.user = {
          _id: userId, // Use the ID from the token directly
          role: personData.role,
        };
      }
    }

    console.log(
      "Auth Middleware: User authenticated",
      req.user._id,
      "Role:",
      req.user.role
    );
    next();
  } catch (err) {
    console.log("Auth Middleware: Error", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Admin middleware
 * Verifies user has admin role
 * Must be used after authMiddleware
 */
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
