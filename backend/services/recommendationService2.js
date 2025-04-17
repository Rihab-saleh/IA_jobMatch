// backend/services/recommendationService2.js

const axios = require('axios');
const User = require('../models/user_model');
const UserPreferences = require('../models/UserPreferences_model');
const { searchJobs } = require('./jobApiService');
const userService = require('./userService');

/**
 * Get job recommendations for a user using Ollama and Llama 2
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of recommended job objects
 */
async function getRecommendationsForUser(userId) {
  try {
    // 1. Fetch user profile and preferences
    const userProfile = await userService.getUserProfile(userId);

    const jobData = await searchJobs({ query: userProfile.jobTitle }); // Fetch all jobs for simplicity, adjust as needed
    const jobs = jobData.jobs;

    // 3. Construct the prompt for Llama 2
    let prompt = `Given the following user profile and job descriptions, identify the top 10 most relevant jobs for the user and provide a match percentage for each.

    User Profile:
    ${JSON.stringify(userProfile, null, 2)}\n

    Job Descriptions:\n`;

    jobs.forEach(job => {
      prompt += `---\nJob ID: ${job.id}\n${job.description}\n` +
        `Title: ${job.title}\n` +
        `Company: ${job.company}\n` +
        `Location: ${job.location}\n` +
        `Salary: ${job.salary}\n` +
        `Experience Required: ${job.experience} years\n` +
        `Job Type: ${job.type}\n`;
    });

    prompt += `\n\nBased on the above information, which 10 jobs are the best fit for the user?
Provide a match percentage (0-100) for each job along with the job details.
Respond with a JSON array of objects, where each object has all job details plus a "matchPercentage". For example: [{
  "jobId": 123, 
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "Remote",
  "matchPercentage": 95
}, ...]`;

    // 4. Send the prompt to Ollama API
    const response = await axios.post('http://localhost:11434/api/generate', {
      prompt: prompt,
      model: 'mistral:instruct',
      stream: false
    });

    // 5. Parse the response to extract job IDs
    const content = response.data.response;
    console.log("Llama response:", content);
    const recommendations = JSON.parse(content.trim());

    // 6. Map the recommendations to the original job objects and add the match percentage
    const recommendedJobsWithMatch = recommendations.map(recommendation => {
      const job = jobs.find(j => j.id === recommendation.jobId);
      if (job) {
        return {
          ...job,
          matchPercentage: recommendation.matchPercentage
        };
      }
      return null; // Job not found, skip it
    }).filter(Boolean); // Remove null entries
    return recommendedJobsWithMatch;

  } catch (error) {
    console.error('Error getting recommendations from Ollama:', error);
    return [];
  }
}

/**
 * Get job recommendations based on a user profile text using Ollama and Llama 2
 * @param {string} profileText - Text describing the user's profile
 * @param {Array} jobs - Array of job objects to consider
 * @returns {Promise<Array>} - Array of recommended job objects
 */
async function getRecommendationsFromText(profileText, jobs) {
  // TODO: Implement recommendation logic using Ollama and Llama 2
  return [];
}

module.exports = {
  getRecommendationsForUser,
  getRecommendationsFromText,
};
