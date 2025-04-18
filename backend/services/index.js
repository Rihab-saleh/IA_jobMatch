const axios = require('axios');
const dotenv = require('dotenv');
const express = require("express");
const router = express.Router();
const { generateEmbedding } = require('../services/embeddingService');
const userService = require('../services/userService');
const { searchJobs } = require('./jobApiService');
const { sourcerepo } = require('googleapis/build/src/apis/sourcerepo');

dotenv.config();

// Hugging Face API fallback
const API_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${process.env.HUGGINGFACE_MODEL}`;
const HF_HEADERS = {
  Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
};

function cosineSimilarity(vecA, vecB){
  if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) {
    throw new Error('Invalid vectors for similarity calculation');
  }

  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
  
  return magnitudeA && magnitudeB 
    ? dotProduct / (magnitudeA * magnitudeB)
    : 0;
}

async function getEmbedding(text) {
  try {
    return await generateEmbedding(text);
  } catch (localError) {
    console.log('Using Hugging Face API fallback');
    try {
      const response = await axios.post(
        API_URL,
        { inputs: text },
        { headers: HF_HEADERS, timeout: 5000 }
      );
      return response.data?.[0];
    } catch (apiError) {
      console.error('Embedding generation failed:', apiError.message);
      throw new Error('Failed to generate text embeddings');
    }
  }
}

function createProfileText(profileData) {
  if (!profileData?.profile) {
    throw new Error('Invalid profile data');
  }

  const { profile, user } = profileData;
  const components = [
    `Professional Profile: ${user?.person?.firstName} ${user?.person?.lastName}`,
    `Current Role: ${profile.jobTitle || 'Not specified'}`,
    `Location: ${profile.location || 'Not specified'}`, // Localisation du profil
    `Summary: ${profile.bio || 'No bio available'}`,
    `Technical Skills: ${profile.skills?.join(', ') || 'No skills listed'}`,
    ...(profile.experiences?.map(exp => 
      `Experience: ${exp.title} at ${exp.company} (${exp.startYear}-${exp.endYear || 'Present'})`
    ) || []),
    ...(profile.formations?.map(edu => 
      `Education: ${edu.degree} from ${edu.institution}`
    ) || [])
  ];

  return components.filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
}

async function recommendJobs(profileText, jobs, topN = 5) {
  const profileEmbedding = await getEmbedding(profileText);
  
  const scoredJobs = await Promise.all(
    jobs.map(async job => {
      try {
        // Ajout de la localisation et description dans le texte du job
        const jobText = `${job.title} [${job.location}]: ${job.description}`;
        const jobEmbedding = await getEmbedding(jobText);
        return {
          ...job,
          score: cosineSimilarity(profileEmbedding, jobEmbedding)
        };
      } catch (error) {
        console.warn(`Skipping job ${job.id}: ${error.message}`);
        return null;
      }
    })
  );

  return scoredJobs
    .filter(job => job?.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(job => ({
      ...job,
      score: Number(job.score.toFixed(4))
    }));
}

router.get('/recommend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { keyword, limit = 5 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Récupération du profil avec localisation
    const profileData = await userService.getUserProfile(userId);
    const profileText = createProfileText(profileData);

    // Configuration de la recherche avec localisation du profil
    const searchKeyword = keyword || profileData.profile.jobTitle || 'remote';
    const filters = {
      query: searchKeyword,
      location: profileData.profile.location || '', // Utilisation de la localisation du profil
      apiSources: ["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"],
      limit: 30,
      sortBy: "date"
    };

    const { jobs } = await searchJobs(filters);
    
    if (!jobs.length) {
      return res.status(404).json({
        success: false,
        error: 'No jobs found for the given criteria'
      });
    }

    const recommendations = await recommendJobs(profileText, jobs, Math.min(limit, 10));

    res.json({
      success: true,
      data: {
        
        matchedJobs: recommendations.length,
        recommendations: recommendations.map(r => ({
          id: r.id,
          title: r.title,
          company: r.company,
          location: r.location, // Ajout de la localisation du job
          description: r.description.substring(0, 20000) , // Extrait de description
          searchJobs: r.searchJobs,
          source: r.source,
          date: r.date,
          contractType: r.contractType,
          skills: r.skills,
          score: r.score *100,
          category: r.category,
          url: r.url
        })),
        
      }
    });

  } catch (error) {
    console.error('Recommendation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate recommendations',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    });
  }
});

module.exports = router;