const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { generateEmbedding } = require("../services/embeddingService");
const { getJobEmbedding } = require("../services/jobCacheService");
const userService = require("../services/userService");
const { searchJobs } = require('../services/jobApiService');
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();

// Configuration améliorée
const CONFIG = {
  MAX_RECOMMENDATIONS: 10,
  EMBEDDING_CONCURRENCY: 3,
  STOPWORDS: new Set(['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to']),
  FALLBACK_STRATEGIES: [
    { queries: ['developer'], location: 'Remote' },
    { queries: ['software engineer'], location: '' },
    { queries: ['full stack', 'web developer'], location: '' },
    { queries: ['backend', 'frontend'], location: 'Remote' }
  ],
  MIN_SIMILARITY_SCORE: 30
};

// Middleware de validation amélioré
const validateRequest = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId.trim())) {
      return res.status(400).json({
        success: false,
        error: "ID utilisateur invalide",
        details: `ID reçu: ${userId}`
      });
    }

    const cleanedUserId = userId.trim();
    if (!await userService.userExists(cleanedUserId)) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé"
      });
    }

    req.params.userId = cleanedUserId;
    next();
  } catch (error) {
    console.error("[Validation Error]", error);
    next(error);
  }
};

// Helper Functions améliorées
const buildSearchQueries = (profile, filters = {}) => {
  const baseQueries = [];
  const profileSkills = profile.skills || [];

  // 1. Requête principale
  if (filters.query || profile.jobTitle) {
    baseQueries.push({
      query: filters.query || profile.jobTitle,
      location: filters.location || profile.location || '',
      jobType: filters.jobType || 'any',
      isPrimary: true
    });
  }

  // 2. Requêtes basées sur les compétences
  if (profileSkills.length > 0) {
    const skillCombinations = [
      profileSkills.slice(0, 3).join(' '),
      ...profileSkills.slice(0, 5)
    ];
    
    skillCombinations.forEach(skillQuery => {
      baseQueries.push({
        query: skillQuery,
        location: filters.location || profile.location || '',
        jobType: filters.jobType || 'any'
      });
    });
  }

  return baseQueries.length > 0 ? baseQueries : null;
};

const executeSearch = async (searchQuery) => {
  try {
    const result = await searchJobs(searchQuery);
    return result.jobs || [];
  } catch (error) {
    console.error(`Search failed for query: ${searchQuery.query}`, error);
    return [];
  }
};

const processJobs = async (jobs, profileEmbedding) => {
  const results = [];
  
  for (let i = 0; i < jobs.length; i += CONFIG.EMBEDDING_CONCURRENCY) {
    const batch = jobs.slice(i, i + CONFIG.EMBEDDING_CONCURRENCY);
    
    const batchResults = await Promise.all(
      batch.map(async job => {
        try {
          const jobEmbedding = await getJobEmbedding(job);
          const similarity = cosineSimilarity(profileEmbedding, jobEmbedding);
          const score = Math.min(Math.round(similarity * 100), 100);
          
          return score >= CONFIG.MIN_SIMILARITY_SCORE ? {
            ...job,
            score,
            matchedAt: new Date().toISOString()
          } : null;
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          return null;
        }
      })
    );
    
    results.push(...batchResults.filter(Boolean));
  }

  return results.sort((a, b) => b.score - a.score);
};

// Route principale améliorée
router.post("/recommendations/:userId", validateRequest, async (req, res) => {
  try {
    const { userId } = req.params;
    const filters = req.body.filters || {};
    const searchMeta = { attempts: [], foundJobs: 0 };

    // 1. Récupération du profil
    const profileData = await userService.getUserProfile(userId);
    if (!profileData?.profile) {
      return res.status(422).json({
        success: false,
        error: "Profil utilisateur incomplet ou mal formaté"
      });
    }

    // 2. Génération de l'embedding du profil
    const profileText = [
      profileData.profile.bio,
      profileData.profile.jobTitle,
      profileData.profile.skills?.join(' '),
      profileData.profile.experiences?.map(e => 
        `${e.title || ''} ${e.company || ''} ${e.description || ''}`
      ).join(' ')
    ].filter(Boolean).join(' ');

    const profileEmbedding = await generateEmbedding(profileText);

    // 3. Stratégie de recherche
    let jobs = [];
    const searchQueries = buildSearchQueries(profileData.profile, filters) || [];

    // Exécution des requêtes principales
    for (const query of searchQueries) {
      const attempt = { ...query, results: 0 };
      const foundJobs = await executeSearch(query);
      
      attempt.results = foundJobs.length;
      searchMeta.attempts.push(attempt);
      
      jobs.push(...foundJobs);
      
      if (jobs.length >= 30) break; // Limite pour éviter trop de résultats
    }

    // Fallback stratégique si aucun résultat
    if (jobs.length === 0) {
      for (const strategy of CONFIG.FALLBACK_STRATEGIES) {
        for (const query of strategy.queries) {
          const fallbackQuery = {
            query,
            location: strategy.location || filters.location || '',
            jobType: filters.jobType || 'any',
            isFallback: true
          };
          
          const foundJobs = await executeSearch(fallbackQuery);
          searchMeta.attempts.push({
            ...fallbackQuery,
            results: foundJobs.length
          });
          
          if (foundJobs.length > 0) {
            jobs = foundJobs;
            break;
          }
        }
        if (jobs.length > 0) break;
      }
    }

    searchMeta.foundJobs = jobs.length;

    // 4. Filtrage et scoring des emplois
    const processedJobs = await processJobs(jobs, profileEmbedding);
    const recommendations = processedJobs.slice(0, CONFIG.MAX_RECOMMENDATIONS);

    // 5. Construction de la réponse
    const response = {
      success: true,
      data: {
        recommendations,
        meta: {
          profile: {
            jobTitle: profileData.profile.jobTitle,
            skills: profileData.profile.skills?.slice(0, 5),
            location: profileData.profile.location
          },
          search: searchMeta,
          processing: {
            jobsProcessed: jobs.length,
            recommendationsReturned: recommendations.length,
            minScore: CONFIG.MIN_SIMILARITY_SCORE
          }
        }
      }
    };

    if (recommendations.length === 0) {
      response.data.meta.warning = "Aucune recommandation ne dépasse le score de similarité minimum";
    }

    return res.json(response);

  } catch (error) {
    console.error("[Recommendation System Error]", error);
    
    const errorResponse = {
      success: false,
      error: "Échec du système de recommandation",
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    };

    return res.status(500).json(errorResponse);
  }
});

// Fonction cosineSimilarity optimisée
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dot = 0, normA = 0, normB = 0;
  const length = vecA.length;
  
  for (let i = 0; i < length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}

module.exports = router;