const axios = require('axios');
const SavedJob = require('../models/savedjob_model');
const userService = require('./userService');
const { searchJobs } = require('./jobApiService');
const AdminConfig = require('../models/adminConfig_model');

/**
 * Extrait les compétences significatives à partir d'un texte.
 */
function extractCompetencies(text) {
  const stopWords = new Set(['the', 'and', 'with', 'using', 'for', 'this']);
  return [...new Set(
    (text.match(/\b[A-Za-z]{4,}\b/g) || [])
      .filter(term => !stopWords.has(term.toLowerCase()))
  )];
}

/**
 * Génère des recommandations d'emploi personnalisées pour un utilisateur.
 */
async function getRecommendationsForUser(userId) {
  try {
    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) throw new Error("Utilisateur non trouvé");

    const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
    const llmModel = config?.llmModel || 'mistral';
    const sources = config?.allowedApiSources ;

    const jobTitle = userProfile.jobTitle || '';
    const location = userProfile.location || '';
    const skills = userProfile.skills?.map(s => s.name) || [];
    const experiencesText = userProfile.experiences?.[0]?.description || '';
    const experienceTerms = extractCompetencies(experiencesText);
    const competencies = [...skills, ...experienceTerms];
    const query = [jobTitle, ...skills].filter(Boolean).join(" ");

    const jobData = await searchJobs({ query, location, limit: 300, apiSources: sources });
    const allJobs = jobData.jobs || [];
    const filteredJobs = allJobs.filter(job => {
      const jobLocation = (job.location?.name || job.location || '').toLowerCase();
      return (
        job.title?.toLowerCase().includes(jobTitle.toLowerCase()) &&
        jobLocation.includes(location.toLowerCase())
      );
    });

    if (filteredJobs.length === 0) return [];

    let prompt = `You are a career matching assistant. Analyze the following profile and job listings:
User Profile:
- Job Title: ${jobTitle}
- Location: ${location}
- Skills: ${skills.join(', ')}
- Experience Summary: ${experiencesText.substring(0, 200)}
Jobs:`;

    filteredJobs.forEach((job, index) => {
      prompt += `\n---\nJob #${index}\nTitle: ${job.title}\nCompany: ${job.company || 'N/A'}\nDescription: ${job.description?.substring(0, 300)?.replace(/\n/g, ' ') || 'No description'}\nSkills Required: ${job.skills?.join(', ') || 'Not specified'}`;
    });

    prompt += `\nReturn ONLY a JSON array of recommended jobs like:
[
  {
    "jobIndex": 0,
    "matchPercentage": 90,
    "matchReason": "Matches frontend and React skills"
  }
]
Only include jobs with matchPercentage >= 65.`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      prompt,
      model: llmModel,
      stream: false
    });

    const content = response.data.response.trim();
    const match = content.match(/\[.*\]/s);
    if (!match) throw new Error("Réponse IA invalide : aucun tableau JSON trouvé.");

    const recommendations = JSON.parse(match[0]);
    const validRecommendations = recommendations
      .filter(r => r.matchPercentage >= 65)
      .map(r => {
        const job = filteredJobs[r.jobIndex];
        if (!job) return null;
        return {
          ...job,
          recommended: true,
          matchPercentage: r.matchPercentage,
          matchReason: r.matchReason,
          skillMatches: skills.filter(skill => job.description?.toLowerCase().includes(skill.toLowerCase()))
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    return validRecommendations;

  } catch (error) {
    console.error('[ERROR] getRecommendationsForUser:', error.message);
    throw error;
  }
}

/**
 * Enregistre les emplois recommandés pour un utilisateur.
 */
async function saveRecommendedJobs(userId, jobs) {
  for (const job of jobs) {
    const jobId = job.id || job.url || `${job.title}-${job.company}`;
    
    // 🛠️ Corriger le format de la date
    let datePosted = null;
    if (job.datePosted) {
      if (typeof job.datePosted === 'string') {
        // Convertir la date du format "DD/MM/YYYY" vers un objet Date
        const [day, month, year] = job.datePosted.split('/');
        if (day && month && year) {
          datePosted = new Date(`${year}-${month}-${day}`);
        }
      } else {
        // Si c'est déjà une date JS valide
        datePosted = new Date(job.datePosted);
      }
    }

    await SavedJob.findOneAndUpdate(
      { jobId, userId },
      {
        jobId,
        title: job.title,
        company: job.company,
        location: job.location?.name || job.location,
        description: job.description,
        salary: job.salary,
        url: job.url,
        datePosted: datePosted,
        jobType: job.jobType,
        source: job.source,
        userId,
        matchPercentage: job.matchPercentage,
        recommended: true,
        savedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
}


/**
 * Récupère les emplois recommandés déjà enregistrés.
 */
async function getSavedJobRecommendations(userId) {
  return await SavedJob.find({ userId, recommended: true }).sort({ savedAt: -1 });
}



module.exports = {
  getRecommendationsForUser,
  saveRecommendedJobs,
  getSavedJobRecommendations
};
