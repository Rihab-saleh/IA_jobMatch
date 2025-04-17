const User = require("../models/user_model");
const Person = require("../models/person_model");
const Profile = require("../models/profile_model");
const Recommendation = require("../models/recommendation_model");
const AccountStatusRequest = require("../models/accountstatus_request");
const Certification = require('../models/certification_model');
const Language = require('../models/language_model');

class UserService {
  async getOrCreateProfile(userId) {
    let profile = await Profile.findOne({ userId: userId });

    if (!profile) {
      profile = new Profile({
        userId: userId,
        experiences: [],
        formations: [],
        skills: [],
        location: "Non spécifié",
        jobTitle: "Non spécifié",
        bio: "",
        certifications: []
      });
      await profile.save();
    }

    return profile;
  }
  async userExists(userId) {
    try {
      const count = await User.countDocuments({ _id: userId });
      return count > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }
  
  async getUserAndPerson(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error("Utilisateur non trouvé");

    const person = await Person.findById(user.person).select("-password");
    if (!person) throw new Error("Données personnelles non trouvées");

    return { user, person };
  }

  async updateProfileFields(profile, profileData) {
    const fields = ["location", "jobTitle", "experiences", "formations", "skills", "bio"];
    fields.forEach((field) => {
      if (profileData[field] !== undefined) profile[field] = profileData[field];
    });
    await profile.save();
    return profile;
  }

  async getUserProfile(userId) {
    const { user, person } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

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
    };
  }

  async updateUserProfile(userId, profileData) {
    const { user, person } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);
  
    // Update person data (including phone number)
    if (profileData.firstName) person.firstName = profileData.firstName;
    if (profileData.lastName) person.lastName = profileData.lastName;
    if (profileData.email) person.email = profileData.email;
    if (profileData.phoneNumber !== undefined) {
      person.phoneNumber = profileData.phoneNumber;
    }
  
    await person.save();
  
    // Update profile data
    const profileUpdates = {};
    if (profileData.location !== undefined) profileUpdates.location = profileData.location;
    if (profileData.jobTitle !== undefined) profileUpdates.jobTitle = profileData.jobTitle;
    if (profileData.bio !== undefined) profileUpdates.bio = profileData.bio;
  
    if (Object.keys(profileUpdates).length > 0) {
      await Profile.updateOne({ userId: userId }, { $set: profileUpdates });
    }
  
    return this.getUserProfile(userId);
  }
  async deleteUserProfile(userId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await Profile.findOne({ userId: userId });

    if (!profile) return { message: "Profil non trouvé, rien à supprimer" };

    await Profile.findByIdAndDelete(profile._id);
    return { message: "Profil supprimé avec succès" };
  }

  // Skills Methods
  async getUserSkills(userId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);
    return profile.skills;
  }

  async addUserSkill(userId, skillData) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    if (!skillData.name) throw new Error("Le nom de la compétence est requis");

    const newSkill = {
      name: skillData.name,
      level: skillData.level || "Débutant",
    };

    profile.skills.push(newSkill);
    await profile.save();
    return newSkill;
  }

  async updateUserSkill(userId, skillId, skillData) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const skillIndex = profile.skills.findIndex((skill) => skill._id.toString() === skillId);
    if (skillIndex === -1) throw new Error("Compétence non trouvée");

    Object.keys(skillData).forEach((key) => {
      profile.skills[skillIndex][key] = skillData[key];
    });

    await profile.save();
    return profile.skills[skillIndex];
  }

  async removeUserSkill(userId, skillId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const skillExists = profile.skills.some((skill) => skill._id.toString() === skillId);
    if (!skillExists) throw new Error("Compétence non trouvée");

    profile.skills = profile.skills.filter((skill) => skill._id.toString() !== skillId);
    await profile.save();
    return { message: "Compétence supprimée avec succès" };
  }

  // Formations Methods
  async getFormations(userId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);
    return profile.formations;
  }

  async addFormation(userId, formationData) {
    try {
      if (!userId || !formationData?.school || !formationData?.degree) {
        throw new Error("Missing required fields: userId, school, or degree");
      }
  
      // Ensure school and degree are strings before normalizing
      const school = String(formationData.school).trim().toLowerCase();
      const degree = String(formationData.degree).trim().toLowerCase();
  
      // Get or create profile
      const profile = await this.getOrCreateProfile(userId);
  
      // Check for existing formation
      const existingFormation = profile.formations.some(
        (formation) =>
          String(formation.school).trim().toLowerCase() === school &&
          String(formation.degree).trim().toLowerCase() === degree
      );
  
      if (existingFormation) {
        throw new Error("Formation with the same school and degree already exists");
      }
  
      // Add new formation
      profile.formations.push({
        ...formationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
      await profile.save();
  
      // Return the newly added formation
      return profile.formations[profile.formations.length - 1];
    } catch (error) {
      console.error("Error in userService.addFormation:", error);
      throw new Error(`Failed to add formation: ${error.message}`);
    }
  }
  async updateFormation(userId, formationId, formationData) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const formationIndex = profile.formations.findIndex((formation) => formation._id.toString() === formationId);
    if (formationIndex === -1) throw new Error("Formation non trouvée");

    Object.keys(formationData).forEach((key) => {
      profile.formations[formationIndex][key] = formationData[key];
    });

    await profile.save();
    return profile.formations[formationIndex];
  }

  async deleteFormation(userId, formationId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const formationIndex = profile.formations.findIndex((formation) => formation._id.toString() === formationId);
    if (formationIndex === -1) throw new Error("Formation non trouvée");

    profile.formations.splice(formationIndex, 1);
    await profile.save();
    return { message: "Formation supprimée avec succès" };
  }

  // Experiences Methods
  async getExperiences(userId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);
    return profile.experiences;
  }

  async addExperience(userId, experienceData) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    profile.experiences.push(experienceData);
    await profile.save();
    return profile.experiences[profile.experiences.length - 1];
  }

  async updateExperience(userId, experienceId, experienceData) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const experienceIndex = profile.experiences.findIndex((experience) => experience._id.toString() === experienceId);
    if (experienceIndex === -1) throw new Error("Expérience non trouvée");

    Object.keys(experienceData).forEach((key) => {
      profile.experiences[experienceIndex][key] = experienceData[key];
    });

    await profile.save();
    return profile.experiences[experienceIndex];
  }

  async deleteExperience(userId, experienceId) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    const experienceIndex = profile.experiences.findIndex((experience) => experience._id.toString() === experienceId);
    if (experienceIndex === -1) throw new Error("Expérience non trouvée");

    profile.experiences.splice(experienceIndex, 1);
    await profile.save();
    return { message: "Expérience supprimée avec succès" };
  }

  // Profile Info Methods
  async updateJobTitle(userId, jobTitle) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    profile.jobTitle = jobTitle;
    await profile.save();
    return { jobTitle: profile.jobTitle };
  }

  async updateLocation(userId, location) {
    const { user } = await this.getUserAndPerson(userId);
    const profile = await this.getOrCreateProfile(userId);

    profile.location = location;
    await profile.save();
    return { location: profile.location };
  }

  async updatePhoneNumber(userId, phoneNumber) {
    const { person } = await this.getUserAndPerson(userId);
    
    person.phoneNumber = phoneNumber;
    await person.save();
    
    return { 
      phoneNumber: person.phoneNumber,
      message: "Phone number updated successfully" 
    };
  }

  // Jobs and Recommendations Methods
  async getUserJobs(userId) {
    const { user } = await this.getUserAndPerson(userId);
    const recommendations = await Recommendation.find({ user: userId, status: "Accepted" }).populate("job");
    return recommendations.map((rec) => rec.job);
  }

  async getUserRecommendations(userId) {
    const { user } = await this.getUserAndPerson(userId);
    return await Recommendation.find({ user: userId }).populate("job");
  }

  async requestAccountStatusChange(userId, requestType, reason) {
    // Validation des paramètres
    const validTypes = ['activate', 'deactivate'];
    if (!validTypes.includes(requestType)) {
      throw new Error(`Type de demande invalide. Options valides: ${validTypes.join(', ')}`);
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error("La raison doit contenir au moins 10 caractères");
    }

    // Récupération des entités
    const { user, person } = await this.getUserAndPerson(userId);
    if (!user || !person) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérification de l'état actuel
    if (requestType === 'activate' && person.isActive) {
      throw new Error("Le compte est déjà actif");
    }

    if (requestType === 'deactivate' && !person.isActive) {
      throw new Error("Le compte est déjà désactivé");
    }

    // Vérification des demandes existantes
    const hasPendingRequest = person.accountStatusRequests?.some(
      req => req.status === 'pending' && req.requestType === requestType
    );

    if (hasPendingRequest) {
      throw new Error("Une demande similaire est déjà en attente");
    }

    // Création de la demande
    const newRequest = {
      requestType,
      reason,
      status: 'pending',
      createdAt: new Date()
    };

    // Mise à jour de l'utilisateur
    person.accountStatusRequests.push(newRequest);
    await person.save();

    // Création dans la collection dédiée
    const statusRequest = new AccountStatusRequest({
      user: userId,
      ...newRequest,
      previousStatus: person.isActive ? 'active' : 'inactive'
    });

    await statusRequest.save();

    return {
      success: true,
      message: "Demande enregistrée avec succès",
      request: statusRequest.toObject()
    };
}


  async getUserAccountStatusRequests(userId) {
    const { user, person } = await this.getUserAndPerson(userId);

    if (!person.accountStatusRequests || person.accountStatusRequests.length === 0) {
      return [];
    }

    return person.accountStatusRequests;
  }

  // Profile Picture Methods
  async updateProfilePicture(userId, pictureData) {
    const { user, person } = await this.getUserAndPerson(userId);

    person.profilePicture = {
      url: pictureData.url,
      publicId: pictureData.publicId,
    };

    await person.save();

    return {
      profilePicture: person.profilePicture,
    };
  }
  async getProfilePicture(userId) {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(`${apiBaseUrl}/users/${userId}/profile-picture`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.profilePicture;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      throw error;
    }
  }
  // Certifications Methods
  async getCertifications(userId) {
    const profile = await Profile.findOne({ userId })
      .populate('certifications')
      .exec();
    return profile ? profile.certifications : [];
  }
  
  async addCertification(userId, certificationData) {
    if (!certificationData.name || !certificationData.issuer || !certificationData.issueDate) {
      throw new Error("Name, issuer, and issue date are required");
    }
  
    const certification = new Certification({
      user: userId,
      ...certificationData
    });
  
    await certification.save();
  
    const profile = await this.getOrCreateProfile(userId);
    profile.certifications.push(certification._id);
    await profile.save();
  
    return certification;
  }
  
  async updateCertification(userId, certificationId, certificationData) {
    const certification = await Certification.findOneAndUpdate(
      { _id: certificationId, user: userId },
      certificationData,
      { new: true }
    );
  
    if (!certification) {
      throw new Error("Certification not found or you don't have permission");
    }
  
    return certification;
  }
  
  async deleteCertification(userId, certificationId) {
    const certification = await Certification.findOneAndDelete({
      _id: certificationId,
      user: userId
    });
  
    if (!certification) {
      throw new Error("Certification not found or you don't have permission");
    }
  
    const profile = await Profile.findOne({ userId });
    if (profile) {
      profile.certifications = profile.certifications.filter(
        certId => certId.toString() !== certificationId
      );
      await profile.save();
    }
  
    return { message: "Certification deleted successfully" };
  }

  // Languages Methods
  async getLanguages(userId) {
    return await Language.find({ user: userId }).sort({ createdAt: -1 });
  }

  async addLanguage(userId, languageData) {
    const language = new Language({
      user: userId,
      ...languageData
    });

    await language.save();
    return language;
  }

  async updateLanguage(userId, languageId, languageData) {
    const language = await Language.findOneAndUpdate(
      { _id: languageId, user: userId },
      languageData,
      { new: true }
    );

    if (!language) {
      throw new Error("Language not found or you don't have permission");
    }

    return language;
  }

  async deleteLanguage(userId, languageId) {
    const language = await Language.findOneAndDelete({
      _id: languageId,
      user: userId
    });

    if (!language) {
      throw new Error("Language not found or you don't have permission");
    }

    return { message: "Language deleted successfully" };
  }
}

module.exports = new UserService();