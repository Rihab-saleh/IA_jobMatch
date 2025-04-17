// job_controller.js
const jobService = require("../services/jobService");
const jobApiService = require("../services/jobApiService");

// Helper function
const createMockResults = ({ page = 1, results_per_page = 10 } = {}) => ({
  count: 0,
  results: [],
  currentPage: page,
  totalPages: 0,
  totalJobs: 0,
  sources: { indeed: 0, linkedin: 0, google: 0 }
});

const jobController = {
  // Méthode principale de recherche
  searchJobs: async (req, res) => {
    try {
      const filters = { ...req.body, ...req.query };
      const results = await jobApiService.searchJobs(filters);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Méthode searchJobs1 corrigée
  searchJobs1: async (req, res) => {
    try {
      const searchParams = { 
        ...req.query,
        page: parseInt(req.query.page) || 1,
        results_per_page: parseInt(req.query.results_per_page) || 10 
      };
      const jobs = await jobService.searchJobs(searchParams);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Recherche par compétences
  searchJobsBySkills: async (req, res) => {
    try {
      const { skills, location = "", page = "1", limit = "10" } = req.query;

      if (!skills) {
        return res.status(400).json({ error: "Skills parameter is required" });
      }

      const jobs = await jobService.searchJobsBySkills(
        skills.split(",").map(skill => skill.trim()),
        location,
        Number.parseInt(page),
        Number.parseInt(limit)
      );
      
      res.json(jobs);
    } catch (error) {
      console.error("Error in searchJobsBySkills:", error);
      res.status(500).json({ error: "An error occurred while searching for jobs by skills" });
    }
  },

  // Autres méthodes...
  saveJob: async (req, res) => {
    try {
      const savedJob = await jobService.saveJob(req.body, req.user?.id);
      res.status(201).json(savedJob);
    } catch (error) {
      console.error("Error in saveJob:", error);
      res.status(500).json({ error: "An error occurred while saving the job" });
    }
  },

  getAllJobs: async (req, res) => {
    try {
      const jobsData = await jobService.getAllJobs(
        Number.parseInt(req.query.page) || 1,
        Number.parseInt(req.query.limit) || 10,
        req.user?.id
      );
      res.json(jobsData);
    } catch (error) {
      console.error("Error in getAllJobs:", error);
      res.status(500).json({ error: "An error occurred while fetching jobs" });
    }
  },

  getAllJobsFromAdzuna: async (req, res) => {
    try {
      const jobs = await jobService.getAllJobsFromAdzuna(
        req.query.what || "",
        req.query.where || "",
        Number.parseInt(req.query.page) || 1,
        Number.parseInt(req.query.limit) || 10
      );
      res.json(jobs);
    } catch (error) {
      console.error("Error in getAllJobsFromAdzuna:", error);
      res.status(500).json(createMockResults({
        page: Number.parseInt(req.query.page) || 1,
        results_per_page: Number.parseInt(req.query.limit) || 10
      }));
    }
  },

  getScrapedJobs: async (req, res) => {
    try {
      const jobs = await jobService.getScrapedJobs(
        req.query.query || "",
        req.query.location || "",
        Number.parseInt(req.query.page) || 1,
        Number.parseInt(req.query.limit) || 10
      );
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error in getScrapedJobs:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllJobsFromScraping: async (req, res) => {
    try {
      const jobs = await jobService.getAllJobsFromScraping(
        Number.parseInt(req.query.page) || 1,
        Number.parseInt(req.query.limit) || 10
      );
      res.status(200).json(jobs);
    } catch (error) {
      console.error("Error in getAllJobsFromScraping:", error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = jobController;
