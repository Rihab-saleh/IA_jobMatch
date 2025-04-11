// services/jobCacheService.js
const { generateEmbedding } = require('./embeddingService');

// In-memory cache for job embeddings
// Key: jobId, Value: { job, embedding, timestamp }
const jobEmbeddingCache = new Map();

// Cache expiration time (24 hours)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Get embedding for a job (from cache or generate new)
 * @param {Object} job - Job object
 * @returns {Promise<Array>} - Embedding vector
 */
async function getJobEmbedding(job) {
  // Check if job is in cache and not expired

  const cachedItem = jobEmbeddingCache.get(job.id);
  
  const now = Date.now();
  
  if (cachedItem && (now - cachedItem.timestamp) < CACHE_EXPIRATION) {
    console.log('--------------------------------------------------------------')
    return cachedItem.embedding;
  }

  // Generate job text for embedding
  const jobText = `
    Title: ${job.title}
    Company: ${job.company.name || job.company.display_name}
    Description: ${job.description}
    ${job.location?.country ? `Location: ${job.location.country}` : job.location?.display_name ? `Location: ${job.location.display_name}` : job.location?.name ? `Location: ${job.location.name}` : ''}
    ${job.contractType ? `Type: ${job.contractType}` : ''}
    ${job.salary ? `Salary: ${job.salary}` : ''}
    ${job.sector ? `Sector: ${job.sector}` : ''}
    ${job.skills?.length ? `Skills: ${job.skills.join(', ')}` : ''}
  `.trim();
   // Generate new embedding
  const embedding = await generateEmbedding(jobText);
 
  // Store in cache
  jobEmbeddingCache.set(job.id, {
    job,
    embedding,
    timestamp: now
  });
  
  // If cache is too large, remove oldest entries
  if (jobEmbeddingCache.size > 10000) {
    const keysToDelete = [...jobEmbeddingCache.keys()]
      .sort((a, b) => jobEmbeddingCache.get(a).timestamp - jobEmbeddingCache.get(b).timestamp)
      .slice(0, 1000); // Remove oldest 1000 entries
      
    keysToDelete.forEach(key => jobEmbeddingCache.delete(key));
  }
  
  return embedding;
}

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  
  for (const [key, value] of jobEmbeddingCache.entries()) {
    if ((now - value.timestamp) > CACHE_EXPIRATION) {
      jobEmbeddingCache.delete(key);
    }
  }
}

// Run cache cleanup every hour
setInterval(clearExpiredCache, 60 * 60 * 1000);

module.exports = { getJobEmbedding };