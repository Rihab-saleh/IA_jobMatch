import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth'; // Replace with your actual API base URL

/**
 * Register User (Signup)
 * @param {Object} userData - Data for user signup (e.g., firstName, lastName, email, password)
 * @returns {Object} User data and token
 */
const register = async (userData) => {
    console.log(userData)
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data; // Return the response data (user and token)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'An error occurred during signup');
  }
};

/**
 * Login User
 * @param {Object} credentials - User credentials (email and password)
 * @returns {Object} User data and token
 */
const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    console.log(response.data)
    return response.data; // Return the response data (user and token)
  } catch (error) {
    throw new Error(error.response?.data?.message || 'An error occurred during login');
  }
};

export default { register, login }; // Correct the export to match function names
