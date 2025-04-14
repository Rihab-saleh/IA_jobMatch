const recommendationService = require('../services/recommendationService');

/**
 * Get job recommendations for a user with pagination
 */
exports.getRecommendationsForUser = async (userId, page = 1, limit = 10) => {
  console.log("User ID:", userId);
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const offset = (page - 1) * limit;
    const recommendations = await recommendationService.getRecommendationsForUser(userId, limit, offset);
    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations for user:', error);
    throw new Error('Failed to fetch recommendations');
  }
};

/**
 * Get job recommendations based on a text profile with pagination
 */
exports.getRecommendationsFromText = async (req, res) => {
  const { profileText } = req.body;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  if (!profileText) {
    return res.status(400).json({ error: 'Profile text is required' });
  }

  try {
    const offset = (page - 1) * limit;
    const recommendations = await recommendationService.getRecommendationsFromText(profileText, limit, offset);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations from text:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};
