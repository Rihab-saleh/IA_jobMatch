// src/services/recommendation-service.js
import { api } from "./api"

export const recommendationService = {
  getRecommendationsForUser(userId, limit = 10) {
    return api.get(`/recommendations/user/${userId}`, {
      params: { limit },
    }).then(response => {
      console.log("Recommandations reçues :", response.data);
      return response;
    }).catch(error => {
      console.error("Erreur lors de la récupération des recommandations :", error);
      throw error;
    });
  },
  

  // GET saved job recommendations (ajouté si besoin)
  getSavedJobRecommendations(userId) {
    return api.get(`/recommendations/recommendations/${userId}/saved`, {
 
    });
  }

}
