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

  async getNotifications(page = 1, limit = 10) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await api.get(`/notifications?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
      throw error;
    }
  },


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


  async markAllAsRead() {
    try {
      const token = getToken();
      const response = await api.put(`/notifications/mark-all-as-read`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error.response?.data || error.message);
      throw error;
    }
  },

 
  async deleteNotification(notificationId) {
    try {
      const token = getToken();
      const response = await api.delete(`/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting notification:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete all notifications
   * @returns {Promise<Object>} Response data
   */
  async deleteAllNotifications() {
    try {
      const token = getToken();
      const response = await api.delete(`/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting all notifications:", error.response?.data || error.message);
      throw error;
    }
  },
};