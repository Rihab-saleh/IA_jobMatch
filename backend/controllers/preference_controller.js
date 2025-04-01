const userPreferencesService = require('../services/preferenceService');

/**
 * Save or update user preferences
 */
async function savePreferences(req, res) {
  try {
    const userId = '67dde12c6b75212cf0dd88ee'; // Assuming user ID is available in req.user
    const preferences = req.body;
    
    const savedPreferences = await userPreferencesService.saveUserPreferences(userId, preferences);
    res.status(200).json({ message: 'Preferences saved successfully', data: savedPreferences });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Get user preferences
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    
    const preferences = await userPreferencesService.getUserPreferences(userId);
    if (!preferences) {
      return res.status(404).json({ message: 'Preferences not found' });
    }
    
    res.status(200).json(preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

/**
 * Delete user preferences
 */
async function deletePreferences(req, res) {
  try {
    const userId = req.user.id;
    
    const deletedPreferences = await userPreferencesService.deleteUserPreferences(userId);
    if (!deletedPreferences) {
      return res.status(404).json({ message: 'Preferences not found' });
    }
    
    res.status(200).json({ message: 'Preferences deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  savePreferences,
  getPreferences,
  deletePreferences,
};
