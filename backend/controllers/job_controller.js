// Import required modules
const jobService = require("../services/jobService")
const searchJobsService = require("../services/jobApiService")

// Use environment variables for API credentials
const ADZUNA_API_ID = process.env.ADZUNA_API_ID || "5349e2d4"
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || "4915ded7f0af0dab86aeafbb5a6112f0"
const ADZUNA_BASE_URL = process.env.ADZUNA_BASE_URL || "https://api.adzuna.com/v1/api"

// Helper function for creating mock results
const createMockResults = ({ what = "", where = "", page = 1, results_per_page = 10 } = {}) => ({
  count: 0,
  results: [],
  currentPage: page,
  totalPages: 0,
  totalJobs: 0,
  sources: { indeed: 0, linkedin: 0, google: 0 },
})

const searchJobs1 = async (req, res) => {
  try {
    const {
      what = "",
      where = "",
      category = "",
      contract_type = "",
      page = "1",
      results_per_page = "10",
      skills = "",
    } = req.query

    const searchParams = {
      what,
      where,
      category,
      contract_type,
      page: Number.parseInt(page),
      results_per_page: Number.parseInt(results_per_page),
    }

    // Add skills to search params if provided
    if (skills) {
      searchParams.skills = skills.split(",").map((skill) => skill.trim())
    }

    const jobs = await jobService.searchJobs(searchParams)
    res.json(jobs)
  } catch (error) {
    console.error("Error in searchJobs controller:", error)
    res.status(500).json({ error: "An error occurred while searching for jobs" })
  }
}
const searchJobs = async (req, res) => {
  try {
    const filters = req.body; // Get filters from the request body
    const { jobs, apiJobCounts } = await searchJobsService.searchJobs(filters); // Call the service method

    res.status(200).json({
      success: true,
      jobs,
      apiJobCounts,
    });
  } catch (error) {
    console.error("Error in searchJobs controller:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for jobs.",
      error: error.message,
    });
  }
};
const searchJobsBySkills = async (req, res) => {
  try {
    const { skills = "", location = "", page = "1", limit = "10" } = req.query

    if (!skills) {
      return res.status(400).json({ error: "Skills parameter is required" })
    }

    console.log(`Controller received: skills=${skills}, location=${location}, page=${page}, limit=${limit}`)

    const skillsArray = skills.split(",").map((skill) => skill.trim())
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)

    const jobs = await jobService.searchJobsBySkills(skillsArray, location, pageNum, limitNum)
    res.json(jobs)
  } catch (error) {
    console.error("Error in searchJobsBySkills controller:", error)
    res.status(500).json({ error: "An error occurred while searching for jobs by skills" })
  }
}

const saveJob = async (req, res) => {
  try {
    const jobData = req.body
    // Add user ID to the job data if authenticated
    const userId = req.user?.id
    const savedJob = await jobService.saveJob(jobData, userId)
    res.status(201).json(savedJob)
  } catch (error) {
    console.error("Error in saveJob controller:", error)
    res.status(500).json({ error: "An error occurred while saving the job" })
  }
}

const getAllJobs = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    // Pass user ID to get only jobs saved by this user if authenticated
    const userId = req.user?.id
    const jobsData = await jobService.getAllJobs(page, limit, userId)
    res.json(jobsData)
  } catch (error) {
    console.error("Error in getAllJobs controller:", error)
    res.status(500).json({ error: "An error occurred while fetching jobs" })
  }
}

const getAllJobsFromAdzuna = async (req, res) => {
  try {
    const { what = "", where = "", page = "1", limit = "10" } = req.query
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)

    const jobs = await jobService.getAllJobsFromAdzuna(what, where, pageNum, limitNum)
    res.json(jobs)
  } catch (error) {
    console.error("Error fetching jobs from Adzuna:", error)
    res.status(500).json(
      createMockResults({
        page: Number.parseInt(req.query.page) || 1,
        results_per_page: Number.parseInt(req.query.limit) || 10,
      }),
    )
  }
}

// New controller function for scraped jobs
const getScrapedJobs = async (req, res) => {
  try {
    const { query = "", location = "", page = "1", limit = "10" } = req.query
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)

    const jobs = await jobService.getScrapedJobs(query, location, pageNum, limitNum)
    res.status(200).json(jobs)
  } catch (error) {
    console.error("Error in getScrapedJobs controller:", error)
    res.status(500).json({ message: error.message })
  }
}

const getAllJobsFromScraping = async (req, res) => {
  try {
    const { page = "1", limit = "10" } = req.query
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)

    const jobs = await jobService.getAllJobsFromScraping(pageNum, limitNum)
    res.status(200).json(jobs)
  } catch (error) {
    console.error("Error in getAllJobsFromScraping controller:", error)
    res.status(500).json({ message: error.message })
  }
}

module.exports = {
  searchJobs,
  searchJobsBySkills,
  saveJob,
  getAllJobs,
  getAllJobsFromAdzuna,
  getScrapedJobs,
  getAllJobsFromScraping,
}

