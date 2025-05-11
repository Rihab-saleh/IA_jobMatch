const recommendationService = require('../services/recommendationService2');

exports.getRecommendationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const recommendations = await recommendationService.getRecommendationsForUser(userId);
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return res.status(404).json({ success: false, message: 'No job recommendations found for this user.' });
    }

    await recommendationService.saveRecommendedJobs(userId, recommendations);

    return res.status(200).json({ success: true, recommendations });
  } catch (error) {
    console.error('[ERROR] getRecommendationsForUser:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error while fetching and saving job recommendations.',
      error: error.message
    });
  }
};



exports.getSavedJobRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { recommended } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const savedJobs = await recommendationService.getSavedJobRecommendations(userId);

    if (!Array.isArray(savedJobs) || savedJobs.length === 0) {
      if (recommended === 'true') {
        // 🔄 Aucune recommandation sauvegardée → on génère dynamiquement
        const recommendations = await recommendationService.getRecommendationsForUser(userId);
        return res.status(200).json({ success: true, recommendations });
      }

      // 🔔 Aucun job sauvegardé, mais pas besoin de générer
      return res.status(200).json({ success: true, message: 'Aucune recommandation trouvée pour cet utilisateur.' });
    }

    // ✅ Jobs recommandés existants
    return res.status(200).json({ success: true, savedJobs });

  } catch (error) {
    console.error('[ERROR] getSavedJobRecommendations:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des recommandations.',
      error: error.message
    });
  }
};



exports.scheduleRecommendations = async (req, res) => {
  try {
    await recommendationService.scheduleRecommendations();
    return res.status(200).json({ success: true, message: 'Recommandations programmées avec succès.' });
  } catch (error) {
    console.error('[ERROR] scheduleRecommendations:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la programmation des recommandations.',
      error: error.message
    });
  }
};