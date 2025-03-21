// Environment variables in React need to be prefixed with REACT_APP_
// This helper makes it easier to access them

export const env = {
  // API URL
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:3001/api",

  // Authentication
  authTokenName: "job_portal_auth_token",

  // Feature flags
  enableAIRecommendations: process.env.REACT_APP_ENABLE_AI_RECOMMENDATIONS === "true",

  // Other config
  maxFileUploadSize: 5 * 1024 * 1024, // 5MB

  // Development helpers
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
}

