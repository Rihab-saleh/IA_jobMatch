import axios from 'axios';
import { env } from "../config/env";

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem(env.authTokenName);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Base API service for making HTTP requests
export const api = {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional axios options
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}) {
    return axiosInstance.get(endpoint, options).then(response => response.data);
  },

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional axios options
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data, options = {}) {
    return axiosInstance.post(endpoint, data, options).then(response => response.data);
  },

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional axios options
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data, options = {}) {
    return axiosInstance.put(endpoint, data, options).then(response => response.data);
  },

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional axios options
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}) {
    return axiosInstance.delete(endpoint, options).then(response => response.data);
  },
};