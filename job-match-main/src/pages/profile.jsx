"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { CheckCircle, XCircle } from "lucide-react"
import {
  PlusCircle,
  X,
  MapPin,
  Briefcase,
  RefreshCw,
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
import { Switch } from "../components/ui/switch"
import { Separator } from "../components/ui/separator"

function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Add languages to the state initialization
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
  })

  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [activeTab, setActiveTab] = useState("personal")

  // Update the calculateProfileCompletion function to include languages
  const calculateProfileCompletion = () => {
    let total = 0

    // Personal Info (25%)
    if (state.profileData.firstName) total += 4
    if (state.profileData.lastName) total += 4
    if (state.profileData.email) total += 4
    if (state.profileData.phone) total += 3
    if (state.profileData.location) total += 3
    if (state.profileData.jobTitle) total += 3
    if (state.profileData.bio) total += 3
    if (state.profilePicture) total += 1

    // Skills (20%)
    if (state.skills.length >= 3) {
      total += 20
    } else {
      total += (state.skills.length / 3) * 20
    }

    // Experience (20%)
    if (state.experiences.length > 0) total += 20

    // Education (15%)
    if (state.formations.length > 0) total += 15

    // Certifications (10%)
    if (state.certifications.length > 0) total += 10

    // Languages (10%)
    if (state.languages.length > 0) total += 10

    return Math.min(Math.round(total), 100)
  }

  useEffect(() => {
    setCompletionPercentage(calculateProfileCompletion())
  }, [
    state.profileData,
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

  // Update the loadProfileData function to load languages
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

      const [profile, skills, experiences, formations, certifications, languages] = await Promise.all([
        userService.getUserProfile(user._id),
        userService.getUserSkills(user._id).catch(() => []),
        userService.getExperiences(user._id).catch(() => []),
        userService.getFormations(user._id).catch(() => []),
        userService.getCertifications(user._id).catch(() => []),
        userService.getLanguages(user._id).catch(() => []),
      ])

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
        profilePicture: profile.user.person.profilePicture?.url || null,
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

  const handleSkillOperation = (operation, skill = null) => {
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

          userService
            .addUserSkill(user._id, {
              name: state.newSkill,
              level: state.skillLevel,
            })
            .then(() => {
              setState((prev) => ({
                ...prev,
                skills: [...prev.skills, { _id: Date.now().toString(), name: prev.newSkill, level: prev.skillLevel }],
                newSkill: "",
                skillLevel: "Intermediate",
              }))
              toast.success("Skill added successfully")
            })
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
          userService
            .updateUserSkill(user._id, state.editingSkill, {
              name: state.newSkill,
              level: state.skillLevel,
            })
            .then(() => {
              setState((prev) => ({
                ...prev,
                skills: prev.skills.map((s) =>
                  s._id === prev.editingSkill ? { ...s, name: prev.newSkill, level: prev.skillLevel } : s,
                ),
                newSkill: "",
                skillLevel: "Intermediate",
                editingSkill: null,
              }))
              toast.success("Skill updated successfully")
            })
          break

        case "remove":
          userService.removeUserSkill(user._id, skill._id).then(() => {
            setState((prev) => ({
              ...prev,
              skills: prev.skills.filter((s) => s._id !== skill._id),
            }))
            toast.success("Skill removed successfully")
          })
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
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
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
      const reader = new FileReader()
      reader.onload = () => {
        setState((prev) => ({
          ...prev,
          profilePicture: reader.result,
        }))
      }
      reader.readAsDataURL(file)

      const response = await userService.uploadProfilePicture(user._id, file)
      setState((prev) => ({
        ...prev,
        profilePicture: response.profilePicture?.url || null,
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

    setState((prev) => ({ ...prev, saving: true }))
    try {
      await userService.updateUserProfile(user._id, {
        ...state.profileData,
        phoneNumber: state.profileData.phone,
      })
      toast.success("Profile updated successfully")
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message || "Failed to update profile"}`)
      }
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const openDialog = (dialogName, item = null) => {
    setState((prev) => ({
      ...prev,
      activeDialog: dialogName,
      currentItem: item,
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
    const data = {
      company: formData.get("company"),
      jobTitle: formData.get("jobTitle"),
      location: formData.get("location"),
      startDate: formData.get("startDate"),
      endDate: formData.get("current") === "on" ? null : formData.get("endDate"),
      description: formData.get("description"),
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

    // Check if a formation with the same school and degree already exists
    const schoolName = formData.get("institution")
    const degreeName = formData.get("degree")

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
      school: formData.get("institution"),
      degree: formData.get("degree"),
      fieldOfStudy: formData.get("fieldOfStudy"),
      startDate: formData.get("startDate"),
      endDate: isCurrent ? null : formData.get("endDate") || null,
      description: formData.get("description"),
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
    const data = {
      name: formData.get("name"),
      issuer: formData.get("issuingOrganization"),
      issueDate: formData.get("issueDate"),
      expirationDate: formData.get("expirationDate") || null,
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

  // Add a handler for language operations
  const handleLanguageSubmit = async (e) => {
    e.preventDefault()
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    const formData = new FormData(e.target)
    const data = {
      name: formData.get("languageName"),
      proficiency: formData.get("level"),
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

  // Update the deleteItem function to handle languages
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
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
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
            className="bg-purple-700 hover:bg-purple-800"
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
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
          {state.error && <p className="text-red-500 text-sm mt-2">{state.error}</p>}
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Loading Error</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <Button onClick={() => window.location.reload()} className="bg-purple-700 hover:bg-purple-800">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Profile</h1>
        <p className="text-gray-600 mb-8">
          Complete your profile to enhance your professional presence and opportunities
        </p>

        {/* Mobile Profile Summary - Only visible on small screens */}
        <div className="md:hidden mb-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
            <CardContent className="pt-0 -mt-8 flex items-center gap-4">
              <div className="relative">
                {state.profilePicture ? (
                  <img
                    src={state.profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-2 border-white shadow-md">
                    <User className="h-8 w-8 text-gray-300" />
                  </div>
                )}
                <button
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-1 rounded-full hover:bg-purple-700 transition-colors shadow-md"
                  disabled={state.isUploading}
                >
                  {state.isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {state.profileData.firstName || "Your"} {state.profileData.lastName || "Name"}
                </h2>
                {state.profileData.jobTitle && <p className="text-gray-600 text-sm">{state.profileData.jobTitle}</p>}
                <div className="flex items-center mt-1">
                  <span className="text-xs font-medium text-gray-700 mr-2">Profile: {completionPercentage}%</span>
                  <Progress
                    value={completionPercentage}
                    className="h-1.5 w-24 bg-gray-100"
                    indicatorClassName={`${
                      completionPercentage < 30
                        ? "bg-red-500"
                        : completionPercentage < 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
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
              <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
              <CardContent className="pt-0 -mt-12">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {state.profilePicture ? (
                      <img
                        src={state.profilePicture || "/placeholder.svg"}
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
                      className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors shadow-md"
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
                    {state.profileData.firstName || "Your"} {state.profileData.lastName || "Name"}
                  </h2>
                  {state.profileData.jobTitle && (
                    <p className="text-gray-600 text-center font-medium mt-1">{state.profileData.jobTitle}</p>
                  )}

                  <div className="w-full mt-4 space-y-3">
                    {state.profileData.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{state.profileData.location}</span>
                      </div>
                    )}
                    {state.profileData.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="truncate">{state.profileData.email}</span>
                      </div>
                    )}
                    {state.profileData.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{state.profileData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                    <span className="text-sm font-semibold text-purple-700">{completionPercentage}%</span>
                  </div>
                  <Progress
                    value={completionPercentage}
                    className="h-2 bg-gray-100"
                    indicatorClassName={`${
                      completionPercentage < 30
                        ? "bg-red-500"
                        : completionPercentage < 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
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
                    {Object.values(state.profileData).some((val) => val) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Skills ({state.skills.length})</span>
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
                <Button
                  onClick={saveProfile}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200 transform hover:translate-y-[-2px]"
                  disabled={state.saving}
                >
                  {state.saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 bg-white shadow-sm rounded-lg p-1 overflow-x-auto">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Skills
                </TabsTrigger>
                <TabsTrigger
                  value="experience"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Experience
                </TabsTrigger>
                <TabsTrigger
                  value="education"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Education
                </TabsTrigger>
                <TabsTrigger
                  value="certifications"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Certifications
                </TabsTrigger>
                <TabsTrigger
                  value="languages"
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md text-xs sm:text-sm"
                >
                  Languages
                </TabsTrigger>
              </TabsList>

              {/* Mobile Save Button - Only visible on small screens */}
              <div className="md:hidden mb-4 flex justify-end">
                <Button
                  onClick={saveProfile}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                  disabled={state.saving}
                  size="sm"
                >
                  {state.saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                  Save
                </Button>
              </div>

              <TabsContent value="personal" className="space-y-6">
                <Card className="border-0 shadow-md overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Tell us about your professional background, skills, and career goals..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 border-t px-6 py-4">
                    <Button
                      onClick={saveProfile}
                      className="ml-auto bg-purple-600 hover:bg-purple-700 text-white"
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
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
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
                          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <Select
                          value={state.skillLevel}
                          onValueChange={(value) => setState((prev) => ({ ...prev, skillLevel: value }))}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Skill level" />
                          </SelectTrigger>
                          <SelectContent>
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
                            className="bg-purple-600 hover:bg-purple-700 text-white"
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
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                            {skill.level}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSkillOperation("edit", skill)}
                              className="text-gray-500 hover:text-purple-600 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleSkillOperation("remove", skill)}
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
                            className="px-3 py-1.5 text-xs cursor-pointer hover:bg-purple-50 flex items-center gap-1 bg-white border border-gray-200 transition-all duration-200"
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                newSkill: skill,
                                skillLevel: "Intermediate",
                              }))
                            }
                          >
                            {skill}
                            <PlusCircle className="h-3 w-3 ml-1 text-purple-600" />
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
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Work Experience</CardTitle>
                        <CardDescription>
                          Add your work experience to showcase your professional background.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("experience")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
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
                          className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                <p className="text-purple-700 font-medium">{exp.company}</p>
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
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Education</CardTitle>
                        <CardDescription>
                          Add your education history to showcase your academic background.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("education")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
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
                          className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                <p className="text-purple-700 font-medium">{edu.school}</p>
                                {edu.fieldOfStudy && (
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                                      {edu.fieldOfStudy}
                                    </span>
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
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Certifications</CardTitle>
                        <CardDescription>
                          Add your professional certifications to showcase your expertise.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("certification")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
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
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Certification
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
                                <p className="text-purple-700 font-medium">{cert.issuer}</p>
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
                                    className="inline-flex items-center mt-2 text-sm text-purple-600 hover:text-purple-800"
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
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                      <div>
                        <CardTitle className="text-xl text-gray-900">Languages</CardTitle>
                        <CardDescription>
                          Add languages you speak to showcase your communication skills.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("language")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
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
                          className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                <div className="flex items-center mt-2">
                                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                                    {lang.proficiency}
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
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Work Experience" : "Add Work Experience"}
              </DialogTitle>
              <DialogDescription className="text-purple-100 opacity-90">
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-gray-700">
                      jobTitle
                    </Label>
                    <Input
                      id="jobTitle"
                      name="jobTitle"
                      defaultValue={state.currentItem?.jobTitle || ""}
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current" className="text-gray-700">
                      Currently Working
                    </Label>
                    <div className="flex items-center space-x-2 h-10 pt-2">
                      <Switch id="current" name="current" defaultChecked={state.currentItem?.endDate ? false : true} />
                      <Label htmlFor="current" className="text-gray-600">
                        {state.currentItem?.endDate ? "No" : "Yes"}
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
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
                        state.currentItem?.endDate
                          ? new Date(state.currentItem.endDate).toISOString().split("T")[0]
                          : ""
                      }
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Describe your responsibilities, achievements, and the skills you utilized in this role..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {state.currentItem ? "Update Experience" : "Add Experience"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Education Dialog */}
        <Dialog open={state.activeDialog === "education"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Education" : "Add Education"}
              </DialogTitle>
              <DialogDescription className="text-purple-100 opacity-90">
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current" className="text-gray-700">
                      Currently Studying
                    </Label>
                    <div className="flex items-center space-x-2 h-10 pt-2">
                      <Switch id="current" name="current" defaultChecked={state.currentItem?.endDate ? false : true} />
                      <Label htmlFor="current" className="text-gray-600">
                        {state.currentItem?.endDate ? "No" : "Yes"}
                      </Label>
                    </div>
                  </div>
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
                      state.currentItem?.endDate ? new Date(state.currentItem.endDate).toISOString().split("T")[0] : ""
                    }
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Describe your studies, achievements, and relevant coursework..."
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {state.currentItem ? "Update Education" : "Add Education"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Certification Dialog */}
        <Dialog open={state.activeDialog === "certification"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Certification" : "Add Certification"}
              </DialogTitle>
              <DialogDescription className="text-purple-100 opacity-90">
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate" className="text-gray-700">
                      Expiration Date (if applicable)
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  {state.currentItem ? "Update Certification" : "Add Certification"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Language Dialog */}
        <Dialog open={state.activeDialog === "language"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <DialogTitle className="text-xl font-bold">
                {state.currentItem ? "Edit Language" : "Add Language"}
              </DialogTitle>
              <DialogDescription className="text-purple-100 opacity-90">
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
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    required
                    placeholder="e.g. English, French, Spanish"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proficiency" className="text-gray-700">
                    Proficiency Level
                  </Label>
                  <Select name="proficiency" defaultValue={state.currentItem?.proficiency || "Intermediate"}>
                    <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select proficiency level" />
                    </SelectTrigger>
                    <SelectContent>
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
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
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

