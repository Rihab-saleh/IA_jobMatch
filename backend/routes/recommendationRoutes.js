const express = require("express")
const router = express.Router()
const recommendationController = require("../controllers/recommendation_controller")
const authMiddleware = require("../middlewares/authMiddleware")

// Check if protect middleware is properly defined before using it
if (typeof authMiddleware.protect === "function") {
  router.use(authMiddleware.protect)
} else {
  console.warn("Warning: Auth protect middleware is not properly defined. Routes will be unprotected.")
}

router.get("/", recommendationController.getUserRecommendations)
router.post("/:jobId/accept", recommendationController.acceptRecommendation)
router.post("/:jobId/reject", recommendationController.rejectRecommendation)

module.exports = router

