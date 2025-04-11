const userService = require("../services/userService");
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose'); 
const Language = require('../models/language_model');
const User = require('../models/user_model');
// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const handleError = (res, error) => {
  console.error(error);
  if (
    error.message === "User not found" ||
    error.message === "Profile not found" ||
    error.message === "Formation not found" ||
    error.message === "Experience not found"
  ) {
    return res.status(404).json({ message: error.message });
  }
  res.status(500).json({ message: "An error occurred", error: error.message });
};

const canModifyUser = (req, targetUserId) => {
  const authUserId = req.user._id.toString();
  const targetId = targetUserId.toString();
  return authUserId === targetId || req.user.role === "admin";
};

const validateUserId = (userId, res) => {
  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return false;
  }
  return true;
};

const validatePermission = (req, targetUserId, res) => {
  if (!canModifyUser(req, targetUserId)) {
    res.status(403).json({ message: "You can only modify your own profile" });
    return false;
  }
  return true;
};

const processRequest = async (res, callback) => {
  try {
    await callback();
  } catch (error) {
    handleError(res, error);
  }
};

const handlePostRequest = async (res, checkExistenceCallback, createCallback, resourceName) => {
  const exists = await checkExistenceCallback();
  if (exists) {
    return res.status(409).json({ message: `${resourceName} already exists` });
  }
  const result = await createCallback();
  res.status(201).json(result);
};

// Profile Methods
const getUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const profileData = await userService.getUserProfile(userId);
    res.status(200).json(profileData);
  });
};

const updateUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const updatedProfile = await userService.updateUserProfile(targetUserId, {
      ...req.body,
      phoneNumber: req.body.phone, // Make sure phone is mapped to phoneNumber
      location: req.body.location,
      jobTitle: req.body.jobTitle,
      bio: req.body.bio
    });
    
    res.status(200).json(updatedProfile);
  });
};

const deleteUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const result = await userService.deleteUserProfile(targetUserId);
    res.status(200).json(result);
  });
};

// Skills Methods
const getUserSkills = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const userSkills = await userService.getUserSkills(userId);
    res.status(200).json(userSkills);
  });
};

const addUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    await handlePostRequest(
      res,
      async () => {
        const skills = await userService.getUserSkills(targetUserId);
        return skills.some((skill) => skill.name === req.body.name);
      },
      async () => await userService.addUserSkill(targetUserId, req.body),
      "Skill"
    );
  });
};

const updateUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const skillId = req.params.skillId;
    if (!skillId) {
      return res.status(400).json({ message: "Skill ID is required" });
    }

    const skill = await userService.updateUserSkill(targetUserId, skillId, req.body);
    res.status(200).json(skill);
  });
};

const removeUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const skillId = req.params.skillId;
    if (!skillId) {
      return res.status(400).json({ message: "Skill ID is required" });
    }

    const result = await userService.removeUserSkill(targetUserId, skillId);
    res.status(200).json(result);
  });
};

// Formations Methods
const getFormations = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const formations = await userService.getFormations(userId);
    res.status(200).json(formations);
  });
};

const addFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;
    
// Validate that req.body.school and req.body.degree are defined
if (!req.body.school || !req.body.degree) {
  throw new Error("School and degree are required fields");
}
    await handlePostRequest(
      res,
      async () => {
        const formations = await userService.getFormations(targetUserId);
        return formations.some(
          formation => 
            formation.school.toLowerCase() === req.body.school.toLowerCase() &&
            formation.degree.toLowerCase() === req.body.degree.toLowerCase()
        );
      },
      async () => await userService.addFormation(targetUserId, req.body),
      "Formation"
    );
  });
};


const updateFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const formationId = req.params.formationId;
    if (!formationId) {
      return res.status(400).json({ message: "Formation ID is required" });
    }

    const formation = await userService.updateFormation(targetUserId, formationId, req.body);
    res.status(200).json(formation);
  });
};

const deleteFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const formationId = req.params.formationId;
    if (!formationId) {
      return res.status(400).json({ message: "Formation ID is required" });
    }

    const result = await userService.deleteFormation(targetUserId, formationId);
    res.status(200).json(result);
  });
};

// Experiences Methods
const getExperiences = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const experiences = await userService.getExperiences(userId);
    res.status(200).json(experiences);
  });
};

const addExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    await handlePostRequest(
      res,
      async () => {
        const experiences = await userService.getExperiences(targetUserId);
        return experiences.some(
          (experience) => experience.title === req.body.title && experience.company === req.body.company
        );
      },
      async () => await userService.addExperience(targetUserId, req.body),
      "Experience"
    );
  });
};

const updateExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const experienceId = req.params.experienceId;
    if (!experienceId) {
      return res.status(400).json({ message: "Experience ID is required" });
    }

    const experience = await userService.updateExperience(targetUserId, experienceId, req.body);
    res.status(200).json(experience);
  });
};

const deleteExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const experienceId = req.params.experienceId;
    if (!experienceId) {
      return res.status(400).json({ message: "Experience ID is required" });
    }

    const result = await userService.deleteExperience(targetUserId, experienceId);
    res.status(200).json(result);
  });
};

// Profile Info Methods
const updateJobTitle = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    if (!req.body.jobTitle) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const result = await userService.updateJobTitle(targetUserId, req.body.jobTitle);
    res.status(200).json(result);
  });
};

const updateLocation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    if (!req.body.location) {
      return res.status(400).json({ message: "Location is required" });
    }

    const result = await userService.updateLocation(targetUserId, req.body.location);
    res.status(200).json(result);
  });
};

const updatePhoneNumber = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    if (!req.body.phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const result = await userService.updatePhoneNumber(targetUserId, req.body.phoneNumber);
    res.status(200).json(result);
  });
};

// Jobs and Recommendations Methods
const getUserJobs = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const jobs = await userService.getUserJobs(userId);
    res.status(200).json(jobs);
  });
};

const getUserRecommendations = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const recommendations = await userService.getUserRecommendations(userId);
    res.status(200).json(recommendations);
  });
};

const requestAccountStatusChange = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.user._id;
    const { requestType, reason } = req.body;

    if (!requestType || requestType !== "deactivate") {
      return res.status(400).json({ message: "Only deactivate requests are supported" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const existingRequests = await userService.getUserAccountStatusRequests(userId);
    const hasPendingRequest = existingRequests.some((request) => request.status === "pending");

    if (hasPendingRequest) {
      return res.status(409).json({ message: "You already have a pending account status change request" });
    }

    const result = await userService.requestAccountStatusChange(userId, requestType, reason);
    res.status(201).json(result);
  });
};

// Profile Picture Methods
const uploadProfilePicture = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, JPG and GIF are allowed." });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB." });
    }

    try {
      const fileExtension = req.file.originalname.split('.').pop();
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const filename = `${targetUserId}-${uniqueId}.${fileExtension}`;
      const filepath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filepath, req.file.buffer);
      
      const fileUrl = `/uploads/profiles/${filename}`;
      
      const result = await userService.updateProfilePicture(targetUserId, {
        url: fileUrl,
        publicId: filename,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error saving file:", error);
      res.status(500).json({ message: "Failed to upload image", error: error.message });
    }
  });
};
const getProfilePicture = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch the user and their associated person data
    const user = await User.findById(userId).populate("person");
    if (!user || !user.person || !user.person.profilePicture) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    // Return the profile picture
    res.status(200).json({ profilePicture: user.person.profilePicture });
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    res.status(500).json({ error: "Failed to fetch profile picture" });
  }
};
const deleteProfilePicture = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const { person } = await userService.getUserAndPerson(targetUserId);

    if (!person.profilePicture || !person.profilePicture.publicId) {
      return res.status(404).json({ message: "No profile picture found" });
    }

    try {
      const filepath = path.join(uploadDir, person.profilePicture.publicId);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      const result = await userService.updateProfilePicture(targetUserId, {
        url: null,
        publicId: null,
      });

      res.status(200).json({ message: "Profile picture deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete image", error: error.message });
    }
  });
};

// Certifications Methods
const getCertifications = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const certifications = await userService.getCertifications(userId);
    res.status(200).json(certifications);
  });
};

const addCertification = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const certificationData = {
      ...req.body,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
      expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null
    };

    const certification = await userService.addCertification(targetUserId, certificationData);
    res.status(201).json(certification);
  });
};

const updateCertification = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const certificationId = req.params.certificationId;
    if (!certificationId) {
      return res.status(400).json({ message: "Certification ID is required" });
    }

    const certificationData = {
      ...req.body,
      issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
      expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
    };

    const certification = await userService.updateCertification(
      targetUserId, 
      certificationId, 
      certificationData
    );
    res.status(200).json(certification);
  });
};

const deleteCertification = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const certificationId = req.params.certificationId;
    if (!certificationId) {
      return res.status(400).json({ message: "Certification ID is required" });
    }

    const result = await userService.deleteCertification(targetUserId, certificationId);
    res.status(200).json(result);
  });
};

// Languages Methods
const getLanguages = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId;
    if (!validateUserId(userId, res)) return;
    const languages = await userService.getLanguages(userId);
    res.status(200).json(languages);
  });
};

const addLanguage = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const language = await userService.addLanguage(targetUserId, req.body);
    res.status(201).json(language);
  });
};

const updateLanguage = async (req, res) => {
  try {
    const { userId, languageId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(languageId)) {
      return res.status(400).json({ message: "Invalid language ID format" });
    }

    const updated = await Language.findOneAndUpdate(
      { _id: languageId, user: userId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Language not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating language",
      error: error.message 
    });
  }
};

const deleteLanguage = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId;
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return;

    const languageId = req.params.languageId;
    if (!languageId) {
      return res.status(400).json({ message: "Language ID is required" });
    }

    const result = await userService.deleteLanguage(targetUserId, languageId);
    res.status(200).json(result);
  });
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  removeUserSkill,
  getFormations,
  addFormation,
  updateFormation,
  deleteFormation,
  getExperiences,
  addExperience,
  updateExperience,
  deleteExperience,
  updateJobTitle,
  updateLocation,
  updatePhoneNumber,
  getUserJobs,
  getUserRecommendations,
  requestAccountStatusChange,
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
  getCertifications,
  addCertification,
  updateCertification,
  deleteCertification,
  getLanguages,
  addLanguage,
  updateLanguage,
  deleteLanguage
};