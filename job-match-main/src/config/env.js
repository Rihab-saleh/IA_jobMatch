// Environment variables in React need to be prefixed with VITE_
// This helper makes it easier to access them

export const env = {
  // API URL
  apiUrl:  "http://localhost:5000/api",

  // Authentication
  authTokenName: "auth_token",

  // Feature flags
  enableAIRecommendations:  "true",

  // Other config
  maxFileUploadSize: 5 * 1024 * 1024, // 5MB

  // Development helpers
  isDevelopment: "development",
  isProduction: "production",
}

