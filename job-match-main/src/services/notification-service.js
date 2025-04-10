import axios from "axios";

/**
 * Get the base URL for the API
 * Use a hardcoded fallback if process.env is not available
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Get the authentication token from localStorage
 * @returns {string} The authentication token or empty string
 */
const getToken = () => {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("auth_token");

  // Add validation for token format
  if (!token || typeof token !== "string") {
    console.error("Invalid token format in localStorage");
    return "";
  }

  return token.trim(); // Remove any accidental whitespace
};

/**
 * Create axios instance with base configuration
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Notification service for managing user notifications
 */
export const notificationService = {
  /**
   * Get all notifications for the current user
   * @returns {Promise<Array>} List of notifications
   */
  async getNotifications() {
    try {
      const token = getToken();
      
      // Debugging logs
      console.debug('Making request to /notifications with token:', token ? 'present' : 'missing');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await api.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("API Error Details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      if (error.response?.status === 401) {
        // Handle unauthorized error (e.g., clear invalid token)
        localStorage.removeItem('token');
        // Optionally redirect to login
        window.location.href = '/login';
      }
      
      throw error;
    }
  },

  /**
   * Get notification settings for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification settings
   */
  getSettings: async function(userId) {
    try {
      const token = getToken();
      const response = await api.get(`/notifications/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notification settings:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update notification settings for a user
   * @param {string} userId - User ID
   * @param {Object} settings - Updated settings object
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(userId, settings) {
    try {
      const token = getToken();
      const response = await api.put(`/notifications/${userId}`, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating notification settings:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId) {
    try {
      const token = getToken();
      const response = await api.put(`/notifications/${notificationId}/mark-as-read`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Send job alert email
   * @param {string} userId - User ID
   * @param {Object} jobAlertData - Job alert data
   * @returns {Promise<Object>} Response data
   */
  async sendJobAlertEmail(userId, jobAlertData) {
    try {
      const token = getToken();
      const response = await api.post(`/notifications/${userId}/job-alert`, jobAlertData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error sending job alert email:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Verify email configuration
   * @returns {Promise<Object>} Email configuration status
   */
  async verifyEmailConfig() {
    try {
      const token = getToken();
      const response = await api.get("/notifications/verify-email-config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error verifying email configuration:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} Authentication status
   */
  async checkAuth() {
    try {
      const token = getToken();
      const response = await api.get("/notifications/check-auth", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.authenticated;
    } catch (error) {
      console.error("Error checking authentication:", error.response?.data || error.message);
      return false;
    }
  },
};