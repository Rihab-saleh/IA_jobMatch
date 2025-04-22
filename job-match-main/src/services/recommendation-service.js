// src/services/recommendation-service.js
import { api } from "./api"

export const recommendationService = {
  getRecommendationsForUser(userId, limit = 10) {
    return api.get(`/recommendations/user/${userId}`, {
      params: { limit },
      // Add a longer timeout since the LLM processing might take time
      timeout: 600000000, // 60 seconds
    })
  },

  getRecommendationsFromText(profileText, limit = 10) {
    return api.post(
      "/recommendations/profile",
      { profileText },
      {
        params: { limit },
        timeout: 60000000, // 60 seconds
      },
    )
  },
}
