const express = require("express");
const jobController = require("../controllers/job_controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.get("/search", jobController.searchJobs);
router.get("/search-by-skills", jobController.searchJobsBySkills);

// Protected routes
router.post("/save", authMiddleware, jobController.saveJob);
router.get("/all", authMiddleware, jobController.getAllJobs);

// External jobs routes
router.get("/external/all", authMiddleware, adminMiddleware, jobController.getAllJobsFromAdzuna);

// New route for scraped jobs
router.get("/scraped", authMiddleware, jobController.getScrapedJobs);
router.get("/scraped/all", authMiddleware, adminMiddleware, jobController.getAllJobsFromScraping);

module.exports = router;