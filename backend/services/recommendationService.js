const Recommendation = require("../models/recommendation_model")
const Job = require("../models/job_model")
const User = require("../models/user_model")
const IARecommendation = require("../models/iaRecommendation_model")

class RecommendationService {
  async getUserRecommendations(userId) {
    try {
      return await Recommendation.find({ user: userId }).populate("job")
    } catch (err) {
      logger.error("Error in getUserRecommendations:", err)
      throw new Error(err.message)
    }
  }

  async generateRecommendations(userId) {
    try {
      const user = await User.findById(userId).populate("skills")
      if (!user) throw new Error("User not found")

      const aiRecommendation = await IARecommendation.findOne()
      if (!aiRecommendation) throw new Error("AI Recommendation not configured")

      const jobs = await Job.find()
      const recommendations = jobs.map((job) => {
        const score = this._calculateScore(user, job, aiRecommendation)
        return new Recommendation({
          user: user._id,
          job: job._id,
          matchingScore: score,
          dateGenerated: new Date(),
          status: "Pending",
        })
      })

      await Recommendation.insertMany(recommendations)
      return recommendations
    } catch (err) {
      logger.error("Error in generateRecommendations:", err)
      throw new Error(err.message)
    }
  }

  async updateRecommendationStatus(userId, jobId, status) {
    try {
      const recommendation = await Recommendation.findOneAndUpdate(
        { user: userId, job: jobId },
        { status },
        { new: true },
      )
      if (!recommendation) throw new Error("Recommendation not found")
      return recommendation
    } catch (err) {
      logger.error("Error in updateRecommendationStatus:", err)
      throw new Error(err.message)
    }
  }

  _calculateScore(user, job, aiRecommendation) {
    // Implement the AI-based scoring algorithm here
    // This is a simplified example
    const skillMatch = user.skills.filter((skill) =>
      job.skillsRequired.some((jobSkill) => jobSkill.name === skill.name),
    ).length

    const experienceMatch = job.experienceRequired <= user.yearsOfExperience ? 1 : 0

    const locationMatch = job.location === user.location ? 1 : 0

    const score =
      (skillMatch * aiRecommendation.skillWeight +
        experienceMatch * aiRecommendation.experienceWeight +
        locationMatch * aiRecommendation.locationWeight) /
      (aiRecommendation.skillWeight + aiRecommendation.experienceWeight + aiRecommendation.locationWeight)

    return Math.round(score * 100)
  }
}

module.exports = new RecommendationService()

