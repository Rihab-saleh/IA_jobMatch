// routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const {getRecommendationsForUser, getRecommendationsFromText}= require('../controllers/recommendation_controller');

// Get job recommendations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await  getRecommendationsForUser({
      params: { userId },
      query: { page, limit }
    }, res);

    res.json(result);
  } catch (error) {
    console.error('Erreur route:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne'
    });
  }
});

// Get job recommendations based on profile text
router.post('/profile', async (req, res) => {
  try {
    const { profileText } = req.body;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!profileText) {
      return res.status(400).json({ success: false, error: 'Profile text is required' });
    }
    
    const recommendations = await getRecommendationsFromText(profileText, limit);
    
    res.json({ success: true, recommendations });
  } catch (error) {
    console.error('Error getting recommendations from profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;