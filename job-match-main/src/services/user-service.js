import { api } from "./api"

export const userService = {
  getUserProfile(userId) {
    return api.get(`users/profile/${userId}`)
  },

  getUserSkills(userId) {
    return api.get(`users/skills/${userId}`)
  },

  getUserJobs(userId) {
    return api.get(`users/jobs/${userId}`)
  },

  getUserRecommendations(userId) {
    return api.get(`users/recommendations/${userId}`)
  },

  getFormations(userId) {
    return api.get(`users/formations/${userId}`)
  },

  getExperiences(userId) {
    return api.get(`users/experiences/${userId}`)
  },

  updateUserSkill(userId, skillId, skillData) {
    return api.put(`users/skills/${userId}/${skillId}`, skillData)
  },

  updateUserProfile(userId, profileData) {
    return api.put(`users/profile/${userId}`, {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phoneNumber: profileData.phone,
      location: profileData.location,
      jobTitle: profileData.jobTitle,
      bio: profileData.bio
    })
  },

  deleteUserProfile(userId) {
    return api.delete(`users/profile/${userId}`)
  },

  addUserSkill(userId, skillData) {
    return api.post(`users/skills/${userId}`, skillData)
  },

  removeUserSkill(userId, skillId) {
    return api.delete(`users/skills/${userId}/${skillId}`)
  },

  addFormation(userId, formationData) {
    return api.post(`users/formations/${userId}`, formationData)
  },

  updateFormation(userId, formationId, formationData) {
    return api.put(`users/formations/${userId}/${formationId}`, formationData)
  },

  deleteFormation(userId, formationId) {
    return api.delete(`users/formations/${userId}/${formationId}`)
  },

  addExperience(userId, experienceData) {
    return api.post(`users/experiences/${userId}`, experienceData)
  },

  updateExperience(userId, experienceId, experienceData) {
    return api.put(`users/experiences/${userId}/${experienceId}`, experienceData)
  },

  deleteExperience(userId, experienceId) {
    return api.delete(`users/experiences/${userId}/${experienceId}`)
  },

  updateJobTitle(userId, jobTitleData) {
    return api.put(`users/profile/${userId}/job-title`, jobTitleData)
  },

  updateLocation(userId, locationData) {
    return api.put(`users/profile/${userId}/location`, locationData)
  },

  requestAccountStatusChange(statusData) {
    return api.post(`users/account/status-request`, statusData)
  },

  uploadProfilePicture(userId, file) {
    const formData = new FormData()
    formData.append("profilePicture", file)
    return api.post(`users/profile/${userId}/picture`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  deleteProfilePicture(userId) {
    return api.delete(`users/profile/${userId}/picture`)
  },

  getAllJobs() {
    return api.get("jobs/all")
  },

  saveJob(jobData) {
    return api.post("jobs/save", jobData)
  },

  searchJobsBySkills(params) {
    // Handle both array and string formats for skills
    const skills = params.skills || []
    const skillsParam = Array.isArray(skills) ? skills.join(",") : skills

    return api.get("jobs/search-by-skills", {
      params: {
        skills: skillsParam,
        location: params.where || params.location || "",
      },
    })
  },

  searchJobs(params) {
    return api.get("jobs/search", { params })
  },

  getScrapedJobs(params) {
    return api.get("jobs/scraped", { params })
  },
  getCertifications(userId) {
    return api.get(`users/certifications/${userId}`)
  },


  addCertification(userId, certificationData) {
    return api.post(`users/certifications/${userId}`, certificationData)
  },

  updateCertification(userId, certificationId, certificationData) {
    return api.put(`users/certifications/${userId}/${certificationId}`, certificationData)
  },


  deleteCertification(userId, certificationId) {
    return api.delete(`users/certifications/${userId}/${certificationId}`)
  },
  getLanguages(userId) {
    return api.get(`users/languages/${userId}`)
  },

  addLanguage(userId, languageData) {
    return api.post(`users/languages/${userId}`, languageData)
  },

  updateLanguage(userId, languageId, languageData) {
    return api.put(`users/languages/${userId}/${languageId}`, languageData)
  },

  deleteLanguage(userId, languageId) {
    return api.delete(`users/languages/${userId}/${languageId}`)
  },

  // API pour le numéro de téléphone
  updatePhoneNumber(userId, phoneData) {
    return api.put(`users/profile/${userId}/phone`, phoneData)
  },
}

