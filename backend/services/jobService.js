const fetch = require("node-fetch")
const Job = require("../models/job_model")
const axios = require("axios")
const cheerio = require("cheerio")

// Use environment variables for API credentials
const ADZUNA_API_ID = process.env.ADZUNA_API_ID || "5349e2d4"
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || "4915ded7f0af0dab86aeafbb5a6112f0"
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/us"

// Helper function for creating mock results
const createMockResults = ({ what = "", where = "", page = 1, results_per_page = 10 } = {}) => ({
  count: 0,
  results: [],
  currentPage: page,
  totalPages: 0,
  totalJobs: 0,
  sources: { indeed: 0, linkedin: 0, google: 0 },
})

// Web scraping helper functions
const commonSkills = [
  "javascript",
  "python",
  "java",
  "c#",
  "c++",
  "php",
  "ruby",
  "swift",
  "react",
  "angular",
  "vue",
  "node",
  "express",
  "django",
  "flask",
  "aws",
  "azure",
  "gcp",
  "devops",
  "docker",
  "kubernetes",
  "sql",
  "mongodb",
  "postgresql",
  "mysql",
  "redis",
  "html",
  "css",
  "sass",
  "less",
  "tailwind",
]

const extractSkillsFromText = (text) => {
  if (!text) return []

  const foundSkills = []
  const textLower = text.toLowerCase()

  commonSkills.forEach((skill) => {
    if (textLower.includes(skill.toLowerCase())) {
      foundSkills.push({
        name: skill,
        level: Math.random() > 0.7 ? "Preferred" : "Required",
      })
    }
  })

  return foundSkills
}

const detectContractType = (title, description) => {
  const text = (title + " " + description).toLowerCase()

  if (text.includes("part-time") || text.includes("part time")) return "Part-time"
  if (text.includes("contract") || text.includes("temporary")) return "Contract"
  if (text.includes("internship") || text.includes("intern")) return "Internship"

  return "Full-time" // Default
}

// Improved web scraping with enhanced Axios and Cheerio
const scrapeJobsWithAxios = async (url, selectors, transformer) => {
  try {
    console.log(`Scraping jobs from: ${url}`)

    // Create a random user agent
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
    ]
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]

    // Set headers to mimic a real browser
    const headers = {
      "User-Agent": randomUserAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.google.com/",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-User": "?1",
    }

    // Implement retry logic
    let retries = 3
    let response = null

    while (retries > 0) {
      try {
        response = await axios.get(url, {
          headers,
          timeout: 30000, // 30 second timeout
          maxRedirects: 5,
        })
        break // Success, exit the retry loop
      } catch (error) {
        retries--
        if (retries === 0) throw error
        console.log(`Retry attempt for ${url}, ${retries} attempts left`)
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 2000))
      }
    }

    if (!response || !response.data) {
      throw new Error("No response data received")
    }

    const $ = cheerio.load(response.data)
    const jobs = []

    // Extract job listings using the provided selectors
    $(selectors.jobContainer).each((index, element) => {
      try {
        const rawJobData = {
          title: $(element).find(selectors.title).text().trim(),
          company: $(element).find(selectors.company).text().trim(),
          location: $(element).find(selectors.location).text().trim(),
          description: $(element).find(selectors.description).text().trim(),
          url: selectors.baseUrl + ($(element).find(selectors.url).attr("href") || ""),
        }

        // Only add jobs with valid titles
        if (rawJobData.title) {
          // Transform the raw data to match our job model format
          const job = transformer(rawJobData)
          jobs.push(job)
        }
      } catch (err) {
        console.error(`Error processing job element: ${err.message}`)
      }
    })

    console.log(`Scraped ${jobs.length} jobs from ${url}`)
    return jobs
  } catch (error) {
    console.error(`Error scraping jobs from ${url}:`, error.message)
    return []
  }
}

// Updated scrapers with more accurate selectors
const scrapers = {
  // Indeed scraper with updated selectors
  indeed: {
    url: (query, location, page = 1) =>
      `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${(page - 1) * 10}`,
    selectors: {
      jobContainer: ".job_seen_beacon, .tapItem, .css-5lfssm",
      title: '[data-testid="jobTitle"], .jobTitle span, .jcs-JobTitle span',
      company: '[data-testid="company-name"], .companyName, .companyOverviewLink',
      location: '[data-testid="text-location"], .companyLocation, .job-location',
      description: ".job-snippet, .job-snippet-container",
      url: '[data-testid="jobTitle"] a, .jcs-JobTitle a, .jobTitle a',
      baseUrl: "https://www.indeed.com",
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "indeed",
      sourceId: `indeed-${Math.random().toString(36).substring(2, 9)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      salary: 0,
      contractType: detectContractType(rawJob.title, rawJob.description),
    }),
  },

  // LinkedIn scraper with updated selectors
  linkedin: {
    url: (query, location, page = 1) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${(page - 1) * 25}`,
    selectors: {
      jobContainer: ".jobs-search__results-list > li, .job-search-card",
      title: ".base-search-card__title, .job-card-list__title",
      company: ".base-search-card__subtitle, .job-card-container__company-name",
      location: ".job-search-card__location, .job-card-container__metadata-item",
      description: ".base-card__full-link, .job-card-list__title",
      url: "a.base-card__full-link, a.job-card-list__title",
      baseUrl: "",
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "linkedin",
      sourceId: `linkedin-${Math.random().toString(36).substring(2, 9)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      salary: 0,
      contractType: detectContractType(rawJob.title, rawJob.description),
    }),
  },

  // Google Jobs scraper with updated selectors
  googleJobs: {
    url: (query, location, page = 1) =>
      `https://www.google.com/search?q=${encodeURIComponent(query + " jobs " + location)}&ibp=htl;jobs&htivrt=jobs`,
    selectors: {
      jobContainer: ".iFjolb, .gws-plugins-horizon-jobs__li-ed, .gws-plugins-horizon-jobs__tl-lif",
      title: ".BjJfJf, .KLsYvd",
      company: ".vNEEBe, .sMzDkb",
      location: ".Qk80Jf, .vNEEBe",
      description: ".HBvzbc, .YgLbBe",
      url: "a.pMhGee, a.jWCzBc",
      baseUrl: "",
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "google",
      sourceId: `google-${Math.random().toString(36).substring(2, 9)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      salary: 0,
      contractType: detectContractType(rawJob.title, rawJob.description),
    }),
  },
}

// Function to scrape jobs from websites using Axios/Cheerio
const scrapeJobsFromWebsites = async (query, location, page = 1) => {
  const allJobs = []
  const sources = ["indeed", "linkedin", "googleJobs"]

  // Use sequential scraping to avoid being blocked
  for (const source of sources) {
    try {
      const { url, selectors, transformer } = scrapers[source]
      const sourceUrl = url(query, location, page)
      console.log(`Starting scraping from ${source}: ${sourceUrl}`)

      // Use Axios/Cheerio for scraping
      const jobs = await scrapeJobsWithAxios(sourceUrl, selectors, transformer)
      console.log(`Successfully scraped ${jobs.length} jobs from ${source}`)

      // Add a small delay between requests to avoid being blocked
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

      allJobs.push(...jobs)
    } catch (error) {
      console.error(`Error scraping ${source}:`, error.message)
    }
  }

  // Remove duplicate jobs (same title and company)
  const uniqueJobs = removeDuplicateJobs(allJobs)
  console.log(`Total unique jobs scraped: ${uniqueJobs.length}`)

  return uniqueJobs
}

// Helper function to remove duplicate jobs
const removeDuplicateJobs = (jobs) => {
  const uniqueJobs = []
  const seen = new Set()

  jobs.forEach((job) => {
    // Create a unique key for each job based on title and company
    const key = `${job.title.toLowerCase()}-${job.company.display_name.toLowerCase()}`

    if (!seen.has(key)) {
      seen.add(key)
      uniqueJobs.push(job)
    }
  })

  return uniqueJobs
}

// Function to get all jobs from scraping with pagination
const getAllJobsFromScraping = async (page = 1, limit = 10) => {
  try {
    // Scrape jobs from all sources
    const scrapedJobs = await scrapeJobsFromWebsites("", "", page)

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedJobs = scrapedJobs.slice(startIndex, endIndex)

    return {
      count: scrapedJobs.length,
      results: paginatedJobs,
      currentPage: page,
      totalPages: Math.ceil(scrapedJobs.length / limit),
      totalJobs: scrapedJobs.length,
    }
  } catch (error) {
    console.error("Error in getAllJobsFromScraping:", error)
    return {
      count: 0,
      results: [],
      currentPage: page,
      totalPages: 0,
      totalJobs: 0,
    }
  }
}

// Function to get jobs exclusively from scraping with pagination
const getScrapedJobs = async (query, location = "", page = 1, limit = 10) => {
  try {
    console.log(`Starting scraping for query: "${query}", location: "${location}"`)
    const scrapedJobs = await scrapeJobsFromWebsites(query, location, page)

    // Log the number of jobs from each source
    const indeedJobs = scrapedJobs.filter((job) => job.source === "indeed")
    const linkedinJobs = scrapedJobs.filter((job) => job.source === "linkedin")
    const googleJobs = scrapedJobs.filter((job) => job.source === "google")

    console.log(
      `Jobs by source - Indeed: ${indeedJobs.length}, LinkedIn: ${linkedinJobs.length}, Google: ${googleJobs.length}`,
    )

    // Sort jobs by relevance
    const sortedJobs = sortJobsByRelevance(scrapedJobs, { what: query })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedJobs = sortedJobs.slice(startIndex, endIndex)

    return {
      count: sortedJobs.length,
      results: paginatedJobs,
      currentPage: page,
      totalPages: Math.ceil(sortedJobs.length / limit),
      totalJobs: sortedJobs.length,
      sources: {
        indeed: indeedJobs.length,
        linkedin: linkedinJobs.length,
        google: googleJobs.length,
      },
    }
  } catch (error) {
    console.error("Error getting scraped jobs:", error.message)
    return createMockResults({
      what: query,
      where: location,
      page,
      results_per_page: limit,
    })
  }
}

// Function to sort jobs by relevance
const sortJobsByRelevance = (jobs, { what }) => {
  return jobs.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(what?.toLowerCase() || "")
    const bTitleMatch = b.title.toLowerCase().includes(what?.toLowerCase() || "")

    if (aTitleMatch && !bTitleMatch) return -1
    if (!aTitleMatch && bTitleMatch) return 1
    return 0
  })
}

// Function to search jobs in the database
const searchJobs = async (params) => {
  try {
    const { what = "", where = "", page = 1, results_per_page = 10, skills = [] } = params

    // Build query
    const query = {
      $or: [{ title: { $regex: what, $options: "i" } }, { description: { $regex: what, $options: "i" } }],
    }

    // Add location filter if provided
    if (where) {
      query.location = { $regex: where, $options: "i" }
    }

    // Add skills filter if provided
    if (skills && skills.length > 0) {
      query.skillsRequired = { $in: skills }
    }

    const jobs = await Job.find(query)
      .skip((page - 1) * results_per_page)
      .limit(results_per_page)

    const totalJobs = await Job.countDocuments(query)

    return {
      count: jobs.length,
      results: jobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / results_per_page),
      totalJobs,
    }
  } catch (error) {
    console.error("Error searching jobs:", error)
    throw error
  }
}

// Function to search jobs by skills
const searchJobsBySkills = async (skills, location = "", page = 1, limit = 10) => {
  try {
    console.log(`Searching jobs by skills: ${skills}, location: ${location}, page: ${page}, limit: ${limit}`)

    // Ensure skills is an array
    const skillsArray = Array.isArray(skills) ? skills : [skills]

    // Build query
    const query = {
      "skillsRequired.name": { $in: skillsArray },
    }

    // Add location filter if provided
    if (location && location.trim() !== "") {
      query["location.display_name"] = { $regex: location, $options: "i" }
    }

    // Convert page and limit to numbers
    const pageNum = Number(page)
    const limitNum = Number(limit)

    console.log("MongoDB Query:", JSON.stringify(query))

    // If no skills are provided or database is empty, return mock results
    if (skillsArray.length === 0) {
      console.log("No skills provided, returning mock results")
      return createMockResults({ page: pageNum, results_per_page: limitNum })
    }

    // Try to find jobs in the database
    const jobs = await Job.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()

    console.log(`Found ${jobs.length} jobs in database`)

    // If no jobs found in database, try to scrape some
    if (jobs.length === 0) {
      console.log("No jobs found in database, trying to scrape some")
      // Use the first skill as a search query
      const searchQuery = skillsArray[0] || ""
      return getScrapedJobs(searchQuery, location, pageNum, limitNum)
    }

    const totalJobs = await Job.countDocuments(query)

    return {
      count: jobs.length,
      results: jobs,
      currentPage: pageNum,
      totalPages: Math.ceil(totalJobs / limitNum),
      totalJobs,
    }
  } catch (error) {
    console.error("Error searching jobs by skills:", error)
    return createMockResults({ page, results_per_page: limit })
  }
}

// Function to save a job
const saveJob = async (jobData, userId) => {
  try {
    // Check if job already exists
    let job = await Job.findOne({
      $or: [{ id: jobData.id }, { sourceId: jobData.sourceId }],
    })

    if (job) {
      // Update existing job
      job.isSaved = jobData.isSaved
      if (userId) job.userId = userId
      await job.save()
      return job
    } else {
      // Create new job
      if (userId) jobData.userId = userId
      job = new Job(jobData)
      await job.save()
      return job
    }
  } catch (error) {
    console.error("Error saving job:", error)
    throw error
  }
}

// Function to get all jobs
const getAllJobs = async (page = 1, limit = 10, userId = null) => {
  try {
    const query = userId ? { userId } : {}

    const jobs = await Job.find(query)
      .skip((page - 1) * limit)
      .limit(limit)

    const totalJobs = await Job.countDocuments(query)

    return {
      count: jobs.length,
      results: jobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
    }
  } catch (error) {
    console.error("Error getting all jobs:", error)
    throw error
  }
}

// Function to get jobs from Adzuna
const getAllJobsFromAdzuna = async (query, location = "", page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `${ADZUNA_BASE_URL}/search/${page}?app_id=${ADZUNA_API_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}&results_per_page=${limit}`,
    )

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching jobs from Adzuna:", error)
    return createMockResults({
      what: query,
      where: location,
      page,
      results_per_page: limit,
    })
  }
}

// Export all functions
module.exports = {
  searchJobs,
  searchJobsBySkills,
  saveJob,
  getAllJobs,
  getAllJobsFromAdzuna,
  getScrapedJobs,
  getAllJobsFromScraping,
  createMockResults,
}

