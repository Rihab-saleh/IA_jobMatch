const axios = require('axios');
const SavedJob = require('../models/savedjob_model');
const userService = require('./userService');
const { sendJobRecommendationsEmail } = require('./emailService');
const { searchJobs } = require('./jobApiService');
const AdminConfig = require('../models/adminConfig_model');

/**
 * Extrait les compétences significatives à partir d'un texte.
 */
function extractCompetencies(text) {
  const stopWords = new Set(['the', 'and', 'with', 'using', 'for', 'this']);
  return [...new Set(
    (text?.match(/\b[A-Za-z]{4,}\b/g) || [])
      .filter(term => !stopWords.has(term.toLowerCase()))
  )];
}

/**
 * Génère des recommandations d'emploi personnalisées pour un utilisateur.
 */
async function getRecommendationsForUser(userId) {
  try {
    if (!userId) throw new Error('userId is required');

    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) throw new Error(`Utilisateur non trouvé: ${userId}`);

    const userEmail = userProfile?.user?.person?.email;
    if (!userEmail) throw new Error('Email utilisateur introuvable');

    const config = await AdminConfig.findOne().sort({ updatedAt: -1 }).lean();
    const llmModel = config?.llmModel || 'mistral';
    const sources = config?.allowedApiSources || [];
    const jobTitle = userProfile.profile.jobTitle || '';
    const location = userProfile.profile.location || '';
    const skills = userProfile.profile.skills?.map(s => s.name) || [];
    const experiencesText = userProfile.profile.experiences?.[0]?.description || '';

    const experienceTerms = extractCompetencies(experiencesText);
    const competencies = [...skills, ...experienceTerms];
    console.log("jobTitle:", jobTitle);
    console.log("userProfile:", userProfile);
    const query = jobTitle;

    const jobData = await searchJobs({ query, location, limit: 300, apiSources: sources });
    const allJobs = jobData.jobs || [];

    const filteredJobs = allJobs

    if (filteredJobs.length === 0) {
      console.warn(`⚠️ Aucun emploi trouvé pour ${userEmail}`);
      return [];
    }

    let prompt = `You are a career matching assistant. Analyze the following profile and job listings:\nUser Profile:\n- Job Title: ${jobTitle}\n- Location: ${location}\n- Skills: ${skills.join(', ')}\n- Experience Summary: ${experiencesText.substring(0, 200)}\nJobs:`;
    filteredJobs.forEach((job, i) => {
      prompt += `\n---\nJob #${i}\nTitle: ${job.title}\nCompany: ${job.company || 'N/A'}\nDescription: ${(job.description || '').substring(0, 300).replace(/\n/g, ' ')}\nSkills Required: ${(job.skills || []).join(', ') || 'Not specified'}`;
    });
    prompt += `\nReturn ONLY a JSON array of recommended jobs like:\n[
      {
        "jobIndex": 0,
        "matchPercentage": 90,
        "matchReason": "Matches frontend and React skills"
      }
    ]\nOnly include jobs with matchPercentage >= 65.`;

    const response = await axios.post('http://localhost:11434/api/generate', {
      prompt,
      model: llmModel,
      stream: false,
    });

    const content = response.data.response?.trim();
    const match = content?.match(/\[.*\]/s);
    if (!match) throw new Error('Réponse LLM invalide: tableau JSON non trouvé');

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
          skillMatches: skills.filter(skill =>
            job.description?.toLowerCase().includes(skill.toLowerCase())
          ),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Récupérer les jobs déjà enregistrés
    const savedJobs = await SavedJob.find({ userId }).lean();
    const savedJobIds = savedJobs.map(job => job.jobId);

    // Filtrer pour garder seulement les nouveaux jobs
    const newRecommendations = validRecommendations.filter(job => {
      const jobId = job.id || job.url || `${job.title}-${job.company}`;
      return !savedJobIds.includes(jobId);
    });

    console.log(`✅ ${newRecommendations.length} NOUVELLES recommandations pour ${userEmail}`);
    newRecommendations.forEach((job, i) => {
      console.log(`📬 Nouveau Job #${i + 1}: ${job.title} at ${job.company} (${job.matchPercentage}%)`);
    });

    if (newRecommendations.length > 0) {
      // Enregistrer les nouveaux jobs
      await saveRecommendedJobs(userId, newRecommendations);
      // Envoyer seulement les nouveaux jobs par email
      await sendJobRecommendationsEmail(userEmail, newRecommendations);
    } else {
      console.warn(`⚠️ Aucune NOUVELLE recommandation pour ${userEmail}`);
    }

    return newRecommendations;

  } catch (err) {
    console.error('[ERROR] getRecommendationsForUser:', err.message);
    throw err;
  }
}

/**
 * Enregistre les emplois recommandés pour un utilisateur.
 */
async function saveRecommendedJobs(userId, jobs) {
  for (const job of jobs) {
    const jobId = job.id || job.url || `${job.title}-${job.company}`;

    let datePosted = null;
    if (job.datePosted) {
      if (typeof job.datePosted === 'string') {
        const [day, month, year] = job.datePosted.split('/');
        if (day && month && year) {
          datePosted = new Date(`${year}-${month}-${day}`);
        }
      } else {
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
        skills: job.skills,
        experience: job.experience,
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