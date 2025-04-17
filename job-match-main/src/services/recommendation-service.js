import { api } from "./api"

export const recommendationService = {
  getJobRecommendations(userId, params = {}) {
    return api.get(`/recommendation/recommend/${userId}`, { 
      params: {
        keyword: params.keyword,
        limit: params.limit
      }
    })
  },
}