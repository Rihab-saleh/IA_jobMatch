// Environment variables in React need to be prefixed with VITE_
// This helper makes it easier to access them

export const env = {
  // API URL
  apiUrl:  "http://localhost:5000/api",

  // Authentication
  authTokenName: "auth_token",

  // Feature flags
  enableAiRecommendations: import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS === "true",
  enableJobRecommendations: import.meta.env.VITE_ENABLE_JOB_RECOMMENDATIONS === "true",

  // Environment
  isDevelopment: import.meta.env.NODE_ENV === "development",
  isProduction: import.meta.env.NODE_ENV === "production"
}

