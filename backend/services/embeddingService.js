// services/embeddingService.js
const pipeline = async () => (await import('@xenova/transformers')).pipeline;

let embeddingPipeline = null;

/**
 * Loads the embedding model if not already loaded
 */
async function loadModel() {
  if (!embeddingPipeline) {
    console.log('Loading embedding model...');
    const { pipeline } = await import('@xenova/transformers');
    // Using a smaller model for efficiency
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Model loaded successfully');
  }
  return embeddingPipeline;
}


async function generateEmbedding(text) {
  try {
    // First, ensure the model is loaded
    const pipeline = await loadModel();
    
    // Ensure the text is plain and concise
    const sanitizedText = text.replace(/\s+/g, ' ').trim();
    
    // Generate embeddings using the feature-extraction pipeline
    const result = await pipeline(sanitizedText, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // Convert to array and return
    return Array.from(result.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

module.exports = { generateEmbedding };