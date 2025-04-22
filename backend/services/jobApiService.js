const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authMiddleware = require('../middlewares/authMiddleware');
const mongoose = require('mongoose'); 
const axios = require('axios');
const cheerio = require('cheerio');
const SavedJob = require('../models/savedjob_model'); 
require("dotenv").config();


const app = express();
app.use(express.json());
const PORT = 3001; // Changé à 3001 pour éviter les conflits

const ADZUNA_APP_ID = "5349e2d4"
const ADZUNA_API_KEY = "4915ded7f0af0dab86aeafbb5a6112f0"
const JOOBLE_API_KEY = "ed9a3c23-dcac-4de0-8145-71db66b6a169"
const FINDWORK_API_KEY = "ed9a3c23-dcac-4de0-8145-71db66b6a169"
const APIJOBS_API_KEY = "4e4fce558288a8005970bb642a0569749178ce05c7f753f963411eddf47b4d81"
const REED_API_KEY = "0d792c73-84b2-4f95-903e-ec4ceb3e8c11"
const { extractSkillsNLP } = require('../services/skillExtractorService');
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Helper function for adding delays
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper functions
const formatSalaryAdzuna = (min, max) => {
  if (!min && !max) {
    return "Negotiable";
  }

  if (min && !max) {
    return `${min}+`;
  }

  if (!min && max) {
    return `Up to ${max}`;
  }

  return `${min} - ${max}`;
};

function formatSalary(min, max) {
  if (!min && !max) return undefined;

  if (min && max) {
    return `£${min.toLocaleString()} - £${max.toLocaleString()}`;
  }

  if (min) {
    return `£${min.toLocaleString()}+`;
  }

  if (max) {
    return `Up to £${max.toLocaleString()}`;
  }

  return undefined;
}

function extractSalaryValue(salaryString) {
  // Extract the first number from a salary string
  const match = salaryString.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function getDateFromFilter(dateFilter) {
  const now = new Date();

  switch (dateFilter) {
    case "today":
      return new Date(now.setHours(0, 0, 0, 0));
    case "yesterday":
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    case "week":
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return lastWeek;
    case "month":
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return lastMonth;
    default:
      return null;
  }
}

function mapJobType(jobType, source) {
  if (jobType === "any") return "";

  if (source === "adzuna") {
    switch (jobType) {
      case "full_time":
        return "full_time";
      case "part_time":
        return "part_time";
      case "contract":
        return "contract";
      case "temporary":
        return "contract";
      case "internship":
        return "internship";
      default:
        return jobType;
    }
  }
  if (source === "scraped") {
    switch (jobType) {
      case "full_time":
        return "Full Time";
      case "part_time":
        return "Part Time";
      case "contract":
        return "Contract";
      case "temporary":
        return "Temporary";
      case "internship":
        return "Internship";
      default:
        return jobType;
    }
  }

  if (source === "apijobs") {
    switch (jobType) {
      case "full_time":
        return "full-time"; // Changed to lowercase with hyphen based on API docs
      case "part_time":
        return "part-time"; // Changed to lowercase with hyphen based on API docs
      case "contract":
        return "contract";
      case "temporary":
        return "temporary";
      case "internship":
        return "internship";
      default:
        return jobType;
    }
  }

  if (source === "jooble") {
    switch (jobType) {
      case "full_time":
        return "fulltime";
      case "part_time":
        return "parttime";
      case "contract":
        return "contract";
      case "temporary":
        return "temporary";
      case "internship":
        return "internship";
      default:
        return jobType;
    }
  }

  if (source === "remotive") {
    switch (jobType) {
      case "full_time":
        return "full_time";
      case "part_time":
        return "part_time";
      case "contract":
        return "contract";
      case "temporary":
        return "temporary";
      case "internship":
        return "internship";
      default:
        return jobType;
    }
  }

  return jobType;
}

// Helper function to map employment types
function mapEmploymentType(type) {
  const typeMap = {
    "full-time": "Full Time",
    "part-time": "Part Time",
    contract: "Contract",
    temporary: "Temporary",
    internship: "Internship",
    freelance: "Freelance",
  };

  return typeMap[type.toLowerCase()] || type;
}

// Helper function to format APIJobs salary
function formatApiJobsSalary(job) {
  if (!job.base_salary_currency || !job.base_salary_unit) return undefined;

  const currency =
    job.base_salary_currency === "EUR" ? "€" : job.base_salary_currency === "USD" ? "$" : job.base_salary_currency;

  if (job.base_salary_min_value && job.base_salary_max_value) {
    return `${currency}${job.base_salary_min_value.toLocaleString()} - ${currency}${job.base_salary_max_value.toLocaleString()} per ${job.base_salary_unit}`;
  } else if (job.base_salary_min_value) {
    return `${currency}${job.base_salary_min_value.toLocaleString()} per ${job.base_salary_unit}`;
  } else if (job.base_salary_max_value) {
    return `Up to ${currency}${job.base_salary_max_value.toLocaleString()} per ${job.base_salary_unit}`;
  }

  return undefined;
}

function sortJobs(jobs, sortBy) {
  switch (sortBy) {
    case "date":
      return jobs.sort((a, b) => {
        if (!a.datePosted) return 1;
        if (!b.datePosted) return -1;
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
      });

    case "salary":
      return jobs.sort((a, b) => {
        // This is a simple sort that prioritizes jobs with salary information
        if (!a.salary) return 1;
        if (!b.salary) return -1;
        return 0;
      });

    case "relevance":
    default:
      // For relevance, we keep the original order from the APIs
      return jobs;
  }
}

// API fetch functions
async function fetchAdzunaJobs(filters, limit) {
  try {
    const appId = ADZUNA_APP_ID;
    const apiKey = ADZUNA_API_KEY;

    if (!appId || !apiKey) {
      console.error("Adzuna API credentials not found");
      return [];
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append("app_id", appId);
    params.append("app_key", apiKey);
    params.append("results_per_page", limit ? limit.toString() : "50"); // Default to max 50 if no limit

    if (filters.query) {
      params.append("what", filters.query);
    }

    if (filters.location) {
      params.append("where", filters.location);
    }

    if (filters.distance) {
      params.append("distance", filters.distance.toString());
    }
    
    if (filters.jobType && filters.jobType !== "any") {
      params.append("contract_type", mapJobType(filters.jobType, "adzuna"));
    }

    // Make the API request
    const response = await axios.get(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params.toString()}`);

    if (response.status !== 200) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = response.data;

    // Map Adzuna jobs to our normalized format
    return (data.results || []).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salary: formatSalaryAdzuna(job.salary_min, job.salary_max),
      url: job.redirect_url,
      datePosted: job.created,
      jobType: job.contract_time ? (job.contract_time === "full_time" ? "Full Time" : "Part Time") : undefined,
      source: "adzuna",
    }));
  } catch (error) {
    console.error("Error fetching from Adzuna:", error);
    return [];
  }
}

// Improved scraping function with better browser emulation and multiple site support
async function fetchScrapedJobs(filters, limit) {
  // Array to store all scraped jobs
  const scrapedJobs = [];
  
  // Try multiple job sites to increase chances of successful scraping
  const jobSites = [
    {
      name: 'LinkedIn Jobs',
      url: (query, location) => `https://www.linkedin.com/jobs/search?keywords=${query}&location=${location}`,
      scraper: async (html, site) => {
        const $ = cheerio.load(html);
        const jobs = [];
        
        $('.job-search-card').each((i, el) => {
          try {
            const title = $(el).find('.base-search-card__title').text().trim();
            const company = $(el).find('.base-search-card__subtitle').text().trim();
            const location = $(el).find('.job-search-card__location').text().trim();
            const link = $(el).find('a.base-card__full-link').attr('href');
            const dateEl = $(el).find('time.job-search-card__listdate');
            const datePosted = dateEl.attr('datetime') || new Date().toISOString();
            
            jobs.push({
              title,
              company,
              location,
              url: link,
              datePosted,
              source: site.name
            });
          } catch (err) {
            console.log(`Error parsing LinkedIn job: ${err.message}`);
          }
        });
        
        return jobs;
      }
    },
    {
      name: 'Indeed',
      url: (query, location) => `https://www.indeed.com/jobs?q=${query}&l=${location}`,
      scraper: async (html, site) => {
        const $ = cheerio.load(html);
        const jobs = [];
        
        $('.jobsearch-ResultsList > .result, .job_seen_beacon').each((i, el) => {
          try {
            const title = $(el).find('.jobTitle span').text().trim() || 
                         $(el).find('h2.jobTitle').text().trim();
            const company = $(el).find('.companyName').text().trim() || 
                           $(el).find('.company_location .companyName').text().trim();
            const location = $(el).find('.companyLocation').text().trim() || 
                            $(el).find('.company_location .companyLocation').text().trim();
            const link = $(el).find('a.jcs-JobTitle').attr('href') || 
                        $(el).find('a.job_seen_beacon').attr('href');
            const url = link && (link.startsWith('http') ? link : `https://www.indeed.com${link}`);
            
            if (title && company) {
              jobs.push({
                title,
                company,
                location: location || 'Location not specified',
                url: url || '#',
                datePosted: new Date().toISOString(),
                source: site.name
              });
            }
          } catch (err) {
            console.log(`Error parsing Indeed job: ${err.message}`);
          }
        });
        
        return jobs;
      }
    },
    {
      name: 'Glassdoor',
      url: (query, location) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${query}&locT=C&locId=1147401`,
      scraper: async (html, site) => {
        const $ = cheerio.load(html);
        const jobs = [];
        
        $('.react-job-listing').each((i, el) => {
          try {
            const title = $(el).find('.job-title').text().trim();
            const company = $(el).find('.employer-name').text().trim();
            const location = $(el).find('.location').text().trim();
            const link = $(el).attr('href');
            const url = link && (link.startsWith('http') ? link : `https://www.glassdoor.com${link}`);
            
            if (title && company) {
              jobs.push({
                title,
                company,
                location: location || 'Location not specified',
                url: url || '#',
                datePosted: new Date().toISOString(),
                source: site.name
              });
            }
          } catch (err) {
            console.log(`Error parsing Glassdoor job: ${err.message}`);
          }
        });
        
        return jobs;
      }
    }
  ];

  // Create realistic browser headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  // Optional: Configure proxy (uncomment and add your proxy details if needed)
  /*
  const proxy = {
    host: 'your-proxy-host',
    port: 'your-proxy-port',
    auth: {
      username: 'your-proxy-username',
      password: 'your-proxy-password'
    }
  };
  */

  // Encode search parameters
  const query = filters.query ? encodeURIComponent(filters.query) : '';
  const location = filters.location ? encodeURIComponent(filters.location) : '';
  
  // Try each job site until we get enough results or exhaust all options
  for (const site of jobSites) {
    if (scrapedJobs.length >= (limit || 10)) break;
    
    try {
      console.log(`Attempting to scrape jobs from ${site.name}...`);
      
      // Generate the URL for this site
      const url = site.url(query, location);
      console.log(`Scraping URL: ${url}`);
      
      // Add a random delay between requests (1-3 seconds)
      const randomDelay = Math.floor(Math.random() * 2000) + 1000;
      await delay(randomDelay);
      
      // Make the request with browser-like headers
      const response = await axios.get(url, { 
        headers,
        // proxy, // Uncomment if using a proxy
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });
      
      if (response.status === 200) {
        // Parse the HTML and extract jobs
        const siteJobs = await site.scraper(response.data, site);
        
        if (siteJobs && siteJobs.length > 0) {
          console.log(`Successfully scraped ${siteJobs.length} jobs from ${site.name}`);
          
          // Add unique IDs and normalize the job data
          const normalizedJobs = siteJobs.map((job, index) => ({
            id: `scraped-${site.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
            title: job.title || 'Untitled Position',
            company: job.company || 'Unknown Company',
            location: job.location || 'Unspecified Location',
            description: job.description || '',
            salary: job.salary || undefined,
            url: job.url || '#',
            datePosted: job.datePosted || new Date().toISOString(),
            jobType: job.jobType || '',
            source: 'scraped'
          }));
          
          // Add to our collection
          scrapedJobs.push(...normalizedJobs);
        } else {
          console.log(`No jobs found on ${site.name}`);
        }
      } else {
        console.log(`Failed to scrape ${site.name}: Status code ${response.status}`);
      }
    } catch (error) {
      console.error(`Error scraping ${site.name}:`, error.message);
      // Continue to the next site on error
    }
  }
  
  console.log(`Total scraped jobs: ${scrapedJobs.length}`);
  
  // Apply any additional filters
  let filteredJobs = scrapedJobs;
  
  if (filters.jobType && filters.jobType !== "any") {
    filteredJobs = filteredJobs.filter(job => 
      job.jobType && job.jobType.toLowerCase().includes(mapJobType(filters.jobType, "scraped").toLowerCase())
    );
  }
  
  // Return the jobs, limited if specified
  return limit ? filteredJobs.slice(0, limit) : filteredJobs;
}

async function fetchReedJobs(filters, limit) {
  try {
    const apiKey = REED_API_KEY;

    if (!apiKey) {
      console.error("Reed API key not found");
      return [];
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append("resultsToTake", limit ? limit.toString() : "100"); // Default to max 100 if no limit

    if (filters.query) {
      params.append("keywords", filters.query);
    }

    if (filters.location) {
      params.append("locationName", filters.location);
    }

    if (filters.distance) {
      params.append("distanceFromLocation", filters.distance.toString());
    }

    if (filters.jobType && filters.jobType !== "any") {
      params.append("fullTime", filters.jobType === "full_time" ? "true" : "false");
    }

    // Make the API request with Basic Auth
    const response = await axios.get(`https://www.reed.co.uk/api/1.0/search?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Reed API error: ${response.status}`);
    }

    const data = response.data;

    // Map Reed jobs to our normalized format
    return (data.results || []).map((job) => ({
      id: job.jobId.toString(),
      title: job.jobTitle,
      company: job.employerName,
      location: job.locationName,
      description: job.jobDescription,
      salary: formatSalary(job.minimumSalary, job.maximumSalary),
      url: job.jobUrl,
      datePosted: job.date,
      jobType: job.fullTime ? "Full Time" : "Part Time",
      source: "reed",
    }));
  } catch (error) {
    console.error("Error fetching from Reed:", error);
    return [];
  }
}

async function fetchApiJobsJobs(filters, limit) {
  try {
    const apiKey = APIJOBS_API_KEY;

    if (!apiKey) {
      console.error("APIJobs API key not found");
      return [];
    }

    // Create a payload with the search parameters based on the API documentation
    const payload = {
      // Add required parameters
      size: limit || 100, // Default to max 100 if no limit
      sort_by: "created_at",
      sort_order: "desc",
      // Add search filters if provided
      ...(filters.query ? { q: filters.query } : {}),
      ...(filters.location ? { city: filters.location } : {}),
      ...(filters.jobType && filters.jobType !== "any"
        ? { employment_type: mapJobType(filters.jobType, "apijobs").toLowerCase() }
        : {}),
    };

    // Make the API request with the API key in the header
    const response = await axios.post("https://api.apijobs.dev/v1/job/search", payload, {
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
    });

    if (response.status !== 200) {
      const errorText = response.data;
      console.error(`APIJobs API error response: ${errorText}`);
      throw new Error(`APIJobs API error: ${response.status}`);
    }

    const data = response.data;

    // Add error handling for unexpected response format
    if (!data || !data.ok || !Array.isArray(data.hits)) {
      console.error("Unexpected APIJobs response format:", data);
      return [];
    }

    // Map APIJobs jobs to our normalized format - using "hits" instead of "jobs"
    return (data.hits || []).map((job) => ({
      id: job.id || `apijobs-${Math.random().toString(36).substring(7)}`,
      title: job.title || "Untitled Position",
      company: job.hiring_organization_name || "Unknown Company",
      location: job.city || job.region || job.country || "Remote/Unspecified",
      description: job.description || "",
      salary: formatApiJobsSalary(job),
      url: job.hiring_organization_url || "#",
      datePosted: job.published_at || new Date().toISOString(),
      jobType: job.employment_type ? mapEmploymentType(job.employment_type) : undefined,
      source: "apijobs",
    }));
  } catch (error) {
    console.error("Error fetching from APIJobs:", error);
    return [];
  }
}

async function fetchJoobleJobs(filters, limit) {
  try {
    const apiKey = JOOBLE_API_KEY;

    if (!apiKey) {
      console.error("Jooble API key not found");
      return [];
    }

    // Create a simple string payload exactly as shown in the example
    const params = `{ "keywords": "${filters.query || ""}", "location": "${filters.location || ""}" }`;

    // Make the API request according to the example
    const response = await axios.post(`https://jooble.org/api/${apiKey}`, params, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      const errorText = response.data;
      console.error(`Jooble API error response: ${errorText}`);
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data = response.data;

    // Check if the response has the expected format
    if (!data || !Array.isArray(data.jobs)) {
      console.error("Unexpected Jooble response format:", data);
      return [];
    }

    // Map Jooble jobs to our normalized format and limit the results if specified
    const jobs = data.jobs.map((job) => ({
      id: job.id || `jooble-${Math.random().toString(36).substring(7)}`,
      title: job.title || "Untitled Position",
      company: job.company || "Unknown Company",
      location: job.location || "Unspecified Location",
      description: job.snippet || "",
      salary: job.salary,
      url: job.link,
      datePosted: job.updated,
      jobType: job.type,
      source: "jooble",
    }));

    return limit ? jobs.slice(0, limit) : jobs;
  } catch (error) {
    console.error("Error fetching from Jooble:", error);
    return [];
  }
}

async function fetchFindworkJobs(filters, limit) {
  try {
    const apiKey = FINDWORK_API_KEY;

    if (!apiKey) {
      console.error("Findwork API key not found");
      return [];
    }

    // Build query parameters based on the documentation
    const params = new URLSearchParams();

    // Add pagination parameters if limit is specified
    if (limit) {
      params.append("limit", limit.toString());
    }

    // Add search parameters
    if (filters.query) {
      params.append("search", filters.query);
    }

    if (filters.location) {
      params.append("location", filters.location);
    }

    // Add sort parameter - default to date_posted which is their default
    params.append("sort_by", filters.sortBy === "relevance" && filters.query ? "relevance" : "date_posted");

    // Add remote filter if needed
    if (filters.jobType === "remote") {
      params.append("remote", "true");
    }

    // Construct the URL with query parameters
    const url = `https://findwork.dev/api/jobs/?${params.toString()}`;

    console.log("Findwork API URL:", url);

    // Make the API request with the Token authentication as shown in the documentation
    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    if (response.status !== 200) {
      const errorText = response.data;
      console.error(`Findwork API error response: ${errorText}`);
      throw new Error(`Findwork API error: ${response.status}`);
    }

    const data = response.data;

    // Check if the response has the expected format
    if (!data || !Array.isArray(data.results)) {
      console.error("Unexpected Findwork response format:", data);
      return [];
    }

    // Map Findwork jobs to our normalized format
    const jobs = data.results.map((job) => ({
      id: job.id.toString(),
      title: job.role,
      company: job.company_name,
      location: job.remote ? "Remote" : job.location,
      description: job.text || "",
      salary: formatSalary(job.salary_min, job.salary_max),
      url: job.url,
      datePosted: job.date_posted,
      jobType: job.employment_type,
      source: "findwork",
    }));

    return limit ? jobs.slice(0, limit) : jobs;
  } catch (error) {
    console.error("Error fetching from Findwork:", error);
    return [];
  }
}


async function fetchRemotiveJobs(filters, limit) {
  try {
    // Remotive API doesn't require an API key for their public endpoint

    // Build query parameters
    const params = new URLSearchParams();

    if (filters.query) {
      params.append("search", filters.query);
    }

    if (filters.jobType && filters.jobType !== "any") {
      params.append("job_type", mapJobType(filters.jobType, "remotive"));
    }

    // Make the API request
    const response = await axios.get(`https://remotive.com/api/remote-jobs?${params.toString()}`);

    if (response.status !== 200) {
      const errorText = response.data;
      console.error(`Remotive API error response: ${errorText}`);
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = response.data;

    // Map Remotive jobs to our normalized format
    const jobs = (data.jobs || []).map((job) => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || "Remote",
      description: job.description,
      salary: job.salary || undefined,
      url: job.url,
      datePosted: job.publication_date,
      jobType: job.job_type,
      source: "remotive",
    }));

    return limit ? jobs.slice(0, limit) : jobs;
  } catch (error) {
    console.error("Error fetching from Remotive:", error);
    return [];
  }
}




async function searchJobs(filters) {
  try {
    // Default to all APIs if not specified
    const apiSources = filters.apiSources || ["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"];

    // Initialize apiJobCounts for all APIs
    const apiJobCounts = {
      adzuna: 0,
      reed: 0,
      apijobs: 0,
      jooble: 0,
      findwork: 0,
      remotive: 0,
      scraped: 0,
    };

    // Create an array of API fetch promises based on the selected sources
    const apiPromises = apiSources.map((source) => {
      switch (source) {
      case "adzuna":
        return fetchAdzunaJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.adzuna = jobs.length;
          return jobs;
        })
        .then((jobs) => {
          apiJobCounts.adzuna = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Adzuna:", error);
          return [];
        });

      case "reed":
        return fetchReedJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.reed = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Reed:", error);
          return [];
        });

      case "apijobs":
        return fetchApiJobsJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.apijobs = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from APIJobs:", error);
          return [];
        });

      case "jooble":
        return fetchJoobleJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.jooble = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Jooble:", error);
          return [];
        });

      case "findwork":
        return fetchFindworkJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.findwork = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Findwork:", error);
          return [];
        });

      case "remotive":
        return fetchRemotiveJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.remotive = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Remotive:", error);
          return [];
        });

      case "scraped":
        return fetchScrapedJobs(filters, filters.limit)
        .then((jobs) => {
          apiJobCounts.scraped = jobs.length;
          return jobs;
        })
        .catch((error) => {
          console.error("Error fetching from Scraped:", error);
          return [];
        });

      default:
        return Promise.resolve([]);
      }
    });

    // Run all API requests in parallel
    const results = await Promise.all(apiPromises);

    // Combine results from all APIs
    let allJobs = [];
    for (const job of results.flat()) {
      try {
        // Only extract skills if description exists
        const skills = job.description ? await extractSkillsNLP(job.description) : [];
        allJobs.push({ ...job, skills });
      } catch (error) {
        console.error(`Error extracting skills for job ${job.id}:`, error);
        allJobs.push({ ...job, skills: [] });
      }
    }

    
    // Apply client-side filtering for additional filters
    if (filters.company) {
      allJobs = allJobs.filter((job) => job.company.toLowerCase().includes(filters.company.toLowerCase()));
    }
    if (filters.location) {
      allJobs = allJobs.filter((job) => job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));
    }
    if (filters.minSalary) {
      allJobs = allJobs.filter((job) => job.salary && extractSalaryValue(job.salary) >= filters.minSalary);
    }
    if (filters.maxSalary) {
      allJobs = allJobs.filter((job) => job.salary && extractSalaryValue(job.salary) <= filters.maxSalary);
    }
    if (filters.jobType && filters.jobType !== "any") {
      allJobs = allJobs.filter((job) => job.jobType && job.jobType.toLowerCase().includes(filters.jobType.toLowerCase()));
    }
    if (filters.remote) {
      allJobs = allJobs.filter((job) => job.location && job.location.toLowerCase() === "remote");
    }
    if (filters.datePosted && filters.datePosted !== "any") {
      const cutoffDate = getDateFromFilter(filters.datePosted);
      if (cutoffDate) {
        allJobs = allJobs.filter((job) => job.datePosted && new Date(job.datePosted) >= cutoffDate);
      }
    }
    

    // Sort results based on the sortBy filter
    const sortedJobs = sortJobs(allJobs, filters.sortBy || "relevance");

    // Return the jobs along with the API job counts
    return { jobs: sortedJobs, apiJobCounts };
  } catch (error) {
    console.error("Error searching jobs:", error);
    return { jobs: [], apiJobCounts: {} };
  }
}
app.post('/api/jobs/save', async (req, res) => {
  try {
    const { job, userId } = req.body;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    // Validate job fields
    if (!job || !job.jobId || !job.title || !job.company) {
      return res.status(400).json({ 
        error: 'Missing required job fields',
        required: ['jobId', 'title', 'company']
      });
    }

    // Check if job already saved for this user (no index needed)
    const existingJob = await SavedJob.findOne({
      userId: userId,
      jobId: job.jobId,
      title: job.title,
      company: job.company
    });

    if (existingJob) {
      return res.status(200).json({
        message: 'Job already saved',
        job: existingJob,
        exists: true
      });
    }

    // Save new job
    const savedJob = await SavedJob.create({
      jobId: job.jobId,
      title: job.title,
      company: job.company,
      location: job.location || null,
      description: job.description || null,
      salary: job.salary || null,
      url: job.url || null,
      datePosted: job.datePosted || new Date(),
      jobType: job.jobType || null,
      source: job.source || 'unknown',
      userId: userId,
      recommended: job.recommended || false,
      savedAt: new Date()
    });

    return res.status(201).json({
      message: 'Job saved successfully',
      job: savedJob,
      exists: false
    });

  } catch (error) {
    console.error('Error saving job:', error);
    return res.status(500).json({
      error: 'Failed to save job',
      details: error.message
    });
  }
});
app.get('/api/jobs/saved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: "ID utilisateur requis",
        required: ["userId"]
      });
    }

    const savedJobs = await SavedJob.find({ userId });

    res.status(200).json(savedJobs);
  } catch (error) {
    console.error('Erreur lors de la récupération des jobs enregistrés :', error);
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/jobs/saved/:userId/:jobId", async (req, res) => {
  try {
    const { userId, jobId } = req.params

    if (!userId || !jobId) {
      return res.status(400).json({
        error: "ID utilisateur et ID job requis",
        required: ["userId", "jobId"],
      })
    }

    // Find and delete the saved job
    const result = await SavedJob.findOneAndDelete({
      userId: userId,
      _id: jobId,
    })

    if (!result) {
      return res.status(404).json({
        error: "Job enregistré non trouvé",
        message: "Le job demandé n'existe pas ou a déjà été supprimé",
      })
    }

    res.status(200).json({
      success: true,
      message: "Job supprimé avec succès",
      deletedJob: result,
    })
  } catch (error) {
    console.error("Erreur lors de la suppression du job enregistré:", error)
    res.status(500).json({ error: error.message })
  }
})
// Add a route to handle job searches
app.post('/api/jobs/search', async (req, res) => {
  try {
    const rawFilters = req.body;
    
    // Normalisation des filtres
    const filters = {
      ...rawFilters,
      location: rawFilters.location 
        ? rawFilters.location.trim().toLowerCase() 
        : null
    };

    const results = await searchJobs(filters);
    res.json(results);
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});






// Add a test route to verify the server is running
app.get('/test', (req, res) => {
  res.send('Job API Service is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Job API Service running on port ${PORT}`);
});

module.exports = {
  searchJobs, 
  fetchAdzunaJobs, 
  fetchReedJobs, 
  fetchApiJobsJobs, 
  fetchJoobleJobs, 
  fetchFindworkJobs, 
  fetchRemotiveJobs, 
  fetchScrapedJobs, 
  formatSalaryAdzuna, 
  formatSalary, 
  mapJobType, 
  extractSalaryValue, 
  getDateFromFilter, 
  mapEmploymentType, 
  formatApiJobsSalary, 
  sortJobs
};
