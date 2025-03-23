"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"

import {
  PlusCircle,
  X,
  MapPin,
  Briefcase,
  RefreshCw,
  Upload,
  Trash2,
  Camera,
  User,
  Loader2,
  Calendar,
  GraduationCap,
  Award,
  Edit,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../contexts/auth-context"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { useNavigate } from "react-router-dom"
import { userService } from "../services/user-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"

function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

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
      position: "",
      bio: "",
    },
    profilePicture: null,
    isUploading: false,
    showDeleteDialog: false,
    error: null,
    experiences: [],
    formations: [],
    certifications: [],
    activeDialog: null,
    currentItem: null,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        state: { from: "/profile", message: "Please log in to access your profile" },
      })
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    let isMounted = true

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

        const [profile, skills, experiences, formations] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id).catch(() => []),
          userService.getExperiences(user._id).catch(() => []),
          userService.getFormations(user._id).catch(() => []),
        ])

        if (isMounted) {
          setState((prev) => ({
            ...prev,
            profileData: {
              firstName: profile.user.person.firstName || "",
              lastName: profile.user.person.lastName || "",
              email: profile.user.person.email || "",
              phone: profile.user.person.phoneNumber || "",
              location: profile.profile.location || "",
              position: profile.profile.position || "",
              bio: profile.profile.bio || "",
            },
            profilePicture: profile.user.person.profilePicture?.url || null,
            skills: Array.isArray(skills) ? skills : [],
            experiences: Array.isArray(experiences) ? experiences : [],
            formations: Array.isArray(formations) ? formations : [],
            certifications: [], // API doesn't seem to have certifications endpoint
            loading: false,
            error: null,
          }))
        }
      } catch (error) {
        if (isMounted) {
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
    }

    if (user) loadProfileData()
    else if (!authLoading) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Unauthorized",
      }))
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading, navigate])

  const handleSkillOperation = async (operation, skill = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      if (operation === "add") {
        if (!state.newSkill) return

        const existingSkill = state.skills.find((s) => s.name.toLowerCase() === state.newSkill.toLowerCase())
        if (existingSkill) {
          toast.error("This skill already exists in your profile")
          return
        }

        await userService.addUserSkill(user._id, {
          name: state.newSkill,
          level: state.skillLevel,
        })

        const newSkill = {
          _id: Date.now().toString(), // Temporary ID until refresh
          name: state.newSkill,
          level: state.skillLevel,
        }

        setState((prev) => ({
          ...prev,
          skills: [...prev.skills, newSkill],
          newSkill: "",
        }))
        toast.success("Skill added")
      }

      if (operation === "remove" && skill) {
        await userService.removeUserSkill(user._id, skill._id)

        setState((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s._id !== skill._id),
        }))
        toast.success("Skill removed")
      }

      if (operation === "update" && state.editingSkill) {
        await userService.updateUserSkill(user._id, state.editingSkill._id, {
          name: state.newSkill,
          level: state.skillLevel,
        })

        setState((prev) => ({
          ...prev,
          skills: prev.skills.map((s) =>
            s._id === state.editingSkill._id ? { ...s, name: state.newSkill, level: state.skillLevel } : s,
          ),
          newSkill: "",
          editingSkill: null,
          skillLevel: "Intermediate",
        }))
        toast.success("Skill updated")
      }

      if (operation === "edit" && skill) {
        setState((prev) => ({
          ...prev,
          newSkill: skill.name,
          skillLevel: skill.level || "Intermediate",
          editingSkill: skill,
        }))
      }

      if (operation === "cancel") {
        setState((prev) => ({
          ...prev,
          newSkill: "",
          editingSkill: null,
          skillLevel: "Intermediate",
        }))
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

  const handleExperienceOperation = async (operation, data = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      if (operation === "add") {
        const response = await userService.addExperience(user._id, data)

        setState((prev) => ({
          ...prev,
          experiences: [...prev.experiences, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Experience added")
      }

      if (operation === "update" && state.currentItem) {
        await userService.updateExperience(user._id, state.currentItem._id, data)

        setState((prev) => ({
          ...prev,
          experiences: prev.experiences.map((exp) => (exp._id === state.currentItem._id ? { ...exp, ...data } : exp)),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Experience updated")
      }

      if (operation === "delete" && data) {
        await userService.deleteExperience(user._id, data._id)

        setState((prev) => ({
          ...prev,
          experiences: prev.experiences.filter((exp) => exp._id !== data._id),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Experience deleted")
      }

      if (operation === "edit" && data) {
        setState((prev) => ({
          ...prev,
          activeDialog: "experience",
          currentItem: data,
        }))
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handleFormationOperation = async (operation, data = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      if (operation === "add") {
        const response = await userService.addFormation(user._id, data)

        setState((prev) => ({
          ...prev,
          formations: [...prev.formations, response],
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Education added")
      }

      if (operation === "update" && state.currentItem) {
        await userService.updateFormation(user._id, state.currentItem._id, data)

        setState((prev) => ({
          ...prev,
          formations: prev.formations.map((form) => (form._id === state.currentItem._id ? { ...form, ...data } : form)),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Education updated")
      }

      if (operation === "delete" && data) {
        await userService.deleteFormation(user._id, data._id)

        setState((prev) => ({
          ...prev,
          formations: prev.formations.filter((form) => form._id !== data._id),
          activeDialog: null,
          currentItem: null,
        }))
        toast.success("Education deleted")
      }

      if (operation === "edit" && data) {
        setState((prev) => ({
          ...prev,
          activeDialog: "education",
          currentItem: data,
        }))
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    }
  }

  const handleFileOperation = async (operation, file = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      setState((prev) => ({ ...prev, isUploading: true }))

      if (operation === "upload" && file) {
        const response = await userService.uploadProfilePicture(user._id, file)
        setState((prev) => ({
          ...prev,
          profilePicture: response.profilePicture?.url || null,
        }))
        toast.success("Profile picture updated")
      }

      if (operation === "delete") {
        await userService.deleteProfilePicture(user._id)
        setState((prev) => ({ ...prev, profilePicture: null }))
        toast.success("Profile picture deleted")
      }
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }

      if (operation === "upload" && user?.person?.profilePicture?.url) {
        setState((prev) => ({
          ...prev,
          profilePicture: user.person.profilePicture.url,
        }))
      }
    } finally {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        showDeleteDialog: false,
      }))
    }
  }

  const handleProfileUpdate = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to perform this action")
      return
    }

    try {
      setState((prev) => ({ ...prev, saving: true }))
      await userService.updateUserProfile(user._id, state.profileData)
      toast.success("Profile updated successfully")
    } catch (error) {
      if (error.message === "Unauthorized") {
        navigate("/login", {
          state: { from: "/profile", message: "Your session has expired. Please log in again." },
        })
      } else {
        toast.error(`Error: ${error.message}`)
      }
    } finally {
      setState((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setState((prev) => ({
      ...prev,
      profileData: { ...prev.profileData, [id]: value },
    }))
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">Complete your profile to get personalized job recommendations</p>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4 relative group cursor-pointer"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {state.profilePicture ? (
                      <img
                        src={state.profilePicture || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    {state.isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      if (file.size > 5 * 1024 * 1024) {
                        return toast.error("Maximum file size: 5MB")
                      }

                      const reader = new FileReader()
                      reader.onload = () => {
                        setState((prev) => ({
                          ...prev,
                          profilePicture: reader.result,
                        }))
                      }
                      reader.readAsDataURL(file)
                      await handleFileOperation("upload", file)
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current.click()}
                      disabled={state.isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                    {state.profilePicture && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: true }))}
                        disabled={state.isUploading}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First Name
                      </label>
                      <Input id="firstName" value={state.profileData.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </label>
                      <Input id="lastName" value={state.profileData.lastName} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input id="email" type="email" value={state.profileData.email} onChange={handleInputChange} />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <Input id="phone" value={state.profileData.phone} onChange={handleInputChange} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="location" className="text-sm font-medium">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          className="pl-9"
                          value={state.profileData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="position" className="text-sm font-medium">
                        Current Job Title
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="position"
                          className="pl-9"
                          value={state.profileData.position}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </label>
                    <Textarea
                      id="bio"
                      value={state.profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about your professional experience, skills, and career goals..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={handleProfileUpdate}
                  disabled={state.saving}
                >
                  {state.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Technical Skills</h2>
              <p className="text-gray-600 mb-6">
                Add your skills to help us match you with relevant job opportunities. Our AI will analyze your skills to
                provide personalized recommendations.
              </p>

              <div className="flex flex-col md:flex-row gap-2 mb-6">
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
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={state.skillLevel}
                    onValueChange={(value) => setState((prev) => ({ ...prev, skillLevel: value }))}
                  >
                    <SelectTrigger>
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
                        className="bg-green-600 hover:bg-green-700"
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
                    <Button onClick={() => handleSkillOperation("add")} className="bg-purple-700 hover:bg-purple-800">
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
                    variant="secondary"
                    className="px-3 py-1.5 text-sm group relative bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200 hover:from-purple-200 hover:to-purple-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{skill.name}</span>
                      {skill.level && (
                        <span className="text-xs px-1.5 py-0.5 bg-white text-purple-800 rounded-full border border-purple-200">
                          {skill.level}
                        </span>
                      )}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSkillOperation("edit", skill)}
                        className="p-1 text-purple-600 hover:text-purple-800"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleSkillOperation("remove", skill)}
                        className="p-1 text-purple-600 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </Badge>
                ))}
                {state.skills.length === 0 && (
                  <div className="w-full text-center py-6 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-sm">No skills added yet. Add your first skill above.</p>
                  </div>
                )}
              </div>

              <h3 className="text-lg font-medium mb-3">Suggested Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {["TypeScript", "Express.js", "GraphQL", "Docker", "AWS"].map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 flex items-center gap-1"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        newSkill: skill,
                        skillLevel: "Intermediate",
                      }))
                    }
                  >
                    {skill}
                    <PlusCircle className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Professional Experience</h2>
                  <p className="text-gray-600 mt-1">
                    Add your work history to help us match you with relevant job opportunities.
                  </p>
                </div>
                <Dialog
                  open={state.activeDialog === "experience"}
                  onOpenChange={(open) =>
                    setState((prev) => ({
                      ...prev,
                      activeDialog: open ? "experience" : null,
                      currentItem: open ? prev.currentItem : null,
                    }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() => setState((prev) => ({ ...prev, activeDialog: "experience", currentItem: null }))}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                    <DialogHeader className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                      <DialogTitle className="text-purple-800 text-xl">
                        {state.currentItem ? "Edit Experience" : "Add New Experience"}
                      </DialogTitle>
                      <DialogDescription className="text-purple-700/70">
                        Add details about your work experience
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                      <ExperienceForm
                        experience={state.currentItem}
                        onSubmit={(data) => {
                          if (state.currentItem) {
                            handleExperienceOperation("update", data)
                          } else {
                            handleExperienceOperation("add", data)
                          }
                        }}
                        onCancel={() => setState((prev) => ({ ...prev, activeDialog: null, currentItem: null }))}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {state.experiences.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No experience added yet</h3>
                  <p className="text-gray-500 mb-4">Add your work history to improve your profile</p>
                  <Button
                    variant="outline"
                    className="border-purple-700 text-purple-700 hover:bg-purple-50"
                    onClick={() => setState((prev) => ({ ...prev, activeDialog: "experience", currentItem: null }))}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.experiences.map((experience) => (
                    <Card
                      key={experience._id}
                      className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-purple-900">{experience.position}</CardTitle>
                            <CardDescription className="text-base font-medium text-purple-700">
                              {experience.company}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-purple-600"
                              onClick={() => handleExperienceOperation("edit", experience)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
                              onClick={() => handleExperienceOperation("delete", experience)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
                          </span>
                          {experience.location && (
                            <>
                              <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{experience.location}</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{experience.description}</p>

                        {experience.skills && experience.skills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {experience.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Education</h2>
                  <p className="text-gray-600 mt-1">Add your educational background to enhance your profile</p>
                </div>
                <Dialog
                  open={state.activeDialog === "education"}
                  onOpenChange={(open) =>
                    setState((prev) => ({
                      ...prev,
                      activeDialog: open ? "education" : null,
                      currentItem: open ? prev.currentItem : null,
                    }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() => setState((prev) => ({ ...prev, activeDialog: "education", currentItem: null }))}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                    <DialogHeader className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                      <DialogTitle className="text-purple-800 text-xl">
                        {state.currentItem ? "Edit Education" : "Add New Education"}
                      </DialogTitle>
                      <DialogDescription className="text-purple-700/70">
                        Add details about your educational background
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                      <EducationForm
                        education={state.currentItem}
                        onSubmit={(data) => {
                          if (state.currentItem) {
                            handleFormationOperation("update", data)
                          } else {
                            handleFormationOperation("add", data)
                          }
                        }}
                        onCancel={() => setState((prev) => ({ ...prev, activeDialog: null, currentItem: null }))}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {state.formations.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No education added yet</h3>
                  <p className="text-gray-500 mb-4">Add your educational background to improve your profile</p>
                  <Button
                    variant="outline"
                    className="border-purple-700 text-purple-700 hover:bg-purple-50"
                    onClick={() => setState((prev) => ({ ...prev, activeDialog: "education", currentItem: null }))}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.formations.map((education) => (
                    <Card
                      key={education._id}
                      className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-blue-900">{education.degree}</CardTitle>
                            <CardDescription className="text-base font-medium text-blue-700">
                              {education.institution}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-blue-600"
                              onClick={() => handleFormationOperation("edit", education)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
                              onClick={() => handleFormationOperation("delete", education)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {formatDate(education.startDate)} - {formatDate(education.endDate)}
                          </span>
                          {education.location && (
                            <>
                              <span className="mx-2">•</span>
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{education.location}</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{education.description}</p>

                        {education.fieldOfStudy && (
                          <div className="mt-3">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {education.fieldOfStudy}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Certifications</h2>
                  <p className="text-gray-600 mt-1">Add your professional certifications to showcase your expertise</p>
                </div>
                <Dialog
                  open={state.activeDialog === "certification"}
                  onOpenChange={(open) =>
                    setState((prev) => ({
                      ...prev,
                      activeDialog: open ? "certification" : null,
                      currentItem: open ? prev.currentItem : null,
                    }))
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={() =>
                        setState((prev) => ({ ...prev, activeDialog: "certification", currentItem: null }))
                      }
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                    <DialogHeader className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                      <DialogTitle className="text-purple-800 text-xl">
                        {state.currentItem ? "Edit Certification" : "Add New Certification"}
                      </DialogTitle>
                      <DialogDescription className="text-purple-700/70">
                        Add details about your professional certification
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                      <CertificationForm
                        certification={state.currentItem}
                        onSubmit={(data) => {
                          // Note: API doesn't seem to have certification endpoints
                          // This is a placeholder for future implementation
                          setState((prev) => ({
                            ...prev,
                            certifications: state.currentItem
                              ? prev.certifications.map((cert) => (cert.id === state.currentItem.id ? data : cert))
                              : [...prev.certifications, { ...data, id: Date.now().toString() }],
                            activeDialog: null,
                            currentItem: null,
                          }))
                          toast.success(state.currentItem ? "Certification updated" : "Certification added")
                        }}
                        onCancel={() => setState((prev) => ({ ...prev, activeDialog: null, currentItem: null }))}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {state.certifications.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No certifications added yet</h3>
                  <p className="text-gray-500 mb-4">Add your professional certifications to showcase your expertise</p>
                  <Button
                    variant="outline"
                    className="border-purple-700 text-purple-700 hover:bg-purple-50"
                    onClick={() => setState((prev) => ({ ...prev, activeDialog: "certification", currentItem: null }))}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.certifications.map((certification) => (
                    <Card
                      key={certification.id}
                      className="overflow-hidden border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-green-900">{certification.name}</CardTitle>
                            <CardDescription className="text-base font-medium text-green-700">
                              {certification.issuer}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-green-600"
                              onClick={() =>
                                setState((prev) => ({
                                  ...prev,
                                  activeDialog: "certification",
                                  currentItem: certification,
                                }))
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
                              onClick={() => {
                                setState((prev) => ({
                                  ...prev,
                                  certifications: prev.certifications.filter((cert) => cert.id !== certification.id),
                                }))
                                toast.success("Certification deleted")
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            Issued: {formatDate(certification.issueDate)}
                            {certification.expirationDate && ` • Expires: ${formatDate(certification.expirationDate)}`}
                          </span>
                        </div>
                        {certification.credentialId && (
                          <div className="text-sm text-gray-500 mb-3">
                            <span className="font-medium">Credential ID:</span> {certification.credentialId}
                          </div>
                        )}
                        {certification.description && (
                          <p className="text-gray-700 text-sm leading-relaxed">{certification.description}</p>
                        )}
                        {certification.credentialURL && (
                          <div className="mt-3">
                            <a
                              href={certification.credentialURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-green-600 hover:text-green-800"
                            >
                              <Award className="h-4 w-4 mr-1" />
                              View Credential
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog
          open={state.showDeleteDialog}
          onOpenChange={(open) => setState((prev) => ({ ...prev, showDeleteDialog: open }))}
        >
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white border shadow-lg">
            <DialogHeader className="bg-red-50 px-6 py-4 border-b border-red-100">
              <DialogTitle className="text-red-800 text-xl">Delete Profile Picture</DialogTitle>
              <DialogDescription className="text-red-700/70">
                Are you sure you want to delete your profile picture? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4">
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: false }))}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleFileOperation("delete")}
                  disabled={state.isUploading}
                >
                  {state.isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {state.isUploading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ExperienceForm({ experience, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    position: experience?.position || "",
    company: experience?.company || "",
    location: experience?.location || "",
    startDate: experience?.startDate ? new Date(experience.startDate).toISOString().split("T")[0] : "",
    endDate: experience?.endDate ? new Date(experience.endDate).toISOString().split("T")[0] : "",
    description: experience?.description || "",
    skills: experience?.skills?.join(", ") || "",
    current: experience?.endDate ? false : true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "current" && checked ? { endDate: "" } : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const skills = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)

      await onSubmit({
        ...formData,
        skills,
        endDate: formData.current ? null : formData.endDate,
      })
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save experience"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position" className="text-sm font-medium text-gray-700">
            Job Title *
          </Label>
          <Input
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-sm font-medium text-gray-700">
            Company *
          </Label>
          <Input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
            Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="pl-9 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              Start Date *
            </Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={formData.current}
              className={`border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${formData.current ? "bg-gray-100 text-gray-500" : ""}`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="current"
            name="current"
            checked={formData.current}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                current: checked,
                endDate: checked ? "" : prev.endDate,
              }))
            }}
            className="data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="current" className="text-sm font-medium text-gray-700">
            I currently work here
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="Describe your responsibilities and achievements..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills" className="text-sm font-medium text-gray-700">
            Skills (comma separated)
          </Label>
          <Input
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="React, JavaScript, Project Management"
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {experience ? "Update Experience" : "Add Experience"}
        </Button>
      </div>
    </form>
  )
}

function EducationForm({ education, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    institution: education?.institution || "",
    degree: education?.degree || "",
    fieldOfStudy: education?.fieldOfStudy || "",
    location: education?.location || "",
    startDate: education?.startDate ? new Date(education.startDate).toISOString().split("T")[0] : "",
    endDate: education?.endDate ? new Date(education.endDate).toISOString().split("T")[0] : "",
    description: education?.description || "",
    current: education?.endDate ? false : true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "current" && checked ? { endDate: "" } : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        ...formData,
        endDate: formData.current ? null : formData.endDate,
      })
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save education"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
            Institution *
          </Label>
          <Input
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree" className="text-sm font-medium text-gray-700">
            Degree *
          </Label>
          <Input
            id="degree"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy" className="text-sm font-medium text-gray-700">
            Field of Study
          </Label>
          <Input
            id="fieldOfStudy"
            name="fieldOfStudy"
            value={formData.fieldOfStudy}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-gray-700">
            Location
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="pl-9 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              Start Date *
            </Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              disabled={formData.current}
              className={`border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${formData.current ? "bg-gray-100 text-gray-500" : ""}`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="current"
            name="current"
            checked={formData.current}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                current: checked,
                endDate: checked ? "" : prev.endDate,
              }))
            }}
            className="data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="current" className="text-sm font-medium text-gray-700">
            I'm currently studying here
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="Describe your studies, achievements, and activities..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {education ? "Update Education" : "Add Education"}
        </Button>
      </div>
    </form>
  )
}

function CertificationForm({ certification, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: certification?.name || "",
    issuer: certification?.issuer || "",
    issueDate: certification?.issueDate ? new Date(certification.issueDate).toISOString().split("T")[0] : "",
    expirationDate: certification?.expirationDate
      ? new Date(certification.expirationDate).toISOString().split("T")[0]
      : "",
    credentialId: certification?.credentialId || "",
    credentialURL: certification?.credentialURL || "",
    description: certification?.description || "",
    noExpiration: certification?.expirationDate ? false : true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "noExpiration" && checked ? { expirationDate: "" } : {}),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        ...formData,
        expirationDate: formData.noExpiration ? null : formData.expirationDate,
      })
    } catch (error) {
      toast.error(`Error: ${error.message || "Failed to save certification"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Certification Name *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuer" className="text-sm font-medium text-gray-700">
            Issuing Organization *
          </Label>
          <Input
            id="issuer"
            name="issuer"
            value={formData.issuer}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issueDate" className="text-sm font-medium text-gray-700">
              Issue Date *
            </Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={handleChange}
              className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="text-sm font-medium text-gray-700">
              Expiration Date
            </Label>
            <Input
              id="expirationDate"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleChange}
              disabled={formData.noExpiration}
              className={`border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${formData.noExpiration ? "bg-gray-100 text-gray-500" : ""}`}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Switch
            id="noExpiration"
            name="noExpiration"
            checked={formData.noExpiration}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({
                ...prev,
                noExpiration: checked,
                expirationDate: checked ? "" : prev.expirationDate,
              }))
            }}
            className="data-[state=checked]:bg-purple-600"
          />
          <Label htmlFor="noExpiration" className="text-sm font-medium text-gray-700">
            This certification does not expire
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credentialId" className="text-sm font-medium text-gray-700">
            Credential ID
          </Label>
          <Input
            id="credentialId"
            name="credentialId"
            value={formData.credentialId}
            onChange={handleChange}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="credentialURL" className="text-sm font-medium text-gray-700">
            Credential URL
          </Label>
          <Input
            id="credentialURL"
            name="credentialURL"
            type="url"
            value={formData.credentialURL}
            onChange={handleChange}
            placeholder="https://example.com/verify/credential"
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            placeholder="Describe what you learned and the skills you gained..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {certification ? "Update Certification" : "Add Certification"}
        </Button>
      </div>
    </form>
  )
}

export default ProfilePage

