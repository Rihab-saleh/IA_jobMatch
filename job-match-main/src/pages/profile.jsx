

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import {
  PlusCircle,
  X,
  MapPin,
  Briefcase,
  Trash2,
  Camera,
  User,
  Loader2,
  Calendar,
  GraduationCap,
  Award,
  Edit,
  Save,
  Mail,
  Phone,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { userService } from "../services/user-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"

function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Ajout de la constante pour l'URL de base de l'API
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"

  const [state, setState] = useState({
    loading: true,
    saving: false,
    skills: [],
    newSkill: "",
    editingSkill: null,
    skillLevel: "Intermediate",
    profileData: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      jobTitle: "",
      bio: "",
    },
    savedProfileData: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      jobTitle: "",
      bio: "",
    },
    profilePicture: null,
    isUploading: false,
    showDeleteDialog: false,
    error: null,
    experiences: [],
    formations: [],
    certifications: [],
    languages: [],
    activeDialog: null,
    currentItem: null,
    dateErrors: {
      experience: {
        startDate: "",
        endDate: "",
      },
      education: {
        startDate: "",
        endDate: "",
      },
      certification: {
        issueDate: "",
        expirationDate: "",
      },
    },
    showSaveNotification: false,
  })

  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [activeTab, setActiveTab] = useState("personal")

  const validatePhoneNumber = (phoneNumber) => {
    // Skip validation if empty
    if (!phoneNumber) return true

    // Remove any non-digit characters (spaces, dashes, parentheses, etc.)
    const digitsOnly = phoneNumber.replace(/\D/g, "")

    // Check if the phone number has at least 8 digits
    return /^[0-9]{8,}$/.test(digitsOnly)
  }

  const calculateProfileCompletion = () => {
    let total = 0
    let maxTotal = 0

    // Personal Info (25%)
    maxTotal += 25
    let personalInfoScore = 0
    if (state.savedProfileData.firstName) personalInfoScore += 4
    if (state.savedProfileData.lastName) personalInfoScore += 4
    if (state.savedProfileData.email) personalInfoScore += 4
    if (state.savedProfileData.phone) personalInfoScore += 3
    if (state.savedProfileData.location) personalInfoScore += 3
    if (state.savedProfileData.jobTitle) personalInfoScore += 3
    if (state.savedProfileData.bio) personalInfoScore += 3
    if (state.profilePicture) personalInfoScore += 1
    total += personalInfoScore

    // Skills (20%)
    maxTotal += 20
    if (state.skills.length >= 3) {
      total += 20
    } else {
      total += (state.skills.length / 3) * 20
    }

    // Experience (20%)
    maxTotal += 20
    if (state.experiences.length > 0) total += 20

    // Education (15%)
    maxTotal += 15
    if (state.formations.length > 0) total += 15

    // Certifications (10%)
    maxTotal += 10
    if (state.certifications.length > 0) total += 10

    // Languages (10%)
    maxTotal += 10
    if (state.languages.length > 0) total += 10

    return Math.min(Math.round((total / maxTotal) * 100), 100)
  }

  useEffect(() => {
    const percentage = calculateProfileCompletion()
    setCompletionPercentage(percentage)
  }, [
    state.savedProfileData,
    state.profilePicture,
    state.skills,
    state.experiences,
    state.formations,
    state.certifications,
    state.languages,
  ])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }

    if (user) {
      loadProfileData()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (state.savedProfileData && state.savedProfileData.profilePicture) {
      console.log("Profile Picture URL:", state.savedProfileData.profilePicture.url)
    }
  }, [state.savedProfileData])

  // Helper function to format profile picture URL
  const formatProfilePictureUrl = (url) => {
    if (!url) return null

    // If it's already an absolute URL, return it as is
    if (url.startsWith("http")) return url

    console.log("Processing URL:", url)

    // Case 1: URL contains the pattern "/api/users/profile/:userId/picture/uploads/profiles/"
    const uploadPathMatch = url.match(/\/api\/users\/profile\/.*?\/picture(\/uploads\/profiles\/.+)$/)
    if (uploadPathMatch) {
      const formattedUrl = `${apiBaseUrl}${uploadPathMatch[1]}`
      console.log("Case 1 match. Formatted URL:", formattedUrl)
      return url
    }

    // Case 2: URL directly contains "/uploads/profiles/"
    if (url.includes("/uploads/profiles/")) {
      const profilesIndex = url.indexOf("/uploads/profiles/")
      if (profilesIndex !== -1) {
        const relativePath = url.substring(profilesIndex)
        const formattedUrl = `${apiBaseUrl}${relativePath}`
        console.log("Case 2 match. Formatted URL:", formattedUrl)
        return formattedUrl
      }
    }

    // Case 3: URL is just a filename that should go in /uploads/profiles/
    if (!url.includes("/") && /\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
      const formattedUrl = `${apiBaseUrl}/uploads/profiles/${url}`
      console.log("Case 3 match. Formatted URL:", formattedUrl)
      return formattedUrl
    }

    // Case 4: URL starts with /api/
    if (url.startsWith("/api/")) {
      const formattedUrl = `${apiBaseUrl}${url.substring(4)}`
      console.log("Case 4 match. Formatted URL:", formattedUrl)
      return formattedUrl
    }

    // Case 5: Default fallback - just append to API base URL
    const formattedUrl = `${apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`
    console.log("Case 5 fallback. Formatted URL:", formattedUrl)
    state.savedProfileData.profilePicture = url
    return formattedUrl
  }

  const loadProfileData = async () => {
    try {
      if (!user || !user._id) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Unauthorized",
        }))
        return
      }

      // First get the profile data which should already include the profile picture
      const profile = await userService.getUserProfile(user._id)

      // Then get the other data
      const [skills, experiences, formations, certifications, languages] = await Promise.all([
        userService.getUserSkills(user._id).catch(() => []),
        userService.getExperiences(user._id).catch(() => []),
        userService.getFormations(user._id).catch(() => []),
        userService.getCertifications(user._id).catch(() => []),
        userService.getLanguages(user._id).catch(() => []),
      ])

      // Get the profile picture URL from the profile data
      const profilePictureUrl = profile.user.person.profilePicture?.url || null

      console.log("Raw Profile Picture URL from profile data:", profilePictureUrl)

      // Format the URL properly
      const formattedProfilePictureUrl = formatProfilePictureUrl(profilePictureUrl)
      console.log("Raw URL:", profilePictureUrl)
      console.log("Formatted URL:", formattedProfilePictureUrl)

      setState((prev) => ({
        ...prev,
        profileData: {
          firstName: profile.user.person.firstName || "",
          lastName: profile.user.person.lastName || "",
          email: profile.user.person.email || "",
          phone: profile.user.person.phoneNumber || "",
          location: profile.profile.location || "",
          jobTitle: profile.profile.jobTitle || "",
          bio: profile.profile.bio || "",
        },
        savedProfileData: {
          firstName: profile.user.person.firstName || "",
          lastName: profile.user.person.lastName || "",
          email: profile.user.person.email || "",
          phone: profile.user.person.phoneNumber || "",
          location: profile.profile.location || "",
          jobTitle: profile.profile.jobTitle || "",
          bio: profile.profile.bio || "",
        },
        profilePicture: formattedProfilePictureUrl,
        skills: Array.isArray(skills) ? skills : [],
        experiences: Array.isArray(experiences) ? experiences : [],
        formations: Array.isArray(formations) ? formations : [],
        certifications: Array.isArray(certifications) ? certifications : [],
        languages: Array.isArray(languages) ? languages : [],
        loading: false,
        error: null,
      }))
    } catch (error) {
      console.error("Profile loading error:", error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }))

      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }
    }
  }

  const validateExperienceDates = (startDate, endDate, isCurrent) => {
    const today = new Date().toISOString().split("T")[0]
    const errors = {
      startDate: "",
      endDate: "",
    }

    if (!startDate) {
      errors.startDate = "Start date is required"
    } else if (startDate > today) {
      errors.startDate = "Start date cannot be in the future"
    }

    if (!isCurrent) {
      if (!endDate) {
        errors.endDate = "End date is required"
      } else if (endDate < startDate) {
        errors.endDate = "End date cannot be before start date"
      } else if (endDate > today) {
        errors.endDate = "End date cannot be in the future"
      }
    }

    setState((prev) => ({
      ...prev,
      dateErrors: {
        ...prev.dateErrors,
        experience: errors,
      },
    }))

    return !errors.startDate && !errors.endDate
  }

  const validateEducationDates = (startDate, endDate, isCurrent) => {
    const today = new Date().toISOString().split("T")[0]
    const errors = {
      startDate: "",
      endDate: "",
    }

    if (!startDate) {
      errors.startDate = "Start date is required"
    } else if (startDate > today) {
      errors.startDate = "Start date cannot be in the future"
    }

    if (!isCurrent) {
      if (!endDate) {
        errors.endDate = "End date is required"
      } else if (endDate < startDate) {
        errors.endDate = "End date cannot be before start date"
      } else if (endDate > today) {
        errors.endDate = "End date cannot be in the future"
      }
    }

    setState((prev) => ({
      ...prev,
      dateErrors: {
        ...prev.dateErrors,
        education: errors,
      },
    }))

    return !errors.startDate && !errors.endDate
  }

  const validateCertificationDates = (issueDate, expirationDate) => {
    const today = new Date().toISOString().split("T")[0]
    const errors = {
      issueDate: "",
      expirationDate: "",
    }

    if (!issueDate) {
      errors.issueDate = "Issue date is required"
    } else if (issueDate > today) {
      errors.issueDate = "Issue date cannot be in the future"
    }

    if (expirationDate) {
      if (expirationDate < issueDate) {
        errors.expirationDate = "Expiration date cannot be before issue date"
      }
    }

    setState((prev) => ({
      ...prev,
      dateErrors: {
        ...prev.dateErrors,
        certification: errors,
      },
    }))

    return !errors.issueDate && !errors.expirationDate
  }

  const handleSkillOperation = async (operation, skill = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      switch (operation) {
        case "add":
          if (state.newSkill.trim() === "") {
            toast.error("Please enter a skill name")
            return
          }

          const existingSkill = state.skills.find((s) => s.name.toLowerCase() === state.newSkill.toLowerCase())
          if (existingSkill) {
            toast.error("This skill already exists in your profile")
            return
          }

          const newSkill = await userService.addUserSkill(user._id, {
            name: state.newSkill,
            level: state.skillLevel,
          })

          setState((prev) => ({
            ...prev,
            skills: [...prev.skills, newSkill],
            newSkill: "",
            skillLevel: "Intermediate",
          }))
          toast.success("Skill added successfully")
          break

        case "edit":
          setState((prev) => ({
            ...prev,
            newSkill: skill.name,
            skillLevel: skill.level || "Intermediate",
            editingSkill: skill._id,
          }))
          break

        case "update":
          const updatedSkill = await userService.updateUserSkill(user._id, state.editingSkill, {
            name: state.newSkill,
            level: state.skillLevel,
          })

          setState((prev) => ({
            ...prev,
            skills: prev.skills.map((s) => (s._id === state.editingSkill ? updatedSkill : s)),
            newSkill: "",
            skillLevel: "Intermediate",
            editingSkill: null,
          }))
          toast.success("Skill updated successfully")
          break

        case "remove":
          await userService.removeUserSkill(user._id, skill._id)
          setState((prev) => ({
            ...prev,
            skills: prev.skills.filter((s) => s._id !== skill._id),
          }))
          toast.success("Skill removed successfully")
          break

        case "cancel":
        default:
          setState((prev) => ({
            ...prev,
            newSkill: "",
            skillLevel: "Intermediate",
            editingSkill: null,
          }))
          break
      }
    } catch (error) {
      console.error("Skill operation error:", error)
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message || "Failed to perform operation"}`)
      }
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setState((prev) => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [name]: value,
      },
    }))
  }

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB")
      return
    }

    setState((prev) => ({ ...prev, isUploading: true }))

    try {
      // Upload the file to the backend
      const response = await userService.uploadProfilePicture(user._id, file)

      // Get the URL from the response and format it properly
      const profilePictureUrl = response.profilePicture?.url || null
      const formattedProfilePictureUrl = formatProfilePictureUrl(profilePictureUrl)

      // Update the state with the formatted URL
      setState((prev) => ({
        ...prev,
        profilePicture: formattedProfilePictureUrl,
        isUploading: false,
      }))

      toast.success("Profile picture updated successfully")
    } catch (error) {
      setState((prev) => ({ ...prev, isUploading: false }))
      toast.error(`Error: ${error.message || "Failed to upload profile picture"}`)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const saveProfile = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    // Validate phone number before saving
    if (state.profileData.phone && !validatePhoneNumber(state.profileData.phone)) {
      toast.error("Phone number must be between 10-15 digits. Please include country code if needed.")
      return
    }

    setState((prev) => ({ ...prev, saving: true }))

    try {
      // Format phone number to remove any non-digit characters
      const formattedPhone = state.profileData.phone ? state.profileData.phone.replace(/\D/g, "") : ""

      // Prepare the profile data to send
      const profileDataToSend = {
        ...state.profileData,
        phoneNumber: formattedPhone,
      }

      await userService.updateUserProfile(user._id, profileDataToSend)

      // Update phone number separately using the dedicated endpoint
      if (formattedPhone !== state.savedProfileData.phone) {
        await userService.updatePhoneNumber(user._id, { phoneNumber: formattedPhone })
      }

      // Update savedProfileData with the current profileData
      setState((prev) => ({
        ...prev,
        savedProfileData: {
          ...prev.profileData,
          phone: formattedPhone,
        },
        profileData: {
          ...prev.profileData,
          phone: formattedPhone,
        },
        saving: false,
      }))

      // Show success toast with custom UI
      toast.custom(
        (t) => (
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Profile Saved</h3>
              <p className="mt-1 text-sm text-gray-500">Your profile has been successfully updated.</p>
              <div className="mt-4 flex">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={() => toast.dismiss(t)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ),
        {
          duration: 5000,
        },
      )
    } catch (error) {
      console.error("Error updating profile:", error)
      setState((prev) => ({ ...prev, saving: false }))

      if (error.response && error.response.data) {
        console.error("Server response:", error.response.data)
        toast.error(`Error: ${error.response.data.error || error.message}`)
      } else if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message || "Failed to update profile"}`)
      }
    }
  }

  const openDialog = (dialogName, item = null) => {
    setState((prev) => ({
      ...prev,
      activeDialog: dialogName,
      currentItem: item,
      dateErrors: {
        experience: {
          startDate: "",
          endDate: "",
        },
        education: {
          startDate: "",
          endDate: "",
        },
        certification: {
          issueDate: "",
          expirationDate: "",
        },
      },
    }))
  }

  const closeDialog = () => {
    setState((prev) => ({
      ...prev,
      activeDialog: null,
      currentItem: null,
    }))
  }

  const handleExperienceSubmit = async (e) => {
    e.preventDefault()
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    const formData = new FormData(e.target)
    const isCurrent = formData.get("current") === "on"
    const startDate = formData.get("startDate")

    // Always require an end date, even for current positions
    let endDate = formData.get("endDate")

    // If current is checked and no end date is provided, use today's date
    if (isCurrent && (!endDate || endDate === "")) {
      endDate = new Date().toISOString().split("T")[0]
    }

    // Validate dates
    if (!validateExperienceDates(startDate, endDate, isCurrent)) {
      return
    }

    const data = {
      company: formData.get("company"),
      jobTitle: formData.get("jobTitle"),
      location: formData.get("location"),
      startDate: startDate,
      endDate: endDate, // Always provide an end date
      description: formData.get("description"),
      current: isCurrent,
    }

    try {
      if (state.currentItem) {
        await userService.updateExperience(user._id, state.currentItem._id, data)
        setState((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) => (exp._id === state.currentItem._id ? { ...exp, ...data } : exp)),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Experience updated successfully")
      } else {
        const response = await userService.addExperience(user._id, data)
        setState((prev) => ({
          ...prev,
          experiences: [...prev.experiences, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Experience added successfully")
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save experience"}`)
    }
  }
  const handleEducationSubmit = async (e) => {
    e.preventDefault()
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    const formData = new FormData(e.target)
    const isCurrent = formData.get("current") === "on"
    const startDate = formData.get("startDate")
    const schoolName = formData.get("institution")
    const degreeName = formData.get("degree")
    const location = formData.get("location")
    const fieldOfStudy = formData.get("fieldOfStudy")

    // Always require an end date, even for current positions
    let endDate = formData.get("endDate")

    // If current is checked and no end date is provided, use today's date
    if (isCurrent && (!endDate || endDate === "")) {
      endDate = new Date().toISOString().split("T")[0]
    }

    // Validate dates
    if (!validateEducationDates(startDate, endDate, isCurrent)) {
      return
    }

    if (!state.currentItem) {
      const existingFormation = state.formations.find(
        (f) =>
          f.school.toLowerCase() === schoolName.toLowerCase() && f.degree.toLowerCase() === degreeName.toLowerCase(),
      )

      if (existingFormation) {
        toast.error("An education entry with this school and degree already exists")
        return
      }
    }

    const data = {
      school: schoolName,
      degree: degreeName,
      fieldOfStudy: formData.get("fieldOfStudy"),
      location: location,
      startDate: startDate,
      endDate: endDate, // Always provide an end date
      description: formData.get("description"),
      current: isCurrent,
    }

    try {
      if (state.currentItem) {
        await userService.updateFormation(user._id, state.currentItem._id, data)
        setState((prev) => ({
          ...prev,
          formations: prev.formations.map((form) => (form._id === state.currentItem._id ? { ...form, ...data } : form)),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Education updated successfully")
      } else {
        const response = await userService.addFormation(user._id, data)
        setState((prev) => ({
          ...prev,
          formations: [...prev.formations, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Education added successfully")
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save education"}`)
    }
  }

  const handleCertificationSubmit = async (e) => {
    e.preventDefault()
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    const formData = new FormData(e.target)
    const issueDate = formData.get("issueDate")
    const expirationDate = formData.get("expirationDate") || null

    // Validate dates
    if (!validateCertificationDates(issueDate, expirationDate)) {
      return
    }

    const data = {
      name: formData.get("name"),
      issuer: formData.get("issuingOrganization"),
      issueDate: issueDate,
      expirationDate: expirationDate,
      credentialId: formData.get("credentialId") || null,
      credentialURL: formData.get("credentialUrl") || null,
    }

    try {
      if (state.currentItem) {
        await userService.updateCertification(user._id, state.currentItem._id, data)
        setState((prev) => ({
          ...prev,
          certifications: prev.certifications.map((cert) =>
            cert._id === state.currentItem._id ? { ...cert, ...data } : cert,
          ),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Certification updated successfully")
      } else {
        const response = await userService.addCertification(user._id, data)
        setState((prev) => ({
          ...prev,
          certifications: [...prev.certifications, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Certification added successfully")
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save certification"}`)
    }
  }

  const handleLanguageSubmit = async (e) => {
    e.preventDefault()
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    const formData = new FormData(e.target)
    const data = {
      name: formData.get("languageName"),
      level: formData.get("level") || "Intermediate",
      proficiency: formData.get("level") || "Intermediate",
    }

    try {
      if (state.currentItem) {
        await userService.updateLanguage(user._id, state.currentItem._id, data)
        setState((prev) => ({
          ...prev,
          languages: prev.languages.map((lang) => (lang._id === state.currentItem._id ? { ...lang, ...data } : lang)),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Language updated successfully")
      } else {
        const response = await userService.addLanguage(user._id, data)
        setState((prev) => ({
          ...prev,
          languages: [...prev.languages, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Language added successfully")
      }
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save language"}`)
    }
  }

  const deleteItem = async (type, id) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      switch (type) {
        case "experience":
          await userService.deleteExperience(user._id, id)
          setState((prev) => ({
            ...prev,
            experiences: prev.experiences.filter((exp) => exp._id !== id),
            showDeleteDialog: false,
            currentItem: null,
          }))
          break
        case "education":
          await userService.deleteFormation(user._id, id)
          setState((prev) => ({
            ...prev,
            formations: prev.formations.filter((form) => form._id !== id),
            showDeleteDialog: false,
            currentItem: null,
          }))
          break
        case "certification":
          await userService.deleteCertification(user._id, id)
          setState((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((cert) => cert._id !== id),
            showDeleteDialog: false,
            currentItem: null,
          }))
          break
        case "language":
          await userService.deleteLanguage(user._id, id)
          setState((prev) => ({
            ...prev,
            languages: prev.languages.filter((lang) => lang._id !== id),
            showDeleteDialog: false,
            currentItem: null,
          }))
          break
        default:
          break
      }
      toast.success("Item deleted successfully")
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to delete item"}`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Present"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-700 mb-4" />
          <p className="text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-6">You must be logged in to access this page.</p>
          <Button
            onClick={() => navigate("/login", { state: { from: "/profile" } })}
            className="bg-blue-700 hover:bg-blue-800"
          >
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-700 mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
          {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
        </div>
      </div>
    )
  }

  if (state.error) {
    window.location.reload()
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Profile</h1>
        <p className="text-gray-600 mb-8">
          Complete your profile to enhance your professional presence and opportunities
        </p>

        {/* Mobile Profile Summary */}
        <div className="md:hidden mb-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <CardContent className="pt-0 -mt-8 flex items-center gap-4">
              <div className="relative">
                {state.savedProfileData.profilePicture ? (
                  <img
                    src={"../assets/" + state.savedProfileData.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center
                    border-2 border-white shadow-md"
                  >
                    <User className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <button
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                  disabled={state.isUploading}
                >
                  {state.isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {state.savedProfileData.firstName || "Your"} {state.savedProfileData.lastName || "Name"}
                </h2>
                {state.savedProfileData.jobTitle && (
                  <p className="text-gray-600 text-sm">{state.savedProfileData.jobTitle}</p>
                )}
                <div className="flex items-center mt-1">
                  <span className="text-xs font-medium text-gray-700 mr-2">Profile: {completionPercentage}%</span>
                  <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${completionPercentage < 30
                        ? "bg-red-500"
                        : completionPercentage < 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePictureChange}
                accept="image/*"
                className="hidden"
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block w-full md:w-1/3">
            <Card className="sticky top-4 overflow-hidden border-0 shadow-lg">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardContent className="pt-0 -mt-12">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {state.savedProfileData.profilePicture ? (
                      <img
                        src={"../assets/" + state.savedProfileData.profilePicture || "/placeholder.svg"}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-md">
                        <User className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                      disabled={state.isUploading}
                    >
                      {state.isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-center text-gray-900">
                    {state.savedProfileData.firstName || "Your"} {state.savedProfileData.lastName || "Name"}
                  </h2>
                  {state.savedProfileData.jobTitle && (
                    <p className="text-gray-600 text-center font-medium mt-1">{state.savedProfileData.jobTitle}</p>
                  )}

                  <div className="w-full mt-4 space-y-3">
                    {state.savedProfileData.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{state.savedProfileData.location}</span>
                      </div>
                    )}
                    {state.savedProfileData.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="truncate">{state.savedProfileData.email}</span>
                      </div>
                    )}
                    {state.savedProfileData.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{state.savedProfileData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-semibold text-blue-700">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${completionPercentage < 30
                        ? "bg-red-500"
                        : completionPercentage < 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        }`}
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {completionPercentage < 30
                      ? "Just getting started! Complete more sections to improve your profile."
                      : completionPercentage < 70
                        ? "Good progress! Keep adding more details to stand out."
                        : "Excellent! Your profile is looking professional."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Personal Info</span>
                    {Object.values(state.savedProfileData).some((val) => val) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Skills</span>
                    {state.skills.length >= 3 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Experience</span>
                    {state.experiences.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Education</span>
                    {state.formations.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Certifications</span>
                    {state.certifications.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Languages</span>
                    {state.languages.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 bg-white shadow-sm rounded-lg p-1 overflow-x-auto">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Skills
                </TabsTrigger>
                <TabsTrigger
                  value="experience"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Experience
                </TabsTrigger>
                <TabsTrigger
                  value="education"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Education
                </TabsTrigger>
                <TabsTrigger
                  value="certifications"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Certifications
                </TabsTrigger>
                <TabsTrigger
                  value="languages"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-md text-xs sm:text-sm"
                >
                  Languages
                </TabsTrigger>
              </TabsList>

              {/* Mobile Save Button */}
              <div className="md:hidden mb-4 flex justify-end">
                <Button
                  onClick={saveProfile}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                  disabled={state.saving}
                  size="sm"
                >
                  {state.saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                  Save
                </Button>
              </div>

              <TabsContent value="personal" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <CardTitle className="text-xl text-gray-900">Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information to complete your profile and improve your professional presence.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={state.profileData.firstName}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={state.profileData.lastName}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your last name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={state.profileData.email}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={state.profileData.phone}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-gray-700">
                          Location
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          value={state.profileData.location}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="City, Country"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle" className="text-gray-700">
                          Current jobTitle
                        </Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          value={state.profileData.jobTitle}
                          onChange={handleProfileChange}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="e.g. Senior Developer"
                        />
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <Label htmlFor="bio" className="text-gray-700">
                        Professional Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={state.profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Tell us about your professional background, skills, and career goals..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t px-6 py-4">
                    <Button
                      onClick={saveProfile}
                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={state.saving}
                    >
                      {state.saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="skills" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <CardTitle className="text-xl text-gray-900">Technical Skills</CardTitle>
                    <CardDescription>
                      Add your skills to help us match you with relevant job opportunities. Our AI will analyze your
                      skills to provide personalized recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="flex-1">
                        <Input
                          placeholder="Add a skill (e.g., Python, Project Management...)"
                          value={state.newSkill}
                          onChange={(e) => setState((prev) => ({ ...prev, newSkill: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              state.editingSkill ? handleSkillOperation("update") : handleSkillOperation("add")
                            }
                          }}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Select
                          value={state.skillLevel}
                          onValueChange={(value) => setState((prev) => ({ ...prev, skillLevel: value }))}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Skill level" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-20">
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        {state.editingSkill ? (
                          <>
                            <Button
                              onClick={() => handleSkillOperation("update")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                            <Button variant="outline" onClick={() => handleSkillOperation("cancel")}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => handleSkillOperation("add")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {state.skills.map((skill) => (
                        <Badge
                          key={skill._id}
                          variant="outline"
                          className="px-3 py-1.5 text-xs sm:text-sm flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all duration-200"
                        >
                          <span className="font-medium">{skill.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                            {skill.level}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSkillOperation("edit", skill)
                              }}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSkillOperation("remove", skill)
                              }}
                              className="text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </Badge>
                      ))}
                      {state.skills.length === 0 && (
                        <div className="w-full text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-gray-500 text-sm">No skills added yet. Add your first skill above.</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium mb-3 text-gray-900">Suggested Skills</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {["TypeScript", "Express.js", "GraphQL", "Docker", "AWS"].map((skill) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className="px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 flex items-center gap-1 bg-white border border-gray-200 transition-all duration-200"
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                newSkill: skill,
                                skillLevel: "Intermediate",
                              }))
                            }
                          >
                            {skill}
                            <PlusCircle className="h-3 w-3 ml-1 text-blue-600" />
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Click on a skill to add it to your profile</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="experience" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Work Experience</CardTitle>
                        <CardDescription>
                          Add your work experience to showcase your professional background.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("experience")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add Experience</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {state.experiences.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No experience added</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          Add your work experience to showcase your professional background and skills to potential
                          employers.
                        </p>
                        <Button
                          onClick={() => openDialog("experience")}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.experiences.map((exp) => (
                          <div
                            key={exp._id}
                            className="border rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{exp.jobTitle}</h3>
                                <p className="text-blue-700 font-medium">{exp.company}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-2">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{exp.location}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
                                <Button variant="outline" size="sm" onClick={() => openDialog("experience", exp)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setState((prev) => ({
                                      ...prev,
                                      showDeleteDialog: true,
                                      currentItem: exp,
                                      activeDialog: "experience",
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {exp.description && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="education" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Education</CardTitle>
                        <CardDescription>
                          Add your education history to showcase your academic background.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("education")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add Education</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {state.formations.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No education added</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          Add your educational background to highlight your academic achievements and qualifications.
                        </p>
                        <Button
                          onClick={() => openDialog("education")}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.formations.map((edu) => (
                          <div
                            key={edu._id}
                            className="border rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{edu.degree}</h3>

                                <p className="text-blue-700 font-medium">{edu.school}</p>
                                {edu.fieldOfStudy && (
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                      {edu.fieldOfStudy}
                                    </span>
                                  </div>
                                )}
                                {edu.location && (
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{edu.location}</span>
                                  </div>
                                )}


                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
                                <Button variant="outline" size="sm" onClick={() => openDialog("education", edu)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setState((prev) => ({
                                      ...prev,
                                      showDeleteDialog: true,
                                      currentItem: edu,
                                      activeDialog: "education",
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {edu.description && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-gray-700 text-sm leading-relaxed">{edu.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="certifications" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Certifications</CardTitle>
                        <CardDescription>
                          Add your professional certifications to showcase your expertise.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("certification")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add Certification</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {state.certifications.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Award className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          Add your professional certifications to demonstrate your specialized knowledge and skills.
                        </p>
                        <Button
                          onClick={() => openDialog("certification")}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Add Certification</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.certifications.map((cert) => (
                          <div
                            key={cert._id}
                            className="border rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{cert.name}</h3>
                                <p className="text-blue-700 font-medium">{cert.issuer}</p>
                                {cert.credentialId && (
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <span className="font-medium">ID:</span>
                                    <span className="ml-1">{cert.credentialId}</span>
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    Issued: {formatDate(cert.issueDate)}
                                    {cert.expirationDate && ` - Expires: ${formatDate(cert.expirationDate)}`}
                                  </span>
                                </div>
                                {cert.credentialURL && (
                                  <a
                                    href={cert.credentialURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <Award className="h-3 w-3 mr-1" />
                                    View Credential
                                  </a>
                                )}
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
                                <Button variant="outline" size="sm" onClick={() => openDialog("certification", cert)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setState((prev) => ({
                                      ...prev,
                                      showDeleteDialog: true,
                                      currentItem: cert,
                                      activeDialog: "certification",
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="languages" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Languages</CardTitle>
                        <CardDescription>
                          Add languages you speak to showcase your communication skills.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("language")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add Language</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {state.languages.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <Globe className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No languages added</h3>
                        <p className="text-gray-500 mb-4 max-w-md mx-auto">
                          Add languages you speak to demonstrate your communication skills and global perspective.
                        </p>
                        <Button
                          onClick={() => openDialog("language")}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Language
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.languages.map((lang) => (
                          <div
                            key={lang._id}
                            className="border rounded-lg p-5 hover:shadow-md transition-all duration-200 bg-white"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{lang.name}</h3>
                                <div className="flex items-center mt-2 gap-2">
                                  <span className="text-sm text-gray-600">Proficiency:</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                                    {lang.proficiency || lang.level}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
                                <Button variant="outline" size="sm" onClick={() => openDialog("language", lang)}>
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setState((prev) => ({
                                      ...prev,
                                      showDeleteDialog: true,
                                      currentItem: lang,
                                      activeDialog: "language",
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Experience Dialog */}
        <Dialog open={state.activeDialog === "experience"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Work Experience" : "Add Work Experience"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 opacity-90">
                Fill in the details of your work experience to showcase your professional background.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleExperienceSubmit} className="p-6">
              <div className="grid gap-5 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-700">
                      Company
                    </Label>
                    <Input
                      id="company"
                      name="company"
                      defaultValue={state.currentItem?.company || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-gray-700">
                      Job Title
                    </Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      defaultValue={state.currentItem?.jobTitle || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-700">
                      Location
                    </Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={state.currentItem?.location || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current" className="text-gray-700">
                      Currently Working
                    </Label>
                    <div className="flex items-center space-x-2 h-10 pt-2">
                      <input
                        type="checkbox"
                        id="current"
                        name="current"
                        defaultChecked={!state.currentItem?.endDate || state.currentItem?.endDate === null}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          const endDateField = document.getElementById("endDate")
                          const endDateLabel = document.querySelector('label[for="endDate"]')
                          const currentLabel = document.querySelector('label[for="current"]')

                          if (endDateField && endDateLabel) {
                            if (e.target.checked) {
                              endDateField.disabled = true
                              endDateField.value = ""
                              endDateLabel.parentElement.classList.add("opacity-50")
                              if (currentLabel) {
                                currentLabel.innerHTML =
                                  'Currently Working <span class="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Current</span>'
                              }
                            } else {
                              endDateField.disabled = false
                              endDateField.value = new Date().toISOString().split("T")[0] // Set to today's date
                              endDateLabel.parentElement.classList.remove("opacity-50")
                              if (currentLabel) {
                                currentLabel.textContent = "Currently Working"
                              }
                            }
                          }
                        }}
                      />
                      <Label htmlFor="current" className="text-gray-600 flex items-center">
                        Currently Working
                        {(!state.currentItem?.endDate || state.currentItem?.endDate === null) && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-700">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={
                        state.currentItem?.startDate
                          ? new Date(state.currentItem.startDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                      onChange={() => {
                        const startDate = document.getElementById("startDate").value
                        const endDate = document.getElementById("endDate").value
                        const isCurrent = document.getElementById("current").checked
                        validateExperienceDates(startDate, endDate, isCurrent)
                      }}
                    />
                    {state.dateErrors.experience.startDate && (
                      <p className="text-red-500 text-xs mt-1">{state.dateErrors.experience.startDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-700">
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={
                        state.currentItem?.endDate && state.currentItem?.endDate !== null
                          ? new Date(state.currentItem.endDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={!state.currentItem?.endDate || state.currentItem?.endDate === null}
                      onChange={() => {
                        const startDate = document.getElementById("startDate").value
                        const endDate = document.getElementById("endDate").value
                        const isCurrent = document.getElementById("current").checked
                        validateExperienceDates(startDate, endDate, isCurrent)
                      }}
                    />
                    {state.dateErrors.experience.endDate && (
                      <p className="text-red-500 text-xs mt-1">{state.dateErrors.experience.endDate}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={state.currentItem?.description || ""}
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe your responsibilities, achievements, and the skills you utilized in this role..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {state.currentItem ? "Update Experience" : "Add Experience"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Education Dialog */}
        <Dialog open={state.activeDialog === "education"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Education" : "Add Education"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 opacity-90">
                Fill in the details of your education to showcase your academic background.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEducationSubmit} className="p-6">
              <div className="grid gap-5 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-gray-700">
                      Institution
                    </Label>
                    <Input
                      id="institution"
                      name="institution"
                      defaultValue={state.currentItem?.school || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="degree" className="text-gray-700">
                      Degree
                    </Label>
                    <Input
                      id="degree"
                      name="degree"
                      defaultValue={state.currentItem?.degree || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy" className="text-gray-700">
                    Field of Study
                  </Label>
                  <Input
                    id="fieldOfStudy"
                    name="fieldOfStudy"
                    defaultValue={state.currentItem?.fieldOfStudy || ""}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-gray-700">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={state.currentItem?.location || ""}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="City, Country"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-700">
                      Start Date
                    </Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={
                        state.currentItem?.startDate
                          ? new Date(state.currentItem.startDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                      onChange={() => {
                        const startDate = document.getElementById("startDate").value
                        const endDate = document.getElementById("educationEndDate").value
                        const isCurrent = document.getElementById("currentEducation").checked
                        validateEducationDates(startDate, endDate, isCurrent)
                      }}
                    />
                    {state.dateErrors.education.startDate && (
                      <p className="text-red-500 text-xs mt-1">{state.dateErrors.education.startDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentEducation" className="text-gray-700">
                      Currently Studying
                    </Label>
                    <div className="flex items-center space-x-2 h-10 pt-2">
                      <input
                        type="checkbox"
                        id="currentEducation"
                        name="current"
                        defaultChecked={!state.currentItem?.endDate || state.currentItem?.endDate === null}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={(e) => {
                          const endDateField = document.getElementById("educationEndDate")
                          const endDateLabel = document.querySelector('label[for="educationEndDate"]')
                          const currentLabel = document.querySelector('label[for="currentEducation"]')

                          if (endDateField && endDateLabel) {
                            if (e.target.checked) {
                              endDateField.disabled = true
                              endDateField.value = ""
                              endDateLabel.parentElement.classList.add("opacity-50")
                              if (currentLabel) {
                                currentLabel.innerHTML =
                                  'Currently Studying <span class="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Current</span>'
                              }
                            } else {
                              endDateField.disabled = false
                              endDateField.value = new Date().toISOString().split("T")[0] // Set to today's date
                              endDateLabel.parentElement.classList.remove("opacity-50")
                              if (currentLabel) {
                                currentLabel.textContent = "Currently Studying"
                              }
                            }
                          }
                        }}
                      />
                      <Label htmlFor="currentEducation" className="text-gray-600 flex items-center">
                        Currently Studying
                        {(!state.currentItem?.endDate || state.currentItem?.endDate === null) && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="educationEndDate" className="text-gray-700">
                    End Date
                  </Label>
                  <Input
                    id="educationEndDate"
                    name="endDate"
                    type="date"
                    defaultValue={
                      state.currentItem?.endDate && state.currentItem?.endDate !== null
                        ? new Date(state.currentItem.endDate).toISOString().split("T")[0]
                        : ""
                    }
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!state.currentItem?.endDate || state.currentItem?.endDate === null}
                    onChange={() => {
                      const startDate = document.getElementById("startDate").value
                      const endDate = document.getElementById("educationEndDate").value
                      const isCurrent = document.getElementById("currentEducation").checked
                      validateEducationDates(startDate, endDate, isCurrent)
                    }}
                  />
                  {state.dateErrors.education.endDate && (
                    <p className="text-red-500 text-xs mt-1">{state.dateErrors.education.endDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={state.currentItem?.description || ""}
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Describe your studies, achievements, and relevant coursework..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {state.currentItem ? "Update Education" : "Add Education"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Certification Dialog */}
        <Dialog open={state.activeDialog === "certification"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Certification" : "Add Certification"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 opacity-90">
                Fill in the details of your professional certification to showcase your expertise.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCertificationSubmit} className="p-6">
              <div className="grid gap-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Certification Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={state.currentItem?.name || ""}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingOrganization" className="text-gray-700">
                    Issuing Organization
                  </Label>
                  <Input
                    id="issuingOrganization"
                    name="issuingOrganization"
                    defaultValue={state.currentItem?.issuer || ""}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-gray-700">
                      Issue Date
                    </Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      defaultValue={
                        state.currentItem?.issueDate
                          ? new Date(state.currentItem.issueDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                      onChange={() => {
                        const issueDate = document.getElementById("issueDate").value
                        const expirationDate = document.getElementById("expirationDate").value
                        validateCertificationDates(issueDate, expirationDate)
                      }}
                    />
                    {state.dateErrors.certification.issueDate && (
                      <p className="text-red-500 text-xs mt-1">{state.dateErrors.certification.issueDate}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate" className="text-gray-700">
                      Expiration Date
                    </Label>
                    <Input
                      id="expirationDate"
                      name="expirationDate"
                      type="date"
                      defaultValue={
                        state.currentItem?.expirationDate
                          ? new Date(state.currentItem.expirationDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      onChange={() => {
                        const issueDate = document.getElementById("issueDate").value
                        const expirationDate = document.getElementById("expirationDate").value
                        validateCertificationDates(issueDate, expirationDate)
                      }}
                    />
                    {state.dateErrors.certification.expirationDate && (
                      <p className="text-red-500 text-xs mt-1">{state.dateErrors.certification.expirationDate}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credentialId" className="text-gray-700">
                      Credential ID (if applicable)
                    </Label>
                    <Input
                      id="credentialId"
                      name="credentialId"
                      defaultValue={state.currentItem?.credentialId || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentialUrl" className="text-gray-700">
                      Credential URL (if applicable)
                    </Label>
                    <Input
                      id="credentialUrl"
                      name="credentialUrl"
                      type="url"
                      defaultValue={state.currentItem?.credentialURL || ""}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {state.currentItem ? "Update Certification" : "Add Certification"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Language Dialog */}
        <Dialog open={state.activeDialog === "language"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Language" : "Add Language"}
              </DialogTitle>
              <DialogDescription className="text-blue-100 opacity-90">
                Add languages you speak to showcase your communication skills.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLanguageSubmit} className="p-6">
              <div className="grid gap-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="languageName" className="text-gray-700">
                    Language
                  </Label>
                  <Input
                    id="languageName"
                    name="languageName"
                    defaultValue={state.currentItem?.name || ""}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    placeholder="e.g. English, French, Spanish"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className="text-gray-700">
                    Proficiency Level
                  </Label>
                  <Select name="level" defaultValue={state.currentItem?.level || "Intermediate"}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white" >
                      <SelectItem value="Native">Native</SelectItem>
                      <SelectItem value="Fluent">Fluent</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {state.currentItem ? "Update Language" : "Add Language"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={state.showDeleteDialog}
          onOpenChange={(open) => setState((prev) => ({ ...prev, showDeleteDialog: open }))}
        >
          <DialogContent className="bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-red-50 p-6 border-b border-red-100">
              <DialogTitle className="text-xl font-bold text-red-700">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-red-600">
                This action cannot be undone. This will permanently delete the selected item from your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this item? This action cannot be reversed and all associated data will
                be permanently removed.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: false }))}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (state.currentItem) {
                      if (state.activeDialog === "experience") {
                        deleteItem("experience", state.currentItem._id)
                      } else if (state.activeDialog === "education") {
                        deleteItem("education", state.currentItem._id)
                      } else if (state.activeDialog === "certification") {
                        deleteItem("certification", state.currentItem._id)
                      } else if (state.activeDialog === "language") {
                        deleteItem("language", state.currentItem._id)
                      }
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ProfilePage
 