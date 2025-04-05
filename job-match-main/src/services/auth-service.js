import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const authService = {
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'An error occurred during signup');
    }
  },

  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'An error occurred during login');
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send reset instructions');
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/reset-password`, { 
        token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to reset password');
    }
  }
};

export default authService;