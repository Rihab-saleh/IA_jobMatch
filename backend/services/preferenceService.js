const UserPreferences = require('../models/UserPreferences_model');

/**
 * Create or update user preferences
 * @param {string} userId - The user's ID
 * @param {object} preferencesData - The preferences data
 * @returns {Promise<object>} - The saved preferences
 */
async function saveUserPreferences(userId, preferencesData) {
  try {
    const updatedPreferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { ...preferencesData, userId },
      { new: true, upsert: true, runValidators: true }
    );
    return updatedPreferences;
  } catch (error) {
    throw new Error(`Failed to save user preferences: ${error.message}`);
  }
}

/**
 * Get user preferences by user ID
 * @param {string} userId - The user's ID
 * @returns {Promise<object|null>} - User preferences or null if not found
 */
async function getUserPreferences(userId) {
  return UserPreferences.findOne({ userId });
}

/**
 * Delete user preferences
 * @param {string} userId - The user's ID
 * @returns {Promise<object|null>} - Deleted preferences or null
 */
async function deleteUserPreferences(userId) {
  return UserPreferences.findOneAndDelete({ userId });
}

module.exports = {
  saveUserPreferences,
  getUserPreferences,
  deleteUserPreferences,
};
