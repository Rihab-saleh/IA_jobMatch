const Job = require("../models/savedjob_model");
const axios = require("axios");
const cheerio = require("cheerio");
const NodeCache = require("node-cache");
const https = require("https");

// Configuration
const jobCache = new NodeCache({ stdTTL: 300 }); // Cache de 5 minutes
const ADZUNA_API_ID = process.env.ADZUNA_API_ID || "5349e2d4";
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY || "4915ded7f0af0dab86aeafbb5a6112f0";
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/us";

// Configuration Axios optimisée
const axiosInstance = axios.create({
  timeout: 15000,
  httpsAgent: new https.Agent({ keepAlive: true }),
  maxRedirects: 2
});

// Pool de User-Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0"
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

// Helpers
const commonSkills = [
  "javascript", "python", "java", "c#", "c++", "php", "ruby", "swift",
  "react", "angular", "vue", "node", "express", "django", "flask",
  "aws", "azure", "gcp", "devops", "docker", "kubernetes",
  "sql", "mongodb", "postgresql", "mysql", "redis",
  "html", "css", "sass", "less", "tailwind"
];

const extractSkillsFromText = (text) => {
  if (!text) return [];
  const textLower = text.toLowerCase();
  return commonSkills
    .filter(skill => textLower.includes(skill.toLowerCase()))
    .map(skill => ({
      name: skill,
      level: Math.random() > 0.7 ? "Preferred" : "Required"
    }));
};

const detectContractType = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("part-time") || text.includes("part time")) return "Part-time";
  if (text.includes("contract") || text.includes("temporary")) return "Contract";
  if (text.includes("internship") || text.includes("intern")) return "Internship";
  return "Full-time";
};

// Configuration des scrapers
const scrapers = {
  indeed: {
    url: (query, location, page = 1) => 
      `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}&start=${(page - 1) * 10}`,
    selectors: {
      jobContainer: ".job_seen_beacon",
      title: "[data-testid='jobTitle']",
      company: "[data-testid='company-name']",
      location: "[data-testid='text-location']",
      description: ".job-snippet",
      url: "a[href]",
      baseUrl: "https://www.indeed.com"
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "indeed",
      sourceId: `indeed-${Math.random().toString(36).slice(2, 11)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      contractType: detectContractType(rawJob.title, rawJob.description),
      salary: 0
    })
  },

  linkedin: {
    url: (query, location, page = 1) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&start=${(page - 1) * 25}`,
    selectors: {
      jobContainer: ".jobs-search__results-list li",
      title: ".base-search-card__title",
      company: ".base-search-card__subtitle",
      location: ".job-search-card__location",
      description: ".base-search-card__title",
      url: "a.base-card__full-link",
      baseUrl: ""
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "linkedin",
      sourceId: `linkedin-${Math.random().toString(36).slice(2, 11)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      contractType: detectContractType(rawJob.title, rawJob.description),
      salary: 0
    })
  },

  googleJobs: {
    url: (query, location) =>
      `https://www.google.com/search?q=${encodeURIComponent(query + " jobs " + location)}&ibp=htl;jobs`,
    selectors: {
      jobContainer: ".iFjolb",
      title: ".BjJfJf",
      company: ".vNEEBe",
      location: ".Qk80Jf",
      description: ".HBvzbc",
      url: "a.pMhGee",
      baseUrl: ""
    },
    transformer: (rawJob) => ({
      title: rawJob.title,
      description: rawJob.description,
      company: { display_name: rawJob.company },
      location: { display_name: rawJob.location },
      created: new Date().toISOString(),
      source: "google",
      sourceId: `google-${Math.random().toString(36).slice(2, 11)}`,
      sourceUrl: rawJob.url,
      isExternal: true,
      skillsRequired: extractSkillsFromText(rawJob.description),
      contractType: detectContractType(rawJob.title, rawJob.description),
      salary: 0
    })
  }
};

// Fonction principale de scraping
const scrapeJobsWithAxios = async (url, selectors, transformer) => {
  try {
    const headers = {
      "User-Agent": getRandomUserAgent(),
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/"
    };

    let response;
    let retries = 2;
    
    while (retries > 0) {
      try {
        response = await axiosInstance.get(url, { headers });
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const $ = cheerio.load(response.data);
    const jobs = [];
    const container = $(selectors.jobContainer);

    for (let i = 0; i < container.length; i++) {
      const element = container.eq(i);
      try {
        const rawJob = {
          title: element.find(selectors.title).text().trim(),
          company: element.find(selectors.company).text().trim(),
          location: element.find(selectors.location).text().trim(),
          description: element.find(selectors.description).text().trim(),
          url: selectors.baseUrl + (element.find(selectors.url).attr("href") || "")
        };

        if (rawJob.title) {
          jobs.push(transformer(rawJob));
        }
      } catch (error) {
        console.error(`Error processing job element: ${error.message}`);
      }
    }

    return jobs;
  } catch (error) {
    console.error(`Scraping failed for ${url}: ${error.message}`);
    return [];
  }
};

// Scraping parallèle avec cache
const scrapeJobsFromWebsites = async (query = "", location = "", page = 1) => {
  const cacheKey = `scraped-${query}-${location}-${page}`;
  const cached = jobCache.get(cacheKey);
  if (cached) return cached;

  try {
    const sources = ["indeed", "linkedin", "googleJobs"];
    const scrapingPromises = sources.map(source => {
      const { url, selectors, transformer } = scrapers[source];
      const sourceUrl = url(query, location, page);
      return scrapeJobsWithAxios(sourceUrl, selectors, transformer);
    });

    const results = await Promise.all(scrapingPromises);
    const allJobs = results.flat();

    // Déduplication
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => 
        j.title === job.title && 
        j.company.display_name === job.company.display_name
      )
    );

    jobCache.set(cacheKey, uniqueJobs);
    return uniqueJobs;
  } catch (error) {
    console.error("Global scraping error:", error);
    return [];
  }
};

// Fonctions API
const getAllJobsFromScraping = async (page = 1, limit = 10) => {
  try {
    const scrapedJobs = await scrapeJobsFromWebsites("", "", page);
    const start = (page - 1) * limit;
    
    return {
      count: scrapedJobs.length,
      results: scrapedJobs.slice(start, start + limit),
      currentPage: page,
      totalPages: Math.ceil(scrapedJobs.length / limit),
      totalJobs: scrapedJobs.length
    };
  } catch (error) {
    console.error("Error in getAllJobsFromScraping:", error);
    return createMockResponse(page, limit);
  }
};

const getScrapedJobs = async (query = "", location = "", page = 1, limit = 10) => {
  try {
    const scrapedJobs = await scrapeJobsFromWebsites(query, location, page);
    const start = (page - 1) * limit;
    
    return {
      count: scrapedJobs.length,
      results: scrapedJobs.slice(start, start + limit),
      currentPage: page,
      totalPages: Math.ceil(scrapedJobs.length / limit),
      totalJobs: scrapedJobs.length
    };
  } catch (error) {
    console.error("Job scraping error:", error);
    return createMockResponse(page, limit);
  }
};

const getAllJobsFromAdzuna = async (query = "", location = "", page = 1, limit = 10) => {
  try {
    const { data } = await axiosInstance.get(`${ADZUNA_BASE_URL}/search/${page}`, {
      params: {
        app_id: ADZUNA_API_ID,
        app_key: ADZUNA_API_KEY,
        what: query,
        where: location,
        results_per_page: limit
      }
    });

    return {
      ...data,
      results: data.results.map(job => ({
        ...job,
        isExternal: true,
        skillsRequired: extractSkillsFromText(job.description),
        contractType: detectContractType(job.title, job.description)
      }))
    };
  } catch (error) {
    console.error("Adzuna API error:", error.message);
    return createMockResponse(page, limit);
  }
};

const searchJobs = async (query = "", location = "", page = 1, limit = 10) => {
  try {
    const filter = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ],
      "location.display_name": { $regex: location, $options: "i" }
    };

    const [jobs, total] = await Promise.all([
      Job.find(filter).skip((page - 1) * limit).limit(limit),
      Job.countDocuments(filter)
    ]);

    return {
      count: jobs.length,
      results: jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    };
  } catch (error) {
    console.error("Database search error:", error);
    throw error;
  }
};

const searchJobsBySkills = async (skills, page = 1, limit = 10) => {
  try {
    const skillArray = Array.isArray(skills) ? skills : skills.split(',');
    
    const [jobs, total] = await Promise.all([
      Job.find({ 
        "skillsRequired.name": { $in: skillArray.map(s => s.toLowerCase()) }
      }).skip((page - 1) * limit).limit(limit),
      Job.countDocuments({ 
        "skillsRequired.name": { $in: skillArray.map(s => s.toLowerCase()) }
      })
    ]);

    return {
      count: jobs.length,
      results: jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    };
  } catch (error) {
    console.error("Error in searchJobsBySkills:", error);
    throw error;
  }
};

const saveJob = async (jobData) => {
  try {
    const job = new Job(jobData);
    await job.save();
    return job;
  } catch (error) {
    console.error("Save job error:", error);
    throw error;
  }
};

const getAllJobs = async (page = 1, limit = 10) => {
  try {
    const [jobs, total] = await Promise.all([
      Job.find().skip((page - 1) * limit).limit(limit),
      Job.countDocuments()
    ]);

    return {
      count: jobs.length,
      results: jobs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalJobs: total
    };
  } catch (error) {
    console.error("Get all jobs error:", error);
    throw error;
  }
};

const createMockResponse = (page, limit) => ({
  count: 0,
  results: [],
  currentPage: page,
  totalPages: 0,
  totalJobs: 0
});

module.exports = {
  getAllJobsFromAdzuna,
  getScrapedJobs,
  getAllJobsFromScraping,
  searchJobs,
  searchJobsBySkills,
  saveJob,
  getAllJobs
};