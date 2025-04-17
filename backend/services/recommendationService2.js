// backend/services/recommendationService2.js

const axios = require('axios');
const userService = require('./userService');
const { searchJobs } = require('./jobApiService');

/**
 * Get job recommendations for a user using Ollama and Llama 2
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of recommended job objects with all original data plus match info
 */
async function getRecommendationsForUser(userId) {
  try {
    // 1. Fetch user profile with all details
    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // 2. Search jobs with user's preferences
    const jobSearchParams = {
      query: userProfile.jobTitle,
      location: userProfile.location,
      distance: userProfile.searchRadius || 50,
      jobType: userProfile.preferredJobType,
      limit: 50 // Limit to top 50 jobs for analysis
    };

    const { jobs } = await searchJobs(jobSearchParams);
    if (!jobs || jobs.length === 0) {
      throw new Error('No jobs found matching criteria');
    }

    // 3. Prepare the prompt with all relevant job data
    const prompt = buildPrompt(userProfile, jobs);

    // 4. Call Ollama API with timeout
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'mistral:instruct',
      prompt: prompt,
      format: 'json',
      options: { temperature: 0.3 }
    }, { timeout: 15000 });

    // 5. Process and validate the response
    const recommendations = processResponse(response.data, jobs);

    // 6. Return enriched job data with match info
    return recommendations
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 10); // Return top 10 recommendations

  } catch (error) {
    console.error('Recommendation error:', error);
    return fallbackRecommendation(userId); // Fallback to basic matching
  }
}

/**
 * Build the analysis prompt with all job details
 */
function buildPrompt(userProfile, jobs) {
  return `[INST]
  Analyze these jobs for ${userProfile.name} (${userProfile.jobTitle}) in ${userProfile.location}.
  Consider these factors:
  - Title relevance (${userProfile.jobTitle})
  - Location (${userProfile.location}, ${userProfile.searchRadius}km)
  - Skills match (${userProfile.skills.join(', ')})
  - Experience (${userProfile.experienceYears} years)

  Return JSON array with ALL original job data plus:
  {
    "matchPercentage": 0-100,
    "matchReason": "Brief explanation"
  }

  Jobs data: ${JSON.stringify(jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    description: job.description.substring(0, 500), // Truncate long descriptions
    requirements: job.requirements,
    url: job.url,
    datePosted: job.datePosted,
    jobType: job.jobType,
    source: job.source
  })))}
  [/INST]`;
}

/**
 * Process API response and merge with original job data
 */
function processResponse(responseData, jobs) {
  try {
    const content = responseData.response;
    const recommendations = JSON.parse(content);

    if (!Array.isArray(recommendations)) {
      throw new Error('Invalid response format');
    }

    // Merge recommendation data with full job objects
    return recommendations.map(rec => {
      const fullJob = jobs.find(j => j.id === rec.id);
      if (!fullJob) return null;

      return {
        ...fullJob, // Include all original job data
        matchPercentage: Math.min(100, Math.max(0, rec.matchPercentage || 0)),
        matchReason: rec.matchReason || 'High relevance match',
        analysisDate: new Date().toISOString()
      };
    }).filter(Boolean);

  } catch (error) {
    console.error('Response processing error:', error);
    throw new Error('Failed to process recommendations');
  }
}

/**
 * Fallback recommendation strategy
 */
async function fallbackRecommendation(userId) {
  const userProfile = await userService.getUserProfile(userId);
  const { jobs } = await searchJobs({
    query: userProfile.jobTitle,
    location: userProfile.location,
    limit: 10
  });

  return jobs.map(job => ({
    ...job,
    matchPercentage: calculateBasicMatch(job, userProfile),
    matchReason: 'Basic title and location match',
    isFallback: true
  }));
}

/**
 * Basic matching algorithm for fallback
 */
function calculateBasicMatch(job, user) {
  let score = 0;
  
  // Title match (30%)
  if (job.title.toLowerCase().includes(user.jobTitle.toLowerCase())) {
    score += 30;
  }

  // Location match (40%)
  if (job.location.toLowerCase().includes(user.location.toLowerCase())) {
    score += 40;
  } else if (job.location.toLowerCase().includes('remote')) {
    score += 30;
  }

  // Skills match (30%)
  if (user.skills && user.skills.some(skill => 
    job.description.toLowerCase().includes(skill.toLowerCase())
  )) {
    score += 30;
  }

  return Math.min(100, score);
}

module.exports = {
  getRecommendationsForUser
};