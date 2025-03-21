// First, let's add the missing Adzuna API variables at the top of your file
const ADZUNA_API_ID = process.env.ADZUNA_API_ID || "5349e2d4";
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || "4915ded7f0af0dab86aeafbb5a6112f0";
const ADZUNA_BASE_URL = process.env.ADZUNA_BASE_URL || "https://api.adzuna.com/v1/api";

const jobService = require("../services/jobService");

// Move createMockResults function above where it's used
const createMockResults = ({ what = "", where = "", page = 1, results_per_page = 10 } = {}) => ({
  count: 0,
  results: [],
  currentPage: page,
  totalPages: 0,
  totalJobs: 0,
  sources: { indeed: 0, linkedin: 0, google: 0 },
});

const searchJobs = async (req, res) => {
  try {
    const {
      what = "",
      where = "",
      category = "",
      contract_type = "",
      page = "1",
      results_per_page = "10",
      skills = "",
    } = req.query;

    const searchParams = {
      what,
      where,
      category,
      contract_type,
      page: Number.parseInt(page),
      results_per_page: Number.parseInt(results_per_page),
    };

    // Add skills to search params if provided
    if (skills) {
      searchParams.skills = skills.split(",").map((skill) => skill.trim());
    }

    const jobs = await jobService.searchJobs(searchParams);
    res.json(jobs);
  } catch (error) {
    console.error("Error in searchJobs controller:", error);
    res.status(500).json({ error: "An error occurred while searching for jobs" });
  }
};

const searchJobsBySkills = async (req, res) => {
  try {
    const { skills = "", location = "", page = "1", limit = "10" } = req.query;

    if (!skills) {
      return res.status(400).json({ error: "Skills parameter is required" });
    }

    const skillsArray = skills.split(",").map((skill) => skill.trim());
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);

    const jobs = await jobService.searchJobsBySkills(skillsArray, location, pageNum, limitNum);
    res.json(jobs);
  } catch (error) {
    console.error("Error in searchJobsBySkills controller:", error);
    res.status(500).json({ error: "An error occurred while searching for jobs by skills" });
  }
};

const saveJob = async (req, res) => {
  try {
    const jobData = req.body;
    // Add user ID to the job data
    const userId = req.user.id;
    const savedJob = await jobService.saveJob(jobData, userId);
    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error in saveJob controller:", error);
    res.status(500).json({ error: "An error occurred while saving the job" });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    // Pass user ID to get only jobs saved by this user
    const jobsData = await jobService.getAllJobs(page, limit, req.user.id);
    res.json(jobsData);
  } catch (error) {
    console.error("Error in getAllJobs controller:", error);
    res.status(500).json({ error: "An error occurred while fetching jobs" });
  }
};

// Fixed function with proper variable access
const getAllJobsFromAdzuna = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    
    const apiUrl = `${ADZUNA_BASE_URL}/jobs/gb/search/${page}?app_id=${ADZUNA_API_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=${limit}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    const result = {
      count: data.count,
      results: data.results.map((job) => transformAdzunaJob(job)),
      currentPage: page,
      totalPages: Math.ceil(data.count / limit),
      totalJobs: data.count,
    };
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching jobs from Adzuna:", error);
    res.status(500).json(createMockResults({ 
      page: Number.parseInt(req.query.page) || 1, 
      results_per_page: Number.parseInt(req.query.limit) || 10 
    }));
  }
};

// Helper function to transform Adzuna job data
const transformAdzunaJob = (job) => {
  // Add your transformation logic here
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    company: job.company,
    location: job.location,
    created: job.created,
    salary: job.salary_min || 0,
    // Add other fields as needed
  };
};

// New controller function for scraped jobs
const getScrapedJobs = async (req, res) => {
  try {
    const { query, location, page, limit } = req.query;
    const jobs = await jobService.getScrapedJobs(query, location, page, limit);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllJobsFromScraping = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const jobs = await jobService.getAllJobsFromScraping(page, limit);
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  searchJobs,
  searchJobsBySkills,
  saveJob,
  getAllJobs,
  getAllJobsFromAdzuna,
  getScrapedJobs,
  getAllJobsFromScraping,
};

// Test code to verify the fix
console.log("API variables defined:", {
  ADZUNA_BASE_URL,
  ADZUNA_API_ID,
  ADZUNA_API_KEY
});
console.log("createMockResults function:", createMockResults({ page: 1, results_per_page: 10 }));