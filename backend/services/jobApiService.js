const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require("dotenv").config();

const app = express();
const PORT =  3000;

const ADZUNA_APP_ID="5349e2d4"
const ADZUNA_API_KEY="4915ded7f0af0dab86aeafbb5a6112f0"
const JOOBLE_API_KEY="ed9a3c23-dcac-4de0-8145-71db66b6a169"
const FINDWORK_API_KEY="ed9a3c23-dcac-4de0-8145-71db66b6a169"
const APIJOBS_API_KEY="4e4fce558288a8005970bb642a0569749178ce05c7f753f963411eddf47b4d81"
const REED_API_KEY="0d792c73-84b2-4f95-903e-ec4ceb3e8c11"
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Helper functions
const formatSalaryAdzuna = (min, max) => {
  if (!min && !max) {
    return "Negotiable";
  }

  if (min && !max) {
    return `$${min}+`;
  }

  if (!min && max) {
    return `Up to $${max}`;
  }

  return `$${min} - $${max}`;
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
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();

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
    const response = await fetch(`https://www.reed.co.uk/api/1.0/search?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Reed API error: ${response.status}`);
    }

    const data = await response.json();

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
    const response = await fetch("https://api.apijobs.dev/v1/job/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`APIJobs API error response: ${errorText}`);
      throw new Error(`APIJobs API error: ${response.status}`);
    }

    const data = await response.json();

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
    const params = `{ keywords: '${filters.query || ""}', location: '${filters.location || ""}' }`;

    // Make the API request according to the example
    const response = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: params, // Send the string directly as shown in the example
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Jooble API error response: ${errorText}`);
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data = await response.json();

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
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Findwork API error response: ${errorText}`);
      throw new Error(`Findwork API error: ${response.status}`);
    }

    const data = await response.json();

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
    const response = await fetch(`https://remotive.com/api/remote-jobs?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Remotive API error response: ${errorText}`);
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data = await response.json();

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
    const apiSources = filters.apiSources || ["adzuna", "reed", "apijobs", "jooble", "findwork"];

    // Initialize apiJobCounts for all APIs
    const apiJobCounts = {
      adzuna: 0,
      reed: 0,
      apijobs: 0,
      jooble: 0,
      findwork: 0,
      remotive: 0,
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

        default:
          return Promise.resolve([]);
      }
    });

    // Run all API requests in parallel
    const results = await Promise.all(apiPromises);

    // Combine results from all APIs
    let allJobs = results.flat();

    // Apply client-side filtering for additional filters
    if (filters.company) {
      allJobs = allJobs.filter((job) => job.company.toLowerCase().includes(filters.company.toLowerCase()));
    }

    if (filters.minSalary) {
      allJobs = allJobs.filter((job) => job.salary && extractSalaryValue(job.salary) >= filters.minSalary);
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
 
module.exports = {searchJobs, fetchAdzunaJobs, fetchReedJobs, fetchApiJobsJobs, fetchJoobleJobs, fetchFindworkJobs, fetchRemotiveJobs};