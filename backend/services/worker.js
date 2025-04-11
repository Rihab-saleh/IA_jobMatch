
const { parseStringPromise } = require('xml2js');
const { parentPort } = require('worker_threads');
const cheerio = require('cheerio');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
parentPort.on('message', async (task) => {
    try {
      let result;
      
      if (task.type === 'scrape') {
        result = await scrapeJobs(task.source, task.filters || {}, task.supportsUrlFilters || []);
      } else if (task.type === 'testScrapeability') {
        result = await testScrapeability(task.siteName, task.jobSources);
      } else {
        throw new Error(`Unknown task type: ${task.type}`);
      }
      
      parentPort.postMessage(result);
    } catch (error) {
      console.error(`Worker error: ${error.message}`);
      parentPort.postMessage({ error: error.message });
    }
  });
  
  // Main scraping function
  async function scrapeJobs(source, filters = {}, supportsUrlFilters = []) {
    console.log(`Worker scraping ${source.name} with filters:`, filters);
    console.log(`URL filters supported: ${supportsUrlFilters.join(', ')}`);
    
    const jobs = [];
    
    try {
      // Scrape the main URL
      if (source.type === 'rss') {
        // For RSS feeds, use the rssUrl
        const mainJobs = await scrapeUrl(source, source.rssUrl || source.url, filters);
        jobs.push(...mainJobs);
      } else {
        // For HTML sources, use the main URL
        const mainJobs = await scrapeUrl(source, source.url, filters);
        jobs.push(...mainJobs);
      }
      
      // Scrape alternative URLs if available
      if (source.alternativeUrls && Array.isArray(source.alternativeUrls)) {
        for (const url of source.alternativeUrls) {
          const altJobs = await scrapeUrl(source, url, filters);
          jobs.push(...altJobs);
        }
      }
      
      // Apply post-processing filters for filters not supported via URL
      const filteredJobs = applyPostProcessingFilters(jobs, filters, supportsUrlFilters);
      
      return { jobs: filteredJobs };
    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error);
      return { jobs: [], error: error.message };
    }
  }
  
  // Scrape a single URL
  async function scrapeUrl(source, url, filters) {
    console.log(`Scraping URL: ${url}`);
    
    try {
      if (source.type === 'rss') {
        return await scrapeRss(source, url, filters);
      } else {
        return await scrapeHtml(source, url, filters);
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return [];
    }
  }
  
  // Scrape RSS feed
  async function scrapeRss(source, url, filters) {
    const response = await fetch(url);
    const xml = await response.text();
    
    const result = await parseStringPromise(xml, { explicitArray: false });
    
    if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      return [];
    }
    
    const items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];
    
    return items.map(item => ({
      title: item.title,
      company: item['dc:creator'] || item.creator || 'Unknown',
      description: item.description ? stripHtml(item.description) : '',
      location: item.location || item.region || 'Remote',
      link: item.link,
      date: item.pubDate || new Date().toISOString(),
      source: source.name
    }));
  }
  
  // Scrape HTML page
  async function scrapeHtml(source, url, filters) {
    const jobs = [];
    let currentUrl = url;
    let currentPage = 1;
    
    // Handle pagination if enabled
    const maxPages = source.pagination && source.pagination.enabled 
      ? source.pagination.maxPages || 3 
      : 1;
    
    while (currentPage <= maxPages) {
      try {
        console.log(`Scraping page ${currentPage} of ${maxPages}: ${currentUrl}`);
        
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          console.error(`Error fetching ${currentUrl}: ${response.status} ${response.statusText}`);
          break;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extract jobs from the page
        const pageJobs = extractJobsFromHtml($, source);
        jobs.push(...pageJobs);
        
        // Check if we need to continue to the next page
if (currentPage < maxPages && source.pagination && source.pagination.enabled) {
  const paramName = source.pagination.param || 'page';
  const nextPageValue = source.name === 'LinkedIn' 
    ? currentPage * 25  // LinkedIn uses offset-based pagination
    : currentPage + 1;  // Most sites use page numbers

  const urlObj = new URL(currentUrl);
  urlObj.searchParams.set(paramName, nextPageValue);
  currentUrl = urlObj.toString();
} else {
  break; // Ensure the loop breaks when no more pages are available
}
        
        currentPage++;
      } catch (error) {
        console.error(`Error scraping page ${currentPage} for ${source.name}:`, error);
        break;
      }
    }
    
    return jobs;
  }
  
  // Extract jobs from HTML using cheerio
  function extractJobsFromHtml($, source) {
    const jobs = [];
    
    // Special case for Hacker News
    if (source.name === 'Hacker News Who\'s Hiring') {
      return extractHackerNewsJobs($, source);
    }
    
    $(source.selector.container).each((i, el) => {
      try {
        const $el = $(el);
        
        const title = $el.find(source.selector.title).text().trim();
        const company = $el.find(source.selector.company).text().trim();
        const location = $el.find(source.selector.location).text().trim();
        
        // Get link - handle relative URLs
        let link = $el.find(source.selector.link).attr('href');
        if (link && !link.startsWith('http')) {
          link = new URL(link, source.url).toString();
        }
        
        // Only add if we have at least a title
        if (title) {
          jobs.push({
            title,
            company: company || 'Unknown',
            location: location || 'Not specified',
            link,
            description: '',
            date: new Date().toISOString(),
            source: source.name
          });
        }
      } catch (error) {
        console.error(`Error extracting job:`, error);
      }
    });
    
    return jobs;
  }
  
  // Special extraction for Hacker News Who's Hiring threads
  function extractHackerNewsJobs($, source) {
    const jobs = [];
    
    $('.commtext').each((i, el) => {
      try {
        const text = $(el).text();
        
        // Skip if it's not a job posting (too short or doesn't contain common job posting patterns)
        if (text.length < 50 || !(/hiring|remote|onsite|seeking|looking for/i.test(text))) {
          return;
        }
        
        // Extract title - usually the first line or sentence
        let title = text.split(/[\n\r.]/)[0].trim();
        if (title.length > 100) {
          title = title.substring(0, 97) + '...';
        }
        
        // Try to extract company name
        let company = 'Unknown';
        const companyMatch = text.match(/(?:at|@)\s+([A-Za-z0-9\s]+)[\s,\.]/i);
        if (companyMatch && companyMatch[1]) {
          company = companyMatch[1].trim();
        }
        
        // Try to extract location
        let location = 'Not specified';
        if (/remote/i.test(text)) {
          location = 'Remote';
        } else {
          const locationMatch = text.match(/(?:in|location|based in)\s+([A-Za-z0-9\s,]+)[\s\.]/i);
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].trim();
          }
        }
        
        // Extract link if available
        let link = '';
        $(el).find('a').each((i, a) => {
          const href = $(a).attr('href');
          if (href && /^https?:\/\//i.test(href) && !link) {
            link = href;
          }
        });
        
        jobs.push({
          title,
          company,
          location,
          link,
          description: text.substring(0, 300) + '...',
          date: new Date().toISOString(),
          source: source.name
        });
      } catch (error) {
        console.error(`Error extracting HN job:`, error);
      }
    });
    
    return jobs;
  }
  
  // Apply post-processing filters to jobs
  // Only apply filters that weren't already applied via URL parameters
  function applyPostProcessingFilters(jobs, filters, supportsUrlFilters) {
    if (!filters || Object.keys(filters).length === 0) {
      return jobs;
    }
    
    return jobs.filter(job => {
      // Filter by query/keywords if not already filtered via URL
      if ((filters.query || filters.keywords) && 
          !supportsUrlFilters.includes('query') && 
          !supportsUrlFilters.includes('keywords')) {
        const searchTerm = (filters.query || filters.keywords).toLowerCase();
        const titleMatch = job.title.toLowerCase().includes(searchTerm);
        const companyMatch = job.company.toLowerCase().includes(searchTerm);
        const descriptionMatch = job.description && job.description.toLowerCase().includes(searchTerm);
        
        if (!(titleMatch || companyMatch || descriptionMatch)) {
          return false;
        }
      }
      
      // Filter by location if not already filtered via URL
      if ((filters.location || filters.country || filters.city) && 
          !supportsUrlFilters.includes('location') && 
          !supportsUrlFilters.includes('country') && 
          !supportsUrlFilters.includes('city')) {
        const locationTerm = (filters.location || filters.country || filters.city).toLowerCase();
        if (!job.location.toLowerCase().includes(locationTerm)) {
          return false;
        }
      }
      
      // Filter by remote if not already filtered via URL
      if ((filters.remote === 'true' || filters.workplaceType === 'remote') && 
          !supportsUrlFilters.includes('remote') && 
          !supportsUrlFilters.includes('workplaceType')) {
        if (!job.location.toLowerCase().includes('remote')) {
          return false;
        }
      }
      
      // Filter by company if not already filtered via URL
      if ((filters.company || filters.organization) && 
          !supportsUrlFilters.includes('company') && 
          !supportsUrlFilters.includes('organization')) {
        const companyTerm = (filters.company || filters.organization).toLowerCase();
        if (!job.company.toLowerCase().includes(companyTerm)) {
          return false;
        }
      }
      
      // Filter by date (if job has a date and filters have a date)
      if (filters.since && job.date && !supportsUrlFilters.includes('since') && !supportsUrlFilters.includes('datePosted')) {
        const sinceDate = new Date(filters.since);
        const jobDate = new Date(job.date);
        
        if (isNaN(sinceDate.getTime()) || isNaN(jobDate.getTime()) || jobDate < sinceDate) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  // Test if a site is scrapable
  async function testScrapeability(siteName, jobSources) {
    // Check if the site is already in our known sources
    const knownSource = jobSources.find(s => 
      s.name.toLowerCase() === siteName.toLowerCase() ||
      s.url.includes(siteName.toLowerCase())
    );
    
    if (knownSource) {
      return {
        scrapable: true,
        technique: knownSource.type,
        jobCount: 10, // Placeholder
        source: knownSource
      };
    }
    
    // Try to determine if the site is scrapable
    try {
      // Assume it's a URL if it contains a dot
      const url = siteName.includes('.') 
        ? (siteName.startsWith('http') ? siteName : `https://${siteName}`)
        : `https://${siteName}.com`;
        
      // Try to fetch the site
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        return {
          scrapable: false,
          technique: null,
          jobCount: 0,
          error: `Site returned ${response.status} ${response.statusText}`
        };
      }
      
      const html = await response.text();
      
      // Check if it's an RSS feed
      if (html.includes('<rss') || html.includes('<feed')) {
        return {
          scrapable: true,
          technique: 'rss',
          jobCount: 0,
          message: 'Site appears to be an RSS feed'
        };
      }
      
      // Check for common job board indicators
      const $ = cheerio.load(html);
      const jobElements = $('div.job, .job-listing, .job-card, .job-post, article.job, .careers-listing, .listing-item, .job-result-card');
      
      if (jobElements.length > 0) {
        return {
          scrapable: true,
          technique: 'html',
          jobCount: jobElements.length,
          message: `Found ${jobElements.length} potential job elements`
        };
      }
      
      // Check for common job-related text
      const bodyText = $('body').text().toLowerCase();
      const hasJobsText = /jobs|careers|positions|openings|vacancies|employment/i.test(bodyText);
      
      if (hasJobsText) {
        return {
          scrapable: true,
          technique: 'html',
          jobCount: 0,
          message: 'Site contains job-related text, but no obvious job elements found'
        };
      }
      
      return {
        scrapable: false,
        technique: null,
        jobCount: 0,
        message: 'No job-related content detected'
      };
    } catch (error) {
      return {
        scrapable: false,
        technique: null,
        jobCount: 0,
        error: error.message
      };
    }
  }
  
  // Helper function to strip HTML tags
  function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }