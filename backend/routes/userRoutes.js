const express = require("express")
const router = express.Router()
const userController = require("../controllers/user_controller")
const { authMiddleware, userMiddleware } = require("../middlewares/authMiddleware")
const multer = require("multer")
const upload = multer({ storage: multer.memoryStorage() })


router.post('/account/reactivate-request', userController.handlePublicReactivateRequest);

router.use(authMiddleware)
router.get("/profile/:userId", userController.getUserProfile)
router.get("/skills/:userId", userController.getUserSkills)
router.get("/jobs/:userId", userController.getUserJobs)
router.get("/recommendations/:userId", userController.getUserRecommendations)
router.get("/formations/:userId", userController.getFormations)
router.get("/experiences/:userId", userController.getExperiences)
router.put("/skills/:userId/:skillId", userMiddleware, userController.updateUserSkill)
router.put("/profile/:userId", userMiddleware, userController.updateUserProfile)
router.delete("/profile/:userId", userMiddleware, userController.deleteUserProfile)
router.post("/skills/:userId", userMiddleware, userController.addUserSkill)
router.delete("/skills/:userId/:skillId", userMiddleware, userController.removeUserSkill)
router.post("/formations/:userId", userMiddleware, userController.addFormation)
router.put("/formations/:userId/:formationId", userMiddleware, userController.updateFormation)
router.delete("/formations/:userId/:formationId", userMiddleware, userController.deleteFormation)
router.post("/experiences/:userId", userMiddleware, userController.addExperience)
router.put("/experiences/:userId/:experienceId", userMiddleware, userController.updateExperience)
router.delete("/experiences/:userId/:experienceId", userMiddleware, userController.deleteExperience)
router.put("/profile/:userId/job-title", userMiddleware, userController.updateJobTitle)
router.put("/profile/:userId/location", userMiddleware, userController.updateLocation)
router.post("/account/status-request", userMiddleware, userController.requestAccountStatusChange)
router.get("/certifications/:userId", userController.getCertifications)
router.post("/certifications/:userId", userMiddleware, userController.addCertification)
router.put("/certifications/:userId/:certificationId", userMiddleware, userController.updateCertification)
router.delete("/certifications/:userId/:certificationId", userMiddleware, userController.deleteCertification)
// Profile picture routes
router.post(
  "/profile/:userId/picture",
  userMiddleware,
  upload.single("profilePicture"),
  userController.uploadProfilePicture
)

router.get("/profile/:userId/picture", userMiddleware, userController.getProfilePicture)
router.delete("/profile/:userId/picture", userMiddleware, userController.deleteProfilePicture)
router.get('/languages/:userId', userController.getLanguages);
router.post('/languages/:userId', userMiddleware, userController.addLanguage);
router.put('/languages/:userId/:languageId', userMiddleware, userController.updateLanguage);
router.delete('/languages/:userId/:languageId', userMiddleware, userController.deleteLanguage);

// Route pour le numéro de téléphone
router.put('/profile/:userId/phone', userMiddleware, userController.updatePhoneNumber);

module.exports = router

