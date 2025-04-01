const express = require('express');
const userPreferencesController = require('../controllers/preference_controller');
//const authMiddleware = require('../middlewares/authMiddleware'); // Ensure user is authenticated

const router = express.Router();

router.post('/', userPreferencesController.savePreferences);
router.get('/',  userPreferencesController.getPreferences);
router.delete('/', userPreferencesController.deletePreferences);

module.exports = router;
