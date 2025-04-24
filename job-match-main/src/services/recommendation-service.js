// src/services/recommendation-service.js
import { api } from "./api"

export const recommendationService = {
  // GET recommendations for a user
  getRecommendationsForUser(userId, limit = 10) {
    return api.get(`/recommendations/user/${userId}`, {
      params: { limit },
     
    })
  },

  // GET saved job recommendations (ajouté si besoin)
  getSavedJobRecommendations(userId) {
    return api.get(`/recommendations/recommendations/${userId}/saved`, {
 
    });
  },

}
