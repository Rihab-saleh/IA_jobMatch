require("dotenv").config()

module.exports = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
  },
  db: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017/jobRecommendation",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
}

