const express = require('express');
const userPreferencesController = require('../controllers/userPreferencesController');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure user is authenticated

const router = express.Router();

router.post('/', authMiddleware, userPreferencesController.savePreferences);
router.get('/', authMiddleware, userPreferencesController.getPreferences);
router.delete('/', authMiddleware, userPreferencesController.deletePreferences);

module.exports = router;
