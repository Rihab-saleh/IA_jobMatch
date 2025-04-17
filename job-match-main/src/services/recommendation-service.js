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
  },
  
  getJobById: async (id) => {
      try {
        const response = await api.get(`/jobs/${id}`);
        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    },
  
  
  // Save or unsave a job
  saveJob(jobData) {
    return api.post('/jobs/save', jobData)
  }
}