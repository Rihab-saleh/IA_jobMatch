// server.js - Optimized Express.js backend with job scraper integration

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cheerio = require('cheerio');
const workerpool = require('workerpool'); // Add this package: npm install workerpool
const { performance } = require('perf_hooks');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Create a worker pool for CPU-intensive tasks
const pool = workerpool.pool({
  minWorkers: 'max', // Use as many workers as CPU cores
  maxWorkers: 8,     // But limit to 8 max to avoid resource exhaustion
});

// Advanced caching system
const cache = {
  // Global cache
  all: {
    jobs: null,
    timestamp: null,
    expiresIn: 30 * 60 * 1000, // 30 minutes
  },
  // Per-source cache
  sources: {},
  // Per-query cache
  queries: {},
  // Last scrape results to enable incremental scraping
  lastScrapeIds: {},
  
  // Helper methods
  getSourceCache(source) {
    if (!this.sources[source]) {
      this.sources[source] = {
        jobs: null,
        timestamp: null,
        expiresIn: 15 * 60 * 1000, // 15 minutes
      };
    }
    return this.sources[source];
  },
  
  getQueryCache(key) {
    if (!this.queries[key]) {
      this.queries[key] = {
        jobs: null,
        timestamp: null,
        expiresIn: 10 * 60 * 1000, // 10 minutes
      };
    }
    return this.queries[key];
  },
  
  isValid(cacheEntry) {
    return (
      cacheEntry.jobs && 
      cacheEntry.timestamp && 
      Date.now() - cacheEntry.timestamp < cacheEntry.expiresIn
    );
  },
  
  storeLastScrapeIds(source, ids) {
    this.lastScrapeIds[source] = {
      ids: new Set(ids),
      timestamp: Date.now()
    };
  },
  
  getLastScrapeIds(source) {
    const entry = this.lastScrapeIds[source];
    if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      return entry.ids;
    }
    return new Set();
  }
};

// Request queue with rate limiting
class RequestQueue {
  constructor(concurrency = 10, interval = 1000) {
    this.queue = [];
    this.concurrency = concurrency;
    this.interval = interval;
    this.running = 0;
    this.domains = {}; // Track requests per domain
  }
  
  async add(url, options = {}) {
    return new Promise((resolve, reject) => {
      const domain = new URL(url).hostname;
      
      this.queue.push({
        url,
        options,
        domain,
        resolve,
        reject
      });
      
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    const task = this.queue.shift();
    this.running++;
    
    // Rate limit per domain
    if (!this.domains[task.domain]) {
      this.domains[task.domain] = {
        lastRequest: 0,
        queue: []
      };
    }
    
    const domainInfo = this.domains[task.domain];
    const now = Date.now();
    const timeToWait = Math.max(0, domainInfo.lastRequest + this.interval - now);
    
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    
    try {
      const response = await fetch(task.url, task.options);
      domainInfo.lastRequest = Date.now();
      task.resolve(response);
    } catch (error) {
      task.reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Create a request queue instance
const requestQueue = new RequestQueue(10, 500); // 10 concurrent, 500ms between requests to same domain

// Job sources configuration
const jobSources = [
  // WeWorkRemotely
  { 
    name: 'WeWorkRemotely',
    url: 'https://weworkremotely.com',
    type: 'rss',
    rssUrl: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    // Prioritize the most productive feeds instead of all of them
    alternativeUrls: [
      'https://weworkremotely.com/categories/remote-design-jobs.rss',
      'https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss',
      'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
      'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss',
      'https://weworkremotely.com/categories/remote-data-jobs.rss',
    ],
    selector: {
      container: '.feature',
      title: '.title',
      company: '.company',
      location: '.region',
      link: '.listing-link'
    },
    priority: 1 // Higher priority sources are scraped first
  },
  // LinkedIn
  { 
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/search',
    type: 'html',
    // Prioritize the most productive URLs
    alternativeUrls: [
      'https://www.linkedin.com/jobs/search?keywords=software%20engineer&location=Worldwide&f_WT=2',
      'https://www.linkedin.com/jobs/search?keywords=developer&location=Worldwide&f_WT=2',
      'https://www.linkedin.com/jobs/search?keywords=data%20scientist&location=Worldwide&f_WT=2',
      'https://www.linkedin.com/jobs/search?keywords=product%20manager&location=Worldwide&f_WT=2',
      'https://www.linkedin.com/jobs/search?keywords=designer&location=Worldwide&f_WT=2',
    ],
    pagination: {
      enabled: true,
      maxPages: 5, // Reduced from 20 to 5 for faster scraping
      param: 'start',
      earlyTermination: true // Stop pagination if we're not finding new jobs
    },
    selector: {
      container: '.job-search-card',
      title: '.base-search-card__title',
      company: '.base-search-card__subtitle',
      location: '.job-search-card__location',
      link: '.base-card__full-link'
    },
    priority: 2
  },
  // Dribbble
  { 
    name: 'Dribbble',
    url: 'https://dribbble.com/jobs',
    type: 'html',
    // Prioritize the most productive URLs
    alternativeUrls: [
      'https://dribbble.com/jobs?location=Anywhere&per_page=100&specialties=UI+Design',
      'https://dribbble.com/jobs?location=Anywhere&per_page=100&specialties=UX+Design',
      'https://dribbble.com/jobs?location=Remote&per_page=100',
    ],
    queryParams: {
      'per_page': '100'
    },
    pagination: {
      enabled: true,
      maxPages: 3, // Reduced from 10 to 3 for faster scraping
      param: 'page',
      earlyTermination: true
    },
    selector: {
      container: '.job-list-item',
      title: '.job-title',
      company: '.job-company',
      location: '.job-location',
      link: '.job-link'
    },
    priority: 3
  },
  // Hacker News Who's Hiring
  { 
    name: 'Hacker News Who\'s Hiring',
    url: 'https://news.ycombinator.com/item?id=39929247', // April 2024
    type: 'html',
    // Only use the most recent threads
    alternativeUrls: [
      'https://news.ycombinator.com/item?id=39573462', // March 2024
      'https://news.ycombinator.com/item?id=39217310', // February 2024
      'https://news.ycombinator.com/item?id=38842977', // January 2024
    ],
    selector: {
      container: '.commtext',
      title: 'p',
      company: 'p',
      location: 'p',
      link: 'a'
    },
    priority: 4
  }
];

// Test if a site can be scraped and which technique works
async function testSiteScrapeability(siteName) {
  // Check cache first
  const cacheKey = `scrapeability-${siteName.toLowerCase()}`;
  const cachedResult = cache.getQueryCache(cacheKey);
  
  if (cache.isValid(cachedResult)) {
    return cachedResult.jobs;
  }
  
  // Find the source by name
  const source = jobSources.find(s => s.name.toLowerCase() === siteName.toLowerCase());

  if (!source) {
    return {
      scrapable: false,
      technique: null,
      error: "Site not found in sources list",
      jobCount: 0,
    };
  }

  // Try different scraping techniques based on the source type
  const techniques = [];
  
  // If the source has an RSS feed, try that first
  if (source.type === "rss" && source.rssUrl) {
    techniques.push(async () => {
      const jobs = await scrapeWithRSS(source, 5); // Only get 5 jobs for testing
      if (jobs.length > 0) {
        return {
          scrapable: true,
          technique: "rss",
          error: null,
          jobCount: jobs.length,
        };
      }
      throw new Error("RSS technique failed");
    });
  }

  // Try with custom headers
  techniques.push(async () => {
    const jobs = await scrapeWithCustomHeaders(source, 5); // Only get 5 jobs for testing
    if (jobs.length > 0) {
      return {
        scrapable: true,
        technique: "custom-headers",
        error: null,
        jobCount: jobs.length,
      };
    }
    throw new Error("Custom headers technique failed");
  });

  // Try simple fetch as a last resort
  techniques.push(async () => {
    const jobs = await scrapeWithSimpleFetch(source, 5); // Only get 5 jobs for testing
    if (jobs.length > 0) {
      return {
        scrapable: true,
        technique: "simple-fetch",
        error: null,
        jobCount: jobs.length,
      };
    }
    throw new Error("Simple fetch technique failed");
  });

  // Try each technique in sequence
  for (const technique of techniques) {
    try {
      const result = await technique();
      
      // Cache the result
      cachedResult.jobs = result;
      cachedResult.timestamp = Date.now();
      
      return result;
    } catch (error) {
      // Continue to next technique
    }
  }

  // If we get here, none of the techniques worked
  const result = {
    scrapable: false,
    technique: null,
    error: "All scraping techniques failed",
    jobCount: 0,
  };
  
  // Cache the negative result too, but with shorter expiration
  cachedResult.jobs = result;
  cachedResult.timestamp = Date.now();
  cachedResult.expiresIn = 5 * 60 * 1000; // 5 minutes for negative results
  
  return result;
}

// Main function to scrape jobs from all or specific sources
async function scrapeJobs(source = 'all', limit = 1000000000) {
  const startTime = performance.now();
  console.log(`Starting job scrape for ${source} with limit ${limit}`);
  
  // Check cache first
  if (source === 'all') {
    if (cache.isValid(cache.all)) {
      console.log('Returning all jobs from cache');
      return {
        jobs: cache.all.jobs.slice(0, limit),
        totalJobs: cache.all.jobs.length,
        fromCache: true,
        timeTaken: 0
      };
    }
  } else {
    const sourceCache = cache.getSourceCache(source);
    if (cache.isValid(sourceCache)) {
      console.log(`Returning ${source} jobs from cache`);
      return {
        jobs: sourceCache.jobs.slice(0, limit),
        totalJobs: sourceCache.jobs.length,
        fromCache: true,
        timeTaken: 0
      };
    }
  }

  // Filter sources if a specific one is requested
  let sourcesToScrape = source !== 'all'
    ? jobSources.filter(s => s.name.toLowerCase() === source.toLowerCase())
    : [...jobSources];

  if (sourcesToScrape.length === 0) {
    return { jobs: [], totalJobs: 0, timeTaken: 0 };
  }
  
  // Sort sources by priority
  sourcesToScrape.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  
  // Array to hold all scraped jobs
  let allJobs = [];
  let jobsNeeded = limit;
  
  // Process sources in parallel, but in batches based on priority
  const currentPriority = sourcesToScrape[0].priority || 1;
  let currentBatch = sourcesToScrape.filter(s => (s.priority || 999) === currentPriority);
  let remainingSources = sourcesToScrape.filter(s => (s.priority || 999) !== currentPriority);
  
  while (currentBatch.length > 0 && jobsNeeded > 0) {
    console.log(`Processing batch of ${currentBatch.length} sources with priority ${currentPriority}`);
    
    // Process current batch in parallel
    const scrapePromises = currentBatch.map(async (jobSource) => {
      try {
        // Test which technique works for this source
        const testResult = await testSiteScrapeability(jobSource.name);
        
        if (!testResult.scrapable) {
          console.log(`Skipping ${jobSource.name} - not scrapable`);
          return [];
        }
        
        // Use the technique that worked in the test
        let jobs = [];
        
        switch (testResult.technique) {
          case 'simple-fetch':
            jobs = await scrapeWithSimpleFetch(jobSource, jobsNeeded);
            break;
          case 'custom-headers':
            jobs = await scrapeWithCustomHeaders(jobSource, jobsNeeded);
            break;
          case 'rss':
            jobs = await scrapeWithRSS(jobSource, jobsNeeded);
            break;
          default:
            jobs = [];
        }
        
        // Store in source-specific cache
        const sourceCache = cache.getSourceCache(jobSource.name);
        sourceCache.jobs = jobs;
        sourceCache.timestamp = Date.now();
        
        return jobs;
      } catch (error) {
        console.error(`Error scraping from ${jobSource.name}:`, error);
        return []; // Return empty array if this source fails
      }
    });
    
    // Wait for all scraping operations in this batch to complete
    const batchResults = await Promise.all(scrapePromises);
    
    // Combine all results from this batch
    const batchJobs = batchResults.flat();
    
    // Add batch jobs to the overall list, respecting the limit
    if (allJobs.length + batchJobs.length <= limit) {
      allJobs = [...allJobs, ...batchJobs];
    } else {
      // Only add jobs up to the limit
      const remainingSlots = limit - allJobs.length;
      allJobs = [...allJobs, ...batchJobs.slice(0, remainingSlots)];
    }
    
    // Update jobs needed
    jobsNeeded = limit - allJobs.length;
    
    // If we've reached the limit or have no more sources, stop
    if (jobsNeeded <= 0 || remainingSources.length === 0) {
      break;
    }
    
    // Prepare next batch
    const nextPriority = Math.min(...remainingSources.map(s => s.priority || 999));
    currentBatch = remainingSources.filter(s => (s.priority || 999) === nextPriority);
    remainingSources = remainingSources.filter(s => (s.priority || 999) !== nextPriority);
  }

  // Deduplicate jobs based on title + company combination
  const uniqueJobs = removeDuplicateJobs(allJobs);
  
  // Update the cache for 'all' if this was a full scrape
  if (source === 'all') {
    cache.all.jobs = uniqueJobs;
    cache.all.timestamp = Date.now();
  }
  
  const timeTaken = (performance.now() - startTime) / 1000;
  console.log(`Job scrape completed in ${timeTaken.toFixed(2)} seconds, found ${uniqueJobs.length} jobs`);

  return {
    jobs: uniqueJobs.slice(0, limit),
    totalJobs: uniqueJobs.length,
    fromCache: false,
    timeTaken
  };
}

// Helper function to remove duplicate jobs
function removeDuplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    // Create a unique key for each job
    const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Technique 1: Simple fetch - optimized
async function scrapeWithSimpleFetch(source, limit = Infinity) {
  if (!source.selector) {
    return [];
  }

  let allJobs = [];
  let newJobsCount = 0;
  let previousJobsCount = 0;
  const lastScrapeIds = cache.getLastScrapeIds(source.name);

  // Process main URL
  const mainJobs = await fetchAndParseUrl(source.url, source);
  allJobs = [...allJobs, ...mainJobs];
  
  // Early termination check
  if (allJobs.length >= limit) {
    return allJobs.slice(0, limit);
  }

  // Process alternative URLs if available - in parallel
  if (source.alternativeUrls && source.alternativeUrls.length > 0) {
    // Process in batches of 3 to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < source.alternativeUrls.length; i += batchSize) {
      const batch = source.alternativeUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          return await fetchAndParseUrl(url, source);
        } catch (error) {
          console.error(`Error fetching alternative URL ${url}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const batchJobs = batchResults.flat();
      
      allJobs = [...allJobs, ...batchJobs];
      
      // Early termination check
      if (allJobs.length >= limit) {
        return allJobs.slice(0, limit);
      }
    }
  }

  // Handle pagination if enabled
  if (source.pagination && source.pagination.enabled) {
    previousJobsCount = allJobs.length;
    
    for (let page = 2; page <= source.pagination.maxPages; page++) {
      try {
        const url = new URL(source.url);
        url.searchParams.set(source.pagination.param, page.toString());
        const jobs = await fetchAndParseUrl(url.toString(), source);

        // If no jobs found on this page, break the loop
        if (jobs.length === 0) break;

        allJobs = [...allJobs, ...jobs];
        newJobsCount = allJobs.length - previousJobsCount;
        previousJobsCount = allJobs.length;
        
        // Early termination checks
        if (allJobs.length >= limit) {
          break;
        }
        
        // If we're not finding many new jobs, stop pagination
        if (source.pagination.earlyTermination && newJobsCount < 5) {
          console.log(`Early termination for ${source.name} pagination - only found ${newJobsCount} new jobs on page ${page}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
  }
  
  // Store job IDs for incremental scraping
  const jobIds = allJobs.map(job => job.id);
  cache.storeLastScrapeIds(source.name, jobIds);

  return allJobs.slice(0, limit);

  // Helper function to fetch and parse a URL
  async function fetchAndParseUrl(url, source) {
    // Add query parameters if specified
    const fetchUrl = new URL(url);
    if (source.queryParams) {
      Object.entries(source.queryParams).forEach(([key, value]) => {
        fetchUrl.searchParams.set(key, value);
      });
    }

    try {
      const response = await requestQueue.add(fetchUrl.toString(), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from ${url}: ${response.status}`);
      }

      const html = await response.text();
      
      // Use worker pool for parsing to avoid blocking the main thread
      return await pool.exec(parseHtml, [html, source, url, lastScrapeIds]);
    } catch (error) {
      console.error(`Error in fetchAndParseUrl for ${url}:`, error);
      return [];
    }
  }
}

// Technique 2: Custom headers to mimic a browser - optimized
async function scrapeWithCustomHeaders(source, limit = Infinity) {
  if (!source.selector) {
    return [];
  }

  let allJobs = [];
  let newJobsCount = 0;
  let previousJobsCount = 0;
  const lastScrapeIds = cache.getLastScrapeIds(source.name);

  // Process main URL
  const mainJobs = await fetchAndParseUrl(source.url, source);
  allJobs = [...allJobs, ...mainJobs];
  
  // Early termination check
  if (allJobs.length >= limit) {
    return allJobs.slice(0, limit);
  }

  // Process alternative URLs if available - in parallel
  if (source.alternativeUrls && source.alternativeUrls.length > 0) {
    // Process in batches of 3 to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < source.alternativeUrls.length; i += batchSize) {
      const batch = source.alternativeUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          return await fetchAndParseUrl(url, source);
        } catch (error) {
          console.error(`Error fetching alternative URL ${url}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const batchJobs = batchResults.flat();
      
      allJobs = [...allJobs, ...batchJobs];
      
      // Early termination check
      if (allJobs.length >= limit) {
        return allJobs.slice(0, limit);
      }
    }
  }

  // Handle pagination if enabled
  if (source.pagination && source.pagination.enabled) {
    previousJobsCount = allJobs.length;
    
    for (let page = 2; page <= source.pagination.maxPages; page++) {
      try {
        const url = new URL(source.url);
        url.searchParams.set(source.pagination.param, page.toString());
        const jobs = await fetchAndParseUrl(url.toString(), source);

        // If no jobs found on this page, break the loop
        if (jobs.length === 0) break;

        allJobs = [...allJobs, ...jobs];
        newJobsCount = allJobs.length - previousJobsCount;
        previousJobsCount = allJobs.length;
        
        // Early termination checks
        if (allJobs.length >= limit) {
          break;
        }
        
        // If we're not finding many new jobs, stop pagination
        if (source.pagination.earlyTermination && newJobsCount < 5) {
          console.log(`Early termination for ${source.name} pagination - only found ${newJobsCount} new jobs on page ${page}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        break;
      }
    }
  }
  
  // Store job IDs for incremental scraping
  const jobIds = allJobs.map(job => job.id);
  cache.storeLastScrapeIds(source.name, jobIds);

  return allJobs.slice(0, limit);

  // Helper function to fetch and parse a URL with custom headers
  async function fetchAndParseUrl(url, source) {
    // Add query parameters if specified
    const fetchUrl = new URL(url);
    if (source.queryParams) {
      Object.entries(source.queryParams).forEach(([key, value]) => {
        fetchUrl.searchParams.set(key, value);
      });
    }

    // Try different header combinations
    const headerSets = [
      // Chrome on Windows
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      // Firefox on Mac
      {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:96.0) Gecko/20100101 Firefox/96.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      // Safari on iPhone
      {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
      },
    ];

    // Cache the successful header set for this domain
    const domain = new URL(fetchUrl).hostname;
    const cacheKey = `headers-${domain}`;
    const cachedHeaders = cache.getQueryCache(cacheKey);
    
    if (cache.isValid(cachedHeaders) && cachedHeaders.jobs) {
      // Use the cached successful headers
      try {
        const response = await requestQueue.add(fetchUrl.toString(), {
          headers: cachedHeaders.jobs,
          cache: "no-store",
        });

        if (response.ok) {
          const html = await response.text();
          return await pool.exec(parseHtml, [html, source, url, lastScrapeIds]);
        }
      } catch (error) {
        // If cached headers fail, continue to try other headers
      }
    }

    // Try each header set until one works
    for (const headers of headerSets) {
      try {
        const response = await requestQueue.add(fetchUrl.toString(), {
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          continue; // Try next header set
        }

        const html = await response.text();
        const jobs = await pool.exec(parseHtml, [html, source, url, lastScrapeIds]);

        // If we got jobs, cache the successful headers and return the jobs
        if (jobs.length > 0) {
          cachedHeaders.jobs = headers;
          cachedHeaders.timestamp = Date.now();
          return jobs;
        }
      } catch (error) {
        // Try next header set
      }
    }

    // If all header sets failed, return empty array
    return [];
  }
}

// Technique 4: Try to use RSS feeds if available - optimized
async function scrapeWithRSS(source, limit = Infinity) {
  if (!source.rssUrl) {
    throw new Error("No RSS URL specified for this source");
  }

  let allJobs = [];
  const lastScrapeIds = cache.getLastScrapeIds(source.name);

  // Process main RSS URL
  const mainJobs = await fetchAndParseRss(source.rssUrl, source);
  allJobs = [...allJobs, ...mainJobs];
  
  // Early termination check
  if (allJobs.length >= limit) {
    return allJobs.slice(0, limit);
  }

  // Process alternative RSS URLs if available - in parallel
  if (source.alternativeUrls && source.alternativeUrls.length > 0) {
    // Process in batches of 3 to avoid overwhelming the server
    const batchSize = 3;
    for (let i = 0; i < source.alternativeUrls.length; i += batchSize) {
      const batch = source.alternativeUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          return await fetchAndParseRss(url, source);
        } catch (error) {
          console.error(`Error fetching alternative RSS URL ${url}:`, error);
          return [];
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      const batchJobs = batchResults.flat();
      
      allJobs = [...allJobs, ...batchJobs];
      
      // Early termination check
      if (allJobs.length >= limit) {
        return allJobs.slice(0, limit);
      }
    }
  }
  
  // Store job IDs for incremental scraping
  const jobIds = allJobs.map(job => job.id);
  cache.storeLastScrapeIds(source.name, jobIds);

  return allJobs.slice(0, limit);

  // Helper function to fetch and parse an RSS feed
  async function fetchAndParseRss(url, source) {
    try {
      const response = await requestQueue.add(url, {
        headers: {
          "Accept": "application/rss+xml, application/xml, text/xml",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch RSS from ${url}: ${response.status}`);
      }

      const xml = await response.text();
      
      // Use worker pool for parsing to avoid blocking the main thread
      return await pool.exec(parseRssXml, [xml, source, url, lastScrapeIds]);
    } catch (error) {
      console.error(`Error in fetchAndParseRss for ${url}:`, error);
      return [];
    }
  }
}

// Optimized HTML parsing function - moved to a worker
function parseHtml(html, source, baseUrl = source.url, lastScrapeIds = new Set()) {
  if (!source.selector) {
    return [];
  }

  const $ = cheerio.load(html);
  const jobs = [];
  
  // Special handling for Hacker News Who's Hiring
  if (source.name === 'Hacker News Who\'s Hiring') {
    // Find all comments
    $('.commtext').each((i, el) => {
      const commentText = $(el).text().trim();
      
      // Skip if it's too short to be a job posting
      if (commentText.length < 30) return;
      
      // Extract job details using regex patterns
      const titleMatch = commentText.match(/([^|:]+?(?:engineer|developer|designer|manager|director|architect|lead|senior|junior|intern|specialist|consultant|analyst|scientist|researcher|administrator|coordinator|strategist|marketer|writer|editor|producer|head of|vp of|chief|cto|ceo|coo|cfo).*?)(?:\||$)/i);
      
      const companyMatch = commentText.match(/(?:^|\|)\s*([A-Za-z0-9\s&.']+?(?:\s(?:Inc|LLC|Ltd|GmbH|BV|SAS|AG|Co|Corp|Corporation|Technologies|Technology|Software|Systems|Labs|Studio|Media|Group|Partners|Ventures|Capital|Solutions))?)\s*(?:\||$)/);
      
      const locationMatch = commentText.match(/(?:REMOTE|ONSITE|HYBRID|(?:San Francisco|New York|London|Berlin|Austin|Seattle|Boston|Toronto|Vancouver|Amsterdam|Paris|Sydney|Melbourne|Singapore|Hong Kong|Tokyo|Dubai|Tel Aviv|Chicago|Los Angeles|Denver|Portland|Atlanta|Miami|Dallas|Washington DC|Barcelona|Munich|Zurich|Stockholm|Copenhagen|Oslo|Helsinki|Dublin|Brussels|Vienna|Madrid|Rome|Milan|Warsaw|Prague|Budapest|Lisbon|Athens)(?:[^a-zA-Z]|$))/i);
      
      const salaryMatch = commentText.match(/(?:\$|€|£|USD|EUR|GBP)[,\d]+(?:\s*-\s*(?:\$|€|£|USD|EUR|GBP)[,\d]+)?(?:\s*(?:k|K|thousand|million|M|per year|\/year|yearly|annual|p\.a\.|pa|\/yr|a year))?/i);
      
      const emailMatch = commentText.match(/[\w.-]+@[\w.-]+\.\w+/);
      
      const urlMatch = commentText.match(/https?:\/\/[^\s)]+/);
      
      const title = titleMatch ? titleMatch[1].trim() : 'Software Engineer';
      const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';
      const location = locationMatch ? locationMatch[0].trim() : 'Unknown Location';
      const salary = salaryMatch ? salaryMatch[0].trim() : undefined;
      
      // Get the comment URL
      const commentId = $(el).closest('.athing').attr('id');
      const url = commentId ? `https://news.ycombinator.com/item?id=${commentId}` : 
                 urlMatch ? urlMatch[0] : 
                 emailMatch ? `mailto:${emailMatch[0]}` : 
                 baseUrl;
      
      // Extract description - take a portion of the comment text
      const description = commentText.length > 300 ? 
                          commentText.substring(0, 300) + '...' : 
                          commentText;
      
      const jobId = `hn-${baseUrl}-${i}`;
      
      // Skip if we've seen this job before (incremental scraping)
      if (lastScrapeIds.has(jobId)) {
        return;
      }
      
      // Only add if we have extracted meaningful information
      if (title !== 'Software Engineer' || company !== 'Unknown Company') {
        jobs.push({
          id: jobId,
          title,
          company,
          location,
          url,
          source: source.name,
          description,
          salary
        });
      }
    });
    
    return jobs;
  }

  // Optimized parsing for regular sites
  // Use more efficient selectors
  const containerSelector = source.selector.container;
  const titleSelector = `${containerSelector} ${source.selector.title}`;
  const companySelector = `${containerSelector} ${source.selector.company}`;
  const locationSelector = `${containerSelector} ${source.selector.location}`;
  const linkSelector = `${containerSelector} ${source.selector.link}`;
  
  // Get all elements at once
  const containers = $(containerSelector);
  
  containers.each((i, container) => {
    const $container = $(container);
    const title = $container.find(source.selector.title).text().trim();
    const company = $container.find(source.selector.company).text().trim();
    const location = $container.find(source.selector.location).text().trim();
    
    // Get the job URL
    let url = $container.find(source.selector.link).attr("href") || "";
    
    // Make sure the URL is absolute
    if (url && !url.startsWith("http")) {
      url = new URL(url, baseUrl).toString();
    }
    
    const jobId = `${source.name.toLowerCase()}-${i}`;
    
    // Skip if we've seen this job before (incremental scraping)
    if (lastScrapeIds.has(jobId)) {
      return;
    }
    
    // Only add if we have at least a title
    if (title) {
      jobs.push({
        id: jobId,
        title,
        company: company || source.name,
        location: location || "Not specified",
        url: url || baseUrl,
        source: source.name,
      });
    }
  });

  return jobs;
}

// RSS XML parsing function - moved to a worker
function parseRssXml(xml, source, baseUrl, lastScrapeIds = new Set()) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const jobs = [];

  $("item").each((i, el) => {
    const title = $(el).find("title").text().trim();
    const link = $(el).find("link").text().trim();
    const description = $(el).find("description").text().trim();
    const pubDate = $(el).find("pubDate").text().trim();

    // Extract company and location from description
    let company = source.name;
    let location = "Remote";

    // Parse description to extract more info
    const descriptionHtml = cheerio.load(description);

    // Different parsing logic based on the source
    if (source.name === "RemoteOK") {
      company = descriptionHtml(".company").text().trim() || company;
      location = descriptionHtml(".location").text().trim() || location;
    } else if (source.name === "WeWorkRemotely") {
      // Extract from title which often has format "Company: Job Title"
      const titleParts = title.split(":");
      if (titleParts.length > 1) {
        company = titleParts[0].trim();
      }
    } else if (source.name === "AuthenticJobs") {
      // AuthenticJobs format
      const companyMatch = title.match(/at\s+([^,]+)/);
      if (companyMatch && companyMatch[1]) {
        company = companyMatch[1].trim();
      }

      const locationMatch = title.match(/in\s+([^(]+)/);
      if (locationMatch && locationMatch[1]) {
        location = locationMatch[1].trim();
      }
    } else if (source.name === "StackOverflow") {
      // Stack Overflow format
      const companyMatch = title.match(/at\s+([^(]+)/);
      if (companyMatch && companyMatch[1]) {
        company = companyMatch[1].trim();
      }
    } else if (source.name === "Jobspresso") {
      // Try to extract from description
      const companyMatch = description.match(/Company:\s*([^<]+)/);
      if (companyMatch && companyMatch[1]) {
        company = companyMatch[1].trim();
      }

      const locationMatch = description.match(/Location:\s*([^<]+)/);
      if (locationMatch && locationMatch[1]) {
        location = locationMatch[1].trim();
      }
    } else if (source.name === "Smashing Magazine Jobs") {
      // Try to extract from title which often has format "Job Title at Company"
      const companyMatch = title.match(/at\s+([^(]+)/);
      if (companyMatch && companyMatch[1]) {
        company = companyMatch[1].trim();
      }
    }
    
    const jobId = `${source.name.toLowerCase()}-rss-${i}`;
    
    // Skip if we've seen this job before (incremental scraping)
    if (lastScrapeIds.has(jobId)) {
      return;
    }

    if (title) {
      jobs.push({
        id: jobId,
        title,
        company,
        location,
        url: link || source.url,
        source: source.name,
        postedAt: pubDate,
      });
    }
  });

  return jobs;
}

// API Routes

// 1. Get all available job sources
app.get('/api/sources', (req, res) => {
  const sources = jobSources.map(source => ({
    name: source.name,
    url: source.url
  }));
  
  res.json({
    success: true,
    sources
  });
});

// 2. Test if a site is scrapable
app.get('/api/test-scrapeability', async (req, res) => {
  const { site } = req.query;
  
  if (!site) {
    return res.status(400).json({ 
      success: false,
      error: "Site parameter is required" 
    });
  }
  
  try {
    const result = await testSiteScrapeability(site);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error(`Error testing scrapeability for ${site}:`, error);
    res.status(500).json({
      success: false,
      scrapable: false,
      error: error.message || "Unknown error",
      technique: null,
      jobCount: 0
    });
  }
});

// 3. Scrape jobs from all or specific sources
app.get('/api/scrape-jobs', async (req, res) => {
  const { source = 'all', limit = 1000, query, location, remote } = req.query;
  
  // Check if we have a valid cache for this specific query
  const cacheKey = `query-${source}-${query || ''}-${location || ''}-${remote || ''}`;
  const queryCache = cache.getQueryCache(cacheKey);
  
  if (cache.isValid(queryCache)) {
    console.log(`Returning cached query results for ${cacheKey}`);
    
    // Apply limit to cached jobs
    const limitedJobs = queryCache.jobs.slice(0, parseInt(limit, 10));
    
    return res.json({
      success: true,
      jobs: limitedJobs,
      totalJobs: queryCache.jobs.length,
      fromCache: true,
      timeTaken: 0
    });
  }
  
  try {
    // Set a longer timeout for the request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 120000) // 2 minute timeout
    );
    
    const scrapePromise = scrapeJobs(source, parseInt(limit, 10));
    
    // Race between the scrape and the timeout
    const { jobs, totalJobs, timeTaken } = await Promise.race([
      scrapePromise,
      timeoutPromise
    ]);
    
    // Filter jobs if query parameters are provided
    let filteredJobs = jobs;
    
    if (query) {
      const queryLower = query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(queryLower) || 
        job.company.toLowerCase().includes(queryLower) ||
        (job.description && job.description.toLowerCase().includes(queryLower))
      );
    }
    
    if (location) {
      const locationLower = location.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(locationLower)
      );
    }
    
    if (remote === 'true') {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes('remote')
      );
    }
    
    // Cache the filtered results
    queryCache.jobs = filteredJobs;
    queryCache.timestamp = Date.now();
    
    res.json({
      success: true,
      jobs: filteredJobs,
      totalJobs: filteredJobs.length,
      fromCache: false,
      timeTaken
    });
  } catch (error) {
    console.error("Error scraping jobs:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error",
      jobs: []
    });
  }
});

// 4. Clear the cache
app.post('/api/clear-cache', (req, res) => {
  cache.all.jobs = null;
  cache.all.timestamp = null;
  cache.sources = {};
  cache.queries = {};
  
  res.json({
    success: true,
    message: "Cache cleared successfully"
  });
});

// 5. Get job statistics
app.get('/api/job-stats', async (req, res) => {
  try {
    // Check if we have a valid cache for job stats
    const cacheKey = 'job-stats';
    const statsCache = cache.getQueryCache(cacheKey);
    
    if (cache.isValid(statsCache)) {
      console.log('Returning cached job stats');
      return res.json({
        success: true,
        stats: statsCache.jobs,
        fromCache: true
      });
    }
    
    // Use cached jobs if available, otherwise scrape
    let jobs = [];
    
    if (cache.isValid(cache.all)) {
      jobs = cache.all.jobs;
    } else {
      const result = await scrapeJobs('all', 10000);
      jobs = result.jobs;
    }
    
    // Calculate statistics
    const stats = {
      totalJobs: jobs.length,
      bySource: {},
      byLocation: {},
      topCompanies: {},
      remoteJobs: 0
    };
    
    // Count jobs by source
    jobs.forEach(job => {
      // By source
      stats.bySource[job.source] = (stats.bySource[job.source] || 0) + 1;
      
      // By location (simplified)
      const locationKey = job.location.includes(',') ? 
        job.location.split(',')[1].trim() : job.location.trim();
      stats.byLocation[locationKey] = (stats.byLocation[locationKey] || 0) + 1;
      
      // By company
      stats.topCompanies[job.company] = (stats.topCompanies[job.company] || 0) + 1;
      
      // Remote count
      if (job.location.toLowerCase().includes('remote')) {
        stats.remoteJobs++;
      }
    });
    
    // Convert to sorted arrays
    stats.bySource = Object.entries(stats.bySource)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
      
    stats.byLocation = Object.entries(stats.byLocation)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 locations
      
    stats.topCompanies = Object.entries(stats.topCompanies)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 companies
    
    // Cache the stats
    statsCache.jobs = stats;
    statsCache.timestamp = Date.now();
    
    res.json({
      success: true,
      stats,
      fromCache: false
    });
  } catch (error) {
    console.error("Error generating job statistics:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Unknown error"
    });
  }
});

// 6. New endpoint to get performance metrics
app.get('/api/performance', (req, res) => {
  const metrics = {
    cacheSize: {
      all: cache.all.jobs ? cache.all.jobs.length : 0,
      sources: Object.keys(cache.sources).length,
      queries: Object.keys(cache.queries).length,
    },
    requestQueue: {
      queueLength: requestQueue.queue.length,
      running: requestQueue.running,
      domains: Object.keys(requestQueue.domains).length
    },
    workerPool: {
      stats: pool.stats()
    },
    memory: process.memoryUsage()
  };
  
  res.json({
    success: true,
    metrics
  });
});

// Clean up resources when the server shuts down
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  pool.terminate();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  pool.terminate();
  process.exit(0);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Optimized job scraper API running on port ${PORT}`);
});

// Export for testing
module.exports = app;