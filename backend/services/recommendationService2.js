const axios = require('axios');
const User = require('../models/user_model');
const UserPreferences = require('../models/UserPreferences_model');
const { searchJobs } = require('./jobApiService');
const userService = require('./userService');

/**
 * Extract unique competencies from text
 */
function extractCompetencies(text) {
  const stopWords = new Set(['the', 'and', 'with', 'using', 'for', 'this']);
  return [...new Set(
    (text.match(/\b[A-Za-z]{4,}\b/g) || [])
      .filter(term => !stopWords.has(term.toLowerCase()))
  )];
}

/**
 * Get job recommendations for a user using LLM
 */
async function getRecommendationsForUser(userId) {
  try {
    // 1. Get user profile
    const userProfile = await userService.getUserProfile(userId);
    const userSkills = userProfile.skills?.map(skill => skill.name) || [];

    const experiencesText = userProfile.experiences?.[0]?.description || '';
    const experienceTerms = experiencesText.match(/\b[A-Za-z]{4,}\b/g) || [];

    const userCompetencies = [...userSkills, ...experienceTerms].filter(term =>
      !['using', 'with', 'and', 'the'].includes(term.toLowerCase())
    );

    const searchQueries = [
      userProfile.jobTitle || '',
      ...userCompetencies,
      userProfile.formations?.[0]?.fieldOfStudy || ''
    ].filter(Boolean).slice(0, 5);

    // 2. Fetch jobs from APIs
    const jobData = await searchJobs({
      query: userProfile.jobTitle,
      location: userProfile.location ,
      limit: 300,
      /*jobType: "full_time",*/
      apiSources: ["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"]
    });

    const jobs = jobData?.jobs || [];
    if (jobs.length === 0) {
      console.log('No jobs found for recommendations');
      return [];
    }

    // 3. Build LLM prompt
    let prompt = `You are a professional career advisor. Analyze this profile and job listings to find the best matches:

User Profile:
- Current Position: ${userProfile.jobTitle || 'N/A'}
- Education: ${userProfile.formations?.[0]?.degree || 'N/A'} in ${userProfile.formations?.[0]?.fieldOfStudy || 'N/A'}
- Key Skills: ${userSkills.join(', ') || 'N/A'}
- Experience Highlights: ${experiencesText.substring(0, 200) || 'N/A'}
- Career Goals: ${userProfile.bio?.substring(0, 150) || 'N/A'}

Job Matching Criteria:
1. Skills alignment (40%)
2. Experience relevance (30%)
3. Education requirements (20%)
4. Location/cultural fit (10%)

Available Positions:
`;

    jobs.forEach((job, index) => {
      prompt += `---
Job #${index}
Title: ${job.title}
Company: ${job.company || 'Unknown'}
Key Requirements: ${job.skills?.join(', ') || 'Not specified'}
Description Summary: ${job.description?.substring(0, 300)?.replace(/\n/g, ' ') || 'No description'}
`;
    });

    prompt += `
Return ONLY a valid JSON array of this format:
[
  {
    "jobIndex": 0,
    "matchPercentage": 85,
    "matchReason": "Good match on frontend skills and Java experience"
  },
  ...
]

Only include jobs with matchPercentage > 65. Do not return any extra text or explanations.
`;

    // 4. Call LLM (Ollama)
    const response = await axios.post('http://localhost:11434/api/generate', {
      prompt,
      model: 'mistral:instruct',
      stream: false
    });

    const content = response.data?.response?.trim();
    const match = content.match(/\[.*\]/s);
    if (!match) throw new Error('LLM did not return a valid JSON array');

    const recommendations = JSON.parse(match[0]);

    // 5. Final filtering and enrichment
    return recommendations
      .filter(rec => rec.matchPercentage >= 65)
      .map(rec => {
        const job = jobs[rec.jobIndex];
        return {
          ...job,
          recommended: true, 
          matchPercentage: rec.matchPercentage,
          matchReason: rec.matchReason,
          skillMatches: userSkills.filter(skill =>
            job.description?.toLowerCase().includes(skill.toLowerCase())
          )
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

  } catch (error) {
    console.error('Recommendation system error:', error.message);
    return [];
  }
}

module.exports = {
  getRecommendationsForUser,
  extractCompetencies
};
