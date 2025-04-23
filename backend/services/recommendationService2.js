const axios = require('axios');
const userService = require('./userService');
const { searchJobs } = require('./jobApiService');

function extractCompetencies(text) {
  const stopWords = new Set(['the', 'and', 'with', 'using', 'for', 'this']);
  return [...new Set(
    (text.match(/\b[A-Za-z]{4,}\b/g) || [])
      .filter(term => !stopWords.has(term.toLowerCase()))
  )];
}

async function getRecommendationsForUser(userId) {
  try {
    // 1. Récupérer le profil utilisateur
    const userProfile = await userService.getUserProfile(userId);
    if (!userProfile) throw new Error("Utilisateur non trouvé");

    const jobTitle = userProfile.jobTitle || '';
    const location = userProfile.location || '';
    const skills = userProfile.skills?.map(s => s.name) || [];

    const experiencesText = userProfile.experiences?.[0]?.description || '';
    const experienceTerms = extractCompetencies(experiencesText);
    const competencies = [...skills, ...experienceTerms];

    // 2. Construire la requête de recherche
    const query = [jobTitle, ...skills].filter(Boolean).join(" ");

    const jobData = await searchJobs({
      query,
      location,
      limit: 300,
      apiSources: ["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"]
    });

    const allJobs = jobData?.jobs || [];

    // 3. Filtrer par jobTitle ET localisation
    const filteredJobs = allJobs.filter(job => {
      const jobLocation = (job.location?.name || job.location || '').toLowerCase();
      return (
        job.title?.toLowerCase().includes(jobTitle.toLowerCase()) &&
        jobLocation.includes(location.toLowerCase())
      );
    });

    if (filteredJobs.length === 0) {
      console.log('Aucune offre correspondante au titre de poste et à la localisation.');
      return [];
    }

    // 4. Construire le prompt pour l’IA
    let prompt = `You are a career matching assistant. Analyze the following profile and job listings:

User Profile:
- Job Title: ${jobTitle}
- Location: ${location}
- Skills: ${skills.join(', ')}
- Experience Summary: ${experiencesText.substring(0, 200)}

Jobs:
`;

    filteredJobs.forEach((job, index) => {
      prompt += `
---
Job #${index}
Title: ${job.title}
Company: ${job.company || 'N/A'}
Description: ${job.description?.substring(0, 300)?.replace(/\n/g, ' ') || 'No description'}
Skills Required: ${job.skills?.join(', ') || 'Not specified'}
`;
    });

    prompt += `
Return ONLY a JSON array of recommended jobs like:
[
  {
    "jobIndex": 0,
    "matchPercentage": 90,
    "matchReason": "Matches frontend and React skills"
  }
]
Only include jobs with matchPercentage >= 65.`;

    // 5. Appel à l’IA
    const response = await axios.post('http://localhost:11434/api/generate', {
      prompt,
      model: 'mistral:instruct',
      stream: false
    });

    const content = response.data?.response?.trim();
    const match = content.match(/\[.*\]/s);
    if (!match) throw new Error("Réponse IA invalide : aucun tableau JSON trouvé.");

    const recommendations = JSON.parse(match[0]);

    // 6. Retourner les résultats enrichis
    return recommendations
      .filter(r => r.matchPercentage >= 65)
      .map(r => {
        const job = filteredJobs[r.jobIndex];
        return {
          ...job,
          recommended: true,
          matchPercentage: r.matchPercentage,
          matchReason: r.matchReason,
          skillMatches: skills.filter(skill =>
            job.description?.toLowerCase().includes(skill.toLowerCase())
          )
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

  } catch (error) {
    console.error('Erreur recommandation:', error.message);
    throw error;
  }
}

module.exports = {
  getRecommendationsForUser,
  extractCompetencies
};
