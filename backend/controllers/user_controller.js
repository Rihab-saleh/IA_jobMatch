const userService = require("../services/userService")
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Create upload directory if it doesn't exist
const uploadDir = path.join(__dirname, '../public/uploads/profiles')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const handleError = (res, error) => {
  console.error(error)
  if (
    error.message === "User not found" ||
    error.message === "Profile not found" ||
    error.message === "Formation not found" ||
    error.message === "Experience not found"
  ) {
    return res.status(404).json({ message: error.message })
  }
  res.status(500).json({ message: "An error occurred", error: error.message })
}

const canModifyUser = (req, targetUserId) => {
  const authUserId = req.user._id.toString()
  const targetId = targetUserId.toString()
  return authUserId === targetId || req.user.role === "admin"
}

const validateUserId = (userId, res) => {
  if (!userId) {
    res.status(400).json({ message: "User ID is required" })
    return false
  }
  return true
}

const validatePermission = (req, targetUserId, res) => {
  if (!canModifyUser(req, targetUserId)) {
    res.status(403).json({ message: "You can only modify your own profile" })
    return false
  }
  return true
}

const processRequest = async (res, callback) => {
  try {
    await callback()
  } catch (error) {
    handleError(res, error)
  }
}

const handlePostRequest = async (res, checkExistenceCallback, createCallback, resourceName) => {
  const exists = await checkExistenceCallback()
  if (exists) {
    return res.status(409).json({ message: `${resourceName} already exists` })
  }
  const result = await createCallback()
  res.status(201).json(result)
}

const addUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    await handlePostRequest(
      res,
      async () => {
        const skills = await userService.getUserSkills(targetUserId)
        return skills.some((skill) => skill.name === req.body.name)
      },
      async () => await userService.addUserSkill(targetUserId, req.body),
      "Skill",
    )
  })
}

const addFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    await handlePostRequest(
      res,
      async () => {
        const formations = await userService.getFormations(targetUserId)
        return formations.some((formation) => formation.title === req.body.title)
      },
      async () => await userService.addFormation(targetUserId, req.body),
      "Formation",
    )
  })
}

const addExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    await handlePostRequest(
      res,
      async () => {
        const experiences = await userService.getExperiences(targetUserId)
        return experiences.some(
          (experience) => experience.title === req.body.title && experience.company === req.body.company,
        )
      },
      async () => await userService.addExperience(targetUserId, req.body),
      "Experience",
    )
  })
}

const getUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const profileData = await userService.getUserProfile(userId)
    res.status(200).json(profileData)
  })
}

const updateUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const updatedProfile = await userService.updateUserProfile(targetUserId, req.body)
    res.status(200).json(updatedProfile)
  })
}

const deleteUserProfile = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const result = await userService.deleteUserProfile(targetUserId)
    res.status(200).json(result)
  })
}

const getUserSkills = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const userSkills = await userService.getUserSkills(userId)
    res.status(200).json(userSkills)
  })
}

const updateUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const skillId = req.params.skillId
    if (!skillId) {
      return res.status(400).json({ message: "Skill ID is required" })
    }

    const skill = await userService.updateUserSkill(targetUserId, skillId, req.body)
    res.status(200).json(skill)
  })
}

const removeUserSkill = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const skillId = req.params.skillId
    if (!skillId) {
      return res.status(400).json({ message: "Skill ID is required" })
    }

    const result = await userService.removeUserSkill(targetUserId, skillId)
    res.status(200).json(result)
  })
}

const getFormations = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const formations = await userService.getFormations(userId)
    res.status(200).json(formations)
  })
}

const updateFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const formationId = req.params.formationId
    if (!formationId) {
      return res.status(400).json({ message: "Formation ID is required" })
    }

    const formation = await userService.updateFormation(targetUserId, formationId, req.body)
    res.status(200).json(formation)
  })
}

const deleteFormation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const formationId = req.params.formationId
    if (!formationId) {
      return res.status(400).json({ message: "Formation ID is required" })
    }

    const result = await userService.deleteFormation(targetUserId, formationId)
    res.status(200).json(result)
  })
}

const getExperiences = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const experiences = await userService.getExperiences(userId)
    res.status(200).json(experiences)
  })
}

const updateExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const experienceId = req.params.experienceId
    if (!experienceId) {
      return res.status(400).json({ message: "Experience ID is required" })
    }

    const experience = await userService.updateExperience(targetUserId, experienceId, req.body)
    res.status(200).json(experience)
  })
}

const deleteExperience = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    const experienceId = req.params.experienceId
    if (!experienceId) {
      return res.status(400).json({ message: "Experience ID is required" })
    }

    const result = await userService.deleteExperience(targetUserId, experienceId)
    res.status(200).json(result)
  })
}

const updateJobTitle = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    if (!req.body.jobTitle) {
      return res.status(400).json({ message: "Job title is required" })
    }

    const result = await userService.updateJobTitle(targetUserId, req.body.jobTitle)
    res.status(200).json(result)
  })
}

const updateLocation = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    if (!req.body.location) {
      return res.status(400).json({ message: "Location is required" })
    }

    const result = await userService.updateLocation(targetUserId, req.body.location)
    res.status(200).json(result)
  })
}

const getUserJobs = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const jobs = await userService.getUserJobs(userId)
    res.status(200).json(jobs)
  })
}

const getUserRecommendations = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.params.userId
    if (!validateUserId(userId, res)) return
    const recommendations = await userService.getUserRecommendations(userId)
    res.status(200).json(recommendations)
  })
}

const requestAccountStatusChange = async (req, res) => {
  processRequest(res, async () => {
    const userId = req.user._id

    const { requestType, reason } = req.body

    // Only allow deactivate requests
    if (!requestType || requestType !== "deactivate") {
      return res.status(400).json({ message: "Only deactivate requests are supported" })
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" })
    }

    const existingRequests = await userService.getUserAccountStatusRequests(userId)
    const hasPendingRequest = existingRequests.some((request) => request.status === "pending")

    if (hasPendingRequest) {
      return res.status(409).json({ message: "You already have a pending account status change request" })
    }

    const result = await userService.requestAccountStatusChange(userId, requestType, reason)
    res.status(201).json(result)
  })
}

// New profile picture methods using local file storage
const uploadProfilePicture = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" })
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"]
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type. Only JPEG, PNG, JPG and GIF are allowed." })
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ message: "File too large. Maximum size is 5MB." })
    }

    try {
      // Generate unique filename
      const fileExtension = req.file.originalname.split('.').pop()
      const uniqueId = crypto.randomBytes(16).toString('hex')
      const filename = `${targetUserId}-${uniqueId}.${fileExtension}`
      const filepath = path.join(uploadDir, filename)
      
      // Save file to disk
      fs.writeFileSync(filepath, req.file.buffer)
      
      // Create public URL (adjust based on your server setup)
      const fileUrl = `/uploads/profiles/${filename}`
      
      // Save profile picture info to user
      const result = await userService.updateProfilePicture(targetUserId, {
        url: fileUrl,
        publicId: filename, // Store filename as publicId for later deletion
      })

      res.status(200).json(result)
    } catch (error) {
      console.error("Error saving file:", error)
      res.status(500).json({ message: "Failed to upload image", error: error.message })
    }
  })
}

const deleteProfilePicture = async (req, res) => {
  processRequest(res, async () => {
    const targetUserId = req.params.userId
    if (!validateUserId(targetUserId, res) || !validatePermission(req, targetUserId, res)) return

    // Get current profile picture
    const { person } = await userService.getUserAndPerson(targetUserId)

    if (!person.profilePicture || !person.profilePicture.publicId) {
      return res.status(404).json({ message: "No profile picture found" })
    }

    try {
      // Delete file from disk
      const filepath = path.join(uploadDir, person.profilePicture.publicId)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }

      // Remove profile picture info from user
      const result = await userService.updateProfilePicture(targetUserId, {
        url: null,
        publicId: null,
      })

      res.status(200).json({ message: "Profile picture deleted successfully" })
    } catch (error) {
      console.error("Error deleting file:", error)
      res.status(500).json({ message: "Failed to delete image", error: error.message })
    }
  })
}

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
  getUserJobs,
  getUserRecommendations,
  requestAccountStatusChange,
  uploadProfilePicture,
  deleteProfilePicture,
}