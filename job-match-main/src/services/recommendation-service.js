import { api } from "./api"

export const recommendationService = {
  // Get job recommendations for a user
  getRecommendationsForUser(userId, limit = 10) {
    return api.get(`/recommendations/user/${userId}`, {
      params: { limit }
    })
  },

  // Get job recommendations based on profile text
  getRecommendationsFromText(profileText, limit = 10) {
    return api.post('/recommendations/profile', 
      { profileText },
      { params: { limit } }
    )
  }
}