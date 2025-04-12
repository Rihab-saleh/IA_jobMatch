// services/recommendationService.js
const { generateEmbedding } = require('./embeddingService');
const { getUnifiedJobs } = require('./jobService');
const { getJobEmbedding } = require('./jobCacheService');
const User = require('../models/user_model');
const natural = require('natural');
const UserPreferences = require('../models/UserPreferences_model');
const { searchJobs } = require('./jobApiService');
const userService = require('./userService');
// Initialize tokenizer for keyword extraction
const tokenizer = new natural.WordTokenizer();
const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Extract keywords from text
 */
function extractKeywords(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens.filter(token => 
    token.length > 2 && !stopwords.includes(token)
  );
}

/**
 * Create a text representation of a user profile for embedding
 */
function createUserProfileText(profileData) {
  const experiencesText = profileData.experiences
    ?.map(exp => `${exp.title} ${exp.company} ${exp.description || ''}`)
    .join(' ');

  const formationsText = profileData.formations
    ?.map(formation => `${formation.degree} ${formation.institution} ${formation.fieldOfStudy || ''}`)
    .join(' ');

  const languagesText = profileData.languages
    ?.map(language => `${language.name} ${language.proficiency}`)
    .join(' ');

  const skillsText = profileData.skills
    ?.map(skill => skill.name)
    .join(' ');

  const certificationsText = profileData.certifications
    ?.map(cert => cert.name)
    .join(' ');

  return [
    experiencesText,
    formationsText,
    languagesText,
    certificationsText,
    skillsText,
    profileData.location || '',
    profileData.jobTitle || '',
    profileData.bio || ''
  ].join(' ');
}
function createUserPreferenceText(userPreferences) {
  return [
      userPreferences.sectors.join(' '),
      userPreferences.contractTypes.join(' '),
      `${userPreferences.location.city || ''} ${userPreferences.location.country || ''}`,
      userPreferences.preferredJobTypes.join(' '),
      userPreferences.experienceLevel.join(' '),
      userPreferences.skills.join(' '),
      userPreferences.expectedSalary.amount
          ? `${userPreferences.expectedSalary.amount} ${userPreferences.expectedSalary.currency}`
          : ''
  ].join(' ');
}

/**
 * Get job recommendations for a user
 * @param {string} userId - The user ID to get recommendations for
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} - Array of recommended jobs with scores
 */
async function getRecommendationsForUser(userId, limit = 10) {
    try {
      const user = await User.findById(userId)
      // Find the user and their preferences
      const userProfile = await userService.getUserProfile(userId);
   
console.log(userProfile)
      if (!user) {
        throw new Error('User not found');
      }

      // If no user preferences are set, return empty recommendations
      if (!userProfile) {
        return [];
      }

    // Create text representation of user profile
    const userProfileText = createUserProfileText(userProfile);
    console.log('User profile text:', userProfileText);
    // Generate embedding for user profile
    const userEmbedding = await generateEmbedding(userProfileText);
    
    // Extract keywords for pre-filtering
    const keywords = extractKeywords(userProfileText);
    console.log('Extracted keywords:', keywords);
    // Create basic filters for API
    const apiFilters = {
      keywords: keywords.slice(0, 5).join(','), // Use top 5 keywords
      location: user.preferredLocation,
      jobType: user.preferredJobType
    };
    
    const query = "";
    const location = "";
    const page = "1";
    const limit = "1000000";
    const pageNum = Number.parseInt(page);
    const limitNum = Number.parseInt(limit);

    const data = await searchJobs({"query": "software developer"});
    const jobs= data.jobs;
   // console.log(jobs)
    // Process jobs in parallel (with concurrency limit)
    const scoredJobs = await processJobsInBatches(jobs, userEmbedding, user, 10);
    
    // Sort by score (descending) and limit results
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Process jobs in batches with limited concurrency
 * @param {Array} jobs - Array of jobs to process
 * @param {Array} userEmbedding - User profile embedding
 * @param {Object} user - User object
 * @param {number} concurrency - Number of jobs to process concurrently
 * @returns {Promise<Array>} - Array of scored jobs
 */
async function processJobsInBatches(jobs, userEmbedding, user, concurrency = 10) {
  const results = [];
//  console.log('Processing jobs in batches:', jobs.length,'userEmbedding:', userEmbedding);
  // Process jobs in batches
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    
    // Process batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (job) => {
        try {
       
          // Get job embedding (from cache or generate new)
          const jobEmbedding = await getJobEmbedding(job);
   
          // Calculate similarity
          const similarity = cosineSimilarity(userEmbedding, jobEmbedding);
          console.log('Similarity:', similarity);
          // Calculate a match percentage (0-100)
          const matchPercentage = Math.round(similarity * 100);
          console.log('job:', job.title);
      
          // Final score (capped at 100)
          const finalScore = Math.min(matchPercentage , 100);
          
          return {
            ...job,
            score: finalScore
          };
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          return null;
        }
      })
    );
    
    // Add valid results to the array
    results.push(...batchResults.filter(Boolean));
  }
  
  return results;
}


async function getRecommendationsFromText(profileText, limit = 10) {
  try {
    // Extract keywords from profile text
    const keywords = extractKeywords(profileText);
    console.log('Extracted keywords:', keywords);
    // Generate embedding for profile text
    const profileEmbedding = await generateEmbedding(profileText);
    
    // Create basic filters for API
    const apiFilters = {
      keywords: keywords.slice(0, 5).join(',') 
    };
    
    // Extract location if present in profile text
    const locationMatch = profileText.match(/location:\s*([^\n]+)/i);
    if (locationMatch) {
      apiFilters.location = locationMatch[1].trim();
    }
    
    // Extract job type if present in profile text
    const jobTypeMatch = profileText.match(/job type:\s*([^\n]+)/i);
    if (jobTypeMatch) {
      apiFilters.jobType = jobTypeMatch[1].trim();
    }
    
    // Fetch jobs from external API with basic filtering
    const jobs = await fetchJobsFromAPI(apiFilters, 200);
    
    // Score jobs
    const scoredJobs = await Promise.all(
      jobs.map(async (job) => {
        // Get job embedding (from cache or generate new)
        const jobEmbedding = await getJobEmbedding(job);
        
        // Calculate similarity
        const similarity = cosineSimilarity(profileEmbedding, jobEmbedding);
        const score = Math.round(similarity * 100);
        
        return {
          ...job,
          score
        };
      })
    );
    
    // Sort by score (descending) and limit results
    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recommendations from text:', error);
    throw error;
  }
}

module.exports = {
  getRecommendationsForUser,
  getRecommendationsFromText
};