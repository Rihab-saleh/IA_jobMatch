const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendation_controller');
router.get('/user/:userId', recommendationController.getRecommendationsForUser);
router.get('/recommendations/:userId/saved', recommendationController.getSavedJobRecommendations);

module.exports = router;
