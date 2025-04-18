const recommendationService = require('../services/recommendationService2');

/**
 * Get job recommendations for a user with pagination
 */
exports.getRecommendationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'ID utilisateur requis'
      });
    }

    const result = await recommendationService.getRecommendationsForUser(
      userId, 
      page, 
      limit
    );

    res.json({
      success: true,
      ...result,
      pageCount: Math.ceil(result.total / limit)
    });

  } catch (error) {
    console.error('[ERREUR] Contrôleur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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


  