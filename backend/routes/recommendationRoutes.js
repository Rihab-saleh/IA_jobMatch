const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation_controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
router.get('/user/:userId', recommendationController.getRecommendationsForUser);
router.get('/recommendations/:userId/saved', recommendationController.getSavedJobRecommendations);
router.post('/admin/generate-all', adminMiddleware, recommendationController.scheduleRecommendations);

module.exports = router;
