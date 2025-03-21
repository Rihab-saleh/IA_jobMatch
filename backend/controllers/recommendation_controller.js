const recommendationService = require("../services/recommendationService")

const getUserRecommendations = async (req, res) => {
  try {
    const recommendations = await recommendationService.getUserRecommendations(req.user._id)
    res.status(200).json(recommendations)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const acceptRecommendation = async (req, res) => {
  try {
    const result = await recommendationService.updateRecommendationStatus(req.user._id, req.params.jobId, "Accepted")
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

const rejectRecommendation = async (req, res) => {
  try {
    const result = await recommendationService.updateRecommendationStatus(req.user._id, req.params.jobId, "Rejected")
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Export the functions
module.exports = {
  getUserRecommendations,
  acceptRecommendation,
  rejectRecommendation,
}

