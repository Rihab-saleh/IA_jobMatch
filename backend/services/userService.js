const User = require("../models/user_model")
const Person = require("../models/person_model")
const Profile = require("../models/profile_model")
const Recommendation = require("../models/recommendation_model")
const AccountStatusRequest = require("../models/accountstatus_request")

class UserService {
  async getOrCreateProfile(userId) {
    let profile = await Profile.findOne({ userId: userId })

    if (!profile) {
      profile = new Profile({
        userId: userId,
        experiences: [],
        formations: [],
        skills: [],
        location: "Non spécifié",
        jobTitle: "Non spécifié",
        bio: "",
      })
      await profile.save()
    }

    return profile
  }

  async getUserAndPerson(userId) {
    const user = await User.findById(userId)
    if (!user) throw new Error("Utilisateur non trouvé")

    const person = await Person.findById(user.person).select("-password")
    if (!person) throw new Error("Données personnelles non trouvées")

    return { user, person }
  }

  async updateProfileFields(profile, profileData) {
    const fields = ["location", "jobTitle", "experiences", "formations", "skills", "bio"]
    fields.forEach((field) => {
      if (profileData[field] !== undefined) profile[field] = profileData[field]
    })
    await profile.save()
    return profile
  }

  async getUserProfile(userId) {
    const { user, person } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    return {
      user: {
        _id: user._id,
        person: {
          _id: person._id,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phoneNumber: person.phoneNumber || "",
          role: person.role,
          profilePicture: person.profilePicture || { url: null, publicId: null },
        },
      },
      profile: {
        _id: profile._id,
        location: profile.location,
        jobTitle: profile.jobTitle,
        experiences: profile.experiences,
        formations: profile.formations,
        skills: profile.skills,
        bio: profile.bio || "",
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    }
  }

  async updateUserProfile(userId, profileData) {
    const { user, person } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    // Update person data if provided
    if (profileData.firstName) person.firstName = profileData.firstName
    if (profileData.lastName) person.lastName = profileData.lastName
    if (profileData.email) person.email = profileData.email
    if (profileData.phoneNumber !== undefined) person.phoneNumber = profileData.phoneNumber

    await person.save()
    await this.updateProfileFields(profile, profileData)

    return {
      user: {
        _id: user._id,
        person: {
          _id: person._id,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          phoneNumber: person.phoneNumber || "",
          role: person.role,
          profilePicture: person.profilePicture || { url: null, publicId: null },
        },
      },
      profile: {
        _id: profile._id,
        location: profile.location,
        jobTitle: profile.jobTitle,
        experiences: profile.experiences,
        formations: profile.formations,
        skills: profile.skills,
        bio: profile.bio || "",
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    }
  }

  async deleteUserProfile(userId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await Profile.findOne({ userId: userId })

    if (!profile) return { message: "Profil non trouvé, rien à supprimer" }

    await Profile.findByIdAndDelete(profile._id)
    return { message: "Profil supprimé avec succès" }
  }

  async getUserSkills(userId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)
    return profile.skills
  }

  async addUserSkill(userId, skillData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    if (!skillData.name) throw new Error("Le nom de la compétence est requis")

    const newSkill = {
      name: skillData.name,
      level: skillData.level || "Débutant",
    }

    profile.skills.push(newSkill)
    await profile.save()
    return newSkill
  }

  async updateUserSkill(userId, skillId, skillData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const skillIndex = profile.skills.findIndex((skill) => skill._id.toString() === skillId)
    if (skillIndex === -1) throw new Error("Compétence non trouvée")

    Object.keys(skillData).forEach((key) => {
      profile.skills[skillIndex][key] = skillData[key]
    })

    await profile.save()
    return profile.skills[skillIndex]
  }

  async removeUserSkill(userId, skillId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const skillExists = profile.skills.some((skill) => skill._id.toString() === skillId)
    if (!skillExists) throw new Error("Compétence non trouvée")

    profile.skills = profile.skills.filter((skill) => skill._id.toString() !== skillId)
    await profile.save()
    return { message: "Compétence supprimée avec succès" }
  }

  async getFormations(userId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)
    return profile.formations
  }

  async addFormation(userId, formationData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    if (!formationData.title) throw new Error("Le titre de la formation est requis")

    profile.formations.push(formationData)
    await profile.save()
    return profile.formations[profile.formations.length - 1]
  }

  async updateFormation(userId, formationId, formationData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const formationIndex = profile.formations.findIndex((formation) => formation._id.toString() === formationId)
    if (formationIndex === -1) throw new Error("Formation non trouvée")

    Object.keys(formationData).forEach((key) => {
      profile.formations[formationIndex][key] = formationData[key]
    })

    await profile.save()
    return profile.formations[formationIndex]
  }

  async deleteFormation(userId, formationId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const formationIndex = profile.formations.findIndex((formation) => formation._id.toString() === formationId)
    if (formationIndex === -1) throw new Error("Formation non trouvée")

    profile.formations.splice(formationIndex, 1)
    await profile.save()
    return { message: "Formation supprimée avec succès" }
  }

  async getExperiences(userId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)
    return profile.experiences
  }

  async addExperience(userId, experienceData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

   // if (!experienceData.title || !experienceData.company) throw new Error("Le titre et l'entreprise sont requis")

    profile.experiences.push(experienceData)
    await profile.save()
    return profile.experiences[profile.experiences.length - 1]
  }

  async updateExperience(userId, experienceId, experienceData) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const experienceIndex = profile.experiences.findIndex((experience) => experience._id.toString() === experienceId)
    if (experienceIndex === -1) throw new Error("Expérience non trouvée")

    Object.keys(experienceData).forEach((key) => {
      profile.experiences[experienceIndex][key] = experienceData[key]
    })

    await profile.save()
    return profile.experiences[experienceIndex]
  }

  async deleteExperience(userId, experienceId) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    const experienceIndex = profile.experiences.findIndex((experience) => experience._id.toString() === experienceId)
    if (experienceIndex === -1) throw new Error("Expérience non trouvée")

    profile.experiences.splice(experienceIndex, 1)
    await profile.save()
    return { message: "Expérience supprimée avec succès" }
  }

  async updateJobTitle(userId, jobTitle) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    profile.jobTitle = jobTitle
    await profile.save()
    return { jobTitle: profile.jobTitle }
  }

  async updateLocation(userId, location) {
    const { user } = await this.getUserAndPerson(userId)
    const profile = await this.getOrCreateProfile(userId)

    profile.location = location
    await profile.save()
    return { location: profile.location }
  }

  async getUserJobs(userId) {
    const { user } = await this.getUserAndPerson(userId)
    const recommendations = await Recommendation.find({ user: userId, status: "Accepted" }).populate("job")
    return recommendations.map((rec) => rec.job)
  }

  async getUserRecommendations(userId) {
    const { user } = await this.getUserAndPerson(userId)
    return await Recommendation.find({ user: userId }).populate("job")
  }

  async requestAccountStatusChange(userId, requestType, reason) {
    const { user, person } = await this.getUserAndPerson(userId)

    if (!requestType || requestType !== "deactivate")
      throw new Error("Seules les demandes de désactivation sont prises en charge")

    if (!person.accountStatusRequests) person.accountStatusRequests = []

    const hasPendingRequest = person.accountStatusRequests.some((request) => request.status === "pending")
    if (hasPendingRequest) throw new Error("Vous avez déjà une demande de changement de statut en attente")

    const newRequest = {
      requestType,
      reason,
      status: "pending",
      createdAt: new Date(),
    }

    person.accountStatusRequests.push(newRequest)
    await person.save()

    const accountStatusRequest = new AccountStatusRequest({
      user: userId,
      requestType,
      reason,
      status: "pending",
    })

    await accountStatusRequest.save()

    return {
      message: `Votre demande de désactivation de compte a été soumise et est en attente d'approbation par un administrateur`,
      request: newRequest,
    }
  }

  async getUserAccountStatusRequests(userId) {
    const { user, person } = await this.getUserAndPerson(userId)

    if (!person.accountStatusRequests || person.accountStatusRequests.length === 0) {
      return []
    }

    return person.accountStatusRequests
  }

  // Méthode pour la photo de profil
  async updateProfilePicture(userId, pictureData) {
    const { user, person } = await this.getUserAndPerson(userId)

    // Mettre à jour les données de la photo de profil
    person.profilePicture = {
      url: pictureData.url,
      publicId: pictureData.publicId,
    }

    await person.save()

    return {
      profilePicture: person.profilePicture,
    }
  }
}

module.exports = new UserService()

