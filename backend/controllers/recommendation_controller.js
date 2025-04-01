const recommendationService = require('../services/recommendationService');

/**
 * Get job recommendations for a user
 */
exports.getRecommendationsForUser = async () => {
  const limit = 10;

  try {
    const recommendations = await recommendationService.getRecommendationsForUser('67dde12c6b75212cf0dd88ee', limit);
    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations for user:', error);
    throw new Error('Failed to fetch recommendations');
  }
};

/**
 * Get job recommendations based on a text profile
 */
exports.getRecommendationsFromText = async (req, res) => {
  const { profileText } = req.body;
  const limit = parseInt(req.query.limit, 10) || 10;

  if (!profileText) {
    return res.status(400).json({ error: 'Profile text is required' });
  }

  try {
    const recommendations = await recommendationService.getRecommendationsFromText(profileText, limit);
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations from text:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};