
import { api } from "./api"

export const notificationService = {
  async getSettings(userId) {
    try {
      const response = await api.get(`/api/user/notifications?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  async updateSettings(userId, settings) {
    try {
      const response = await api.put(`/api/user/notifications/${userId}`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  async sendJobAlertEmail(userId, userEmail, jobData) {
    try {
      const response = await api.post('/api/notifications/job-alert', {
        jobData
      });
      return response.data;
    } catch (error) {
      console.error('Error sending job notification:', error);
      throw error;
    }
  }
};