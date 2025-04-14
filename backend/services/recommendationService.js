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
  if (!text) return [];
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens.filter(token => 
    token.length > 2 && !stopwords.includes(token)
  );
}

/**
 * Create a text representation of a user profile for embedding
 * Now handles both direct profile data and nested profile data
 */
function createUserProfileText(userData) {
  // Handle both direct profile data and nested profile data
  const profileData = userData.profile || userData;
  
  console.log('Processing profile data:', JSON.stringify(profileData, null, 2));

  // Process experiences
  const experiencesText = profileData.experiences && Array.isArray(profileData.experiences)
    ? profileData.experiences
        .map(exp => `${exp.jobTitle || ''} at ${exp.company || ''} in ${exp.location || ''} - ${exp.description || ''}`)
        .join(' ')
    : '';

  // Process formations
  const formationsText = profileData.formations && Array.isArray(profileData.formations)
    ? profileData.formations
        .map(formation => `${formation.degree || ''} from ${formation.school || ''} in ${formation.fieldOfStudy || ''} - ${formation.description || ''}`)
        .join(' ')
    : '';

  // Process skills
  const skillsText = profileData.skills && Array.isArray(profileData.skills)
    ? profileData.skills
        .map(skill => `${skill.name || ''} (${skill.level || ''})`)
        .join(', ')
    : '';

  // Process bio, location, and job title
  const bioText = profileData.bio || '';
  const locationText = profileData.location || '';
  const jobTitleText = profileData.jobTitle || '';

  // Log processed sections for debugging
  console.log('Experiences Text:', experiencesText);
  console.log('Formations Text:', formationsText);
  console.log('Skills Text:', skillsText);
  console.log('Bio Text:', bioText);
  console.log('Location Text:', locationText);
  console.log('Job Title Text:', jobTitleText);

  // Combine all sections into a single text representation
  const combinedText = [
    experiencesText,
    formationsText,
    skillsText,
    locationText,
    jobTitleText,
    bioText
  ].filter(text => text && text.trim() !== '').join(' ');
  
  console.log('Combined User Profile Text:', combinedText);
  return combinedText;
}

function createUserPreferenceText(userPreferences) {
  if (!userPreferences) return '';
  
  return [
      userPreferences.sectors?.join(' ') || '',
      userPreferences.contractTypes?.join(' ') || '',
      userPreferences.location ? `${userPreferences.location.city || ''} ${userPreferences.location.country || ''}` : '',
      userPreferences.preferredJobTypes?.join(' ') || '',
      userPreferences.experienceLevel?.join(' ') || '',
      userPreferences.skills?.join(' ') || '',
      userPreferences.expectedSalary?.amount
          ? `${userPreferences.expectedSalary.amount} ${userPreferences.expectedSalary.currency}`
          : ''
  ].filter(text => text && text.trim() !== '').join(' ');
}

/**
 * Get job recommendations for a user
 * @param {string} userId - The user ID to get recommendations for
 * @param {number} limit - Maximum number of recommendations to return
 * @returns {Promise<Array>} - Array of recommended jobs with scores
 */
async function getRecommendationsForUser(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Find the user and their preferences
      const userData = await userService.getUserProfile(userId);
      console.log('User data retrieved:', userData ? 'Yes' : 'No');
      
      if (!userData) {
        console.log('No user data found');
        return [];
      }

      // Extract profile data
      const profileData = userData.profile || userData;
      
      // Create text representation of user profile
      const userProfileText = createUserProfileText(userData);
      console.log('User profile text length:', userProfileText ? userProfileText.length : 0);
      
      if (!userProfileText || userProfileText.trim() === '') {
        console.log('User profile text is empty');
        return [];
      }
      
      // Generate embedding for user profile
      const userEmbedding = await generateEmbedding(userProfileText);
      
      // Extract keywords for pre-filtering
      const keywords = extractKeywords(userProfileText);
      console.log('Extracted keywords:', keywords);
      
      // Build search query with location
      const location = profileData.location || '';
      console.log('Using location for search:', location);
      
      let searchQuery = {
        query: "software developer"
      };
      
      // Add location to search query if available
      if (location && location.trim() !== '') {
        searchQuery.location = location;
        console.log('Added location to search query:', searchQuery);
      }
      
      try {
        // Search for jobs with the enhanced query
        console.log('Searching jobs with query:', JSON.stringify(searchQuery));
        const data = await searchJobs(searchQuery);
        const jobs = data.jobs;
        console.log(`Found ${jobs ? jobs.length : 0} jobs from search`);
        
        if (!jobs || jobs.length === 0) {
          console.log('No jobs found from search');
          return [];
        }
        
        // Process jobs in parallel (with concurrency limit)
        const scoredJobs = await processJobsInBatches(jobs, userEmbedding, user, 10);
        
        // Sort by score (descending) and limit results
        return scoredJobs
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      } catch (error) {
        console.error('Error searching for jobs:', error);
        return [];
      }
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
  console.log(`Processing ${jobs.length} jobs in batches with concurrency ${concurrency}`);
  
  // Process jobs in batches
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    console.log(`Processing batch ${Math.floor(i/concurrency) + 1} of ${Math.ceil(jobs.length/concurrency)}`);
    
    // Process batch concurrently
    const batchResults = await Promise.all(
      batch.map(async (job) => {
        try {
          // Get job embedding (from cache or generate new)
          const jobEmbedding = await getJobEmbedding(job);
   
          // Calculate similarity
          const similarity = cosineSimilarity(userEmbedding, jobEmbedding);
          
          // Calculate a match percentage (0-100)
          const matchPercentage = Math.round(similarity * 100);
          
          // Final score (capped at 100)
          const finalScore = Math.min(matchPercentage, 100);
          
          return {
            ...job,
            score: finalScore
          };
        } catch (error) {
          console.error(`Error processing job ${job.id || 'unknown'}:`, error);
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
    if (!profileText || profileText.trim() === '') {
      console.log('Profile text is empty');
      return [];
    }
    
    // Extract keywords from profile text
    const keywords = extractKeywords(profileText);
    console.log('Extracted keywords:', keywords);
    
    // Extract location if present in profile text
    const locationMatch = profileText.match(/location:\s*([^\n,]+)/i) || 
                         profileText.match(/in\s+([^\n,]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : '';
    console.log('Extracted location from text:', location);

    // Generate embedding for profile text
    const profileEmbedding = await generateEmbedding(profileText);
    
    // Build search query
    let searchQuery = {
      query: keywords.slice(0, 5).join(' ') || "software developer"
    };
    
    // Add location to search query if available
    if (location && location.trim() !== '') {
      searchQuery.location = location;
      console.log('Added location to text search query:', searchQuery);
    }
    
    try {
      // Search for jobs with the enhanced query
      console.log('Searching jobs with text query:', JSON.stringify(searchQuery));
      const data = await searchJobs(searchQuery);
      const jobs = data.jobs;
      
      if (!jobs || jobs.length === 0) {
        console.log('No jobs found from text search');
        return [];
      }
      
      // Score jobs
      const scoredJobs = await Promise.all(
        jobs.map(async (job) => {
          try {
            // Get job embedding (from cache or generate new)
            const jobEmbedding = await getJobEmbedding(job);
            
            // Calculate similarity
            const similarity = cosineSimilarity(profileEmbedding, jobEmbedding);
            const score = Math.round(similarity * 100);
            
            return {
              ...job,
              score
            };
          } catch (error) {
            console.error(`Error processing job for text recommendations:`, error);
            return null;
          }
        })
      );
      
      // Filter out null results, sort by score, and limit
      return scoredJobs
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error searching for jobs in text recommendations:', error);
      return [];
    }
  } catch (error) {
    console.error('Error getting recommendations from text:', error);
    throw error;
  }
}

module.exports = {
  getRecommendationsForUser,
  getRecommendationsFromText
};