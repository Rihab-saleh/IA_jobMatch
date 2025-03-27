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

  const [completionPercentage, setCompletionPercentage] = useState(0)

  const calculateProfileCompletion = () => {
    let total = 0

    // Personal Info (30%)
    if (state.profileData.firstName) total += 5
    if (state.profileData.lastName) total += 5
    if (state.profileData.email) total += 5
    if (state.profileData.phone) total += 3
    if (state.profileData.location) total += 3
    if (state.profileData.position) total += 3
    if (state.profileData.bio) total += 3
    if (state.profilePicture) total += 3

    // Skills (20%)
    if (state.skills.length >= 3) {
      total += 20
    } else {
      total += (state.skills.length / 3) * 20
    }

    // Experience (25%)
    if (state.experiences.length > 0) total += 25

    // Education (15%)
    if (state.formations.length > 0) total += 15

    // Certifications (10%)
    if (state.certifications.length > 0) total += 10

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
    state.certifications
  ])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login")
    }

    if (user) {
      loadProfileData()
    }
  }, [user, authLoading])

  const loadProfileData = async () => {
    try {
      const profileData = await userService.getProfile(user._id)
      setState((prev) => ({
        ...prev,
        profileData: {
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          location: profileData.location || "",
          position: profileData.position || "",
          bio: profileData.bio || "",
        },
        profilePicture: profileData.profilePicture || null,
        skills: profileData.skills || [],
        experiences: profileData.experiences || [],
        formations: profileData.education || [],
        certifications: profileData.certifications || [],
        loading: false,
      }))
    } catch (error) {
      console.error("Failed to load profile data:", error)
      setState((prev) => ({ ...prev, error: "Failed to load profile data", loading: false }))
    }
  }

  const handleSkillOperation = (operation, skill = null) => {
    switch (operation) {
      case "add":
        if (state.newSkill.trim() === "") {
          toast.error("Please enter a skill name")
          return
        }
        setState((prev) => ({
          ...prev,
          skills: [...prev.skills, { _id: Date.now().toString(), name: prev.newSkill, level: prev.skillLevel }],
          newSkill: "",
          skillLevel: "Intermediate",
        }))
        toast.success("Skill added successfully")
        break
      case "edit":
        setState((prev) => ({
          ...prev,
          newSkill: skill.name,
          skillLevel: skill.level,
          editingSkill: skill._id,
        }))
        break
      case "update":
        setState((prev) => ({
          ...prev,
          skills: prev.skills.map((s) =>
            s._id === prev.editingSkill
              ? { ...s, name: prev.newSkill, level: prev.skillLevel }
              : s
          ),
          newSkill: "",
          skillLevel: "Intermediate",
          editingSkill: null,
        }))
        toast.success("Skill updated successfully")
        break
      case "remove":
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
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB")
      return
    }

    setState((prev) => ({ ...prev, isUploading: true }))

    try {
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const imageUrl = URL.createObjectURL(file)
      setState((prev) => ({ ...prev, profilePicture: imageUrl, isUploading: false }))
      toast.success("Profile picture updated successfully")
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      setState((prev) => ({ ...prev, isUploading: false }))
      toast.error("Failed to upload profile picture")
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const saveProfile = async () => {
    setState((prev) => ({ ...prev, saving: true }))
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error saving profile:", error)
      toast.error("Failed to update profile")
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

  const handleExperienceSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const experience = {
      _id: state.currentItem?._id || Date.now().toString(),
      company: formData.get("company"),
      position: formData.get("position"),
      location: formData.get("location"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      current: formData.get("current") === "on",
      description: formData.get("description"),
    }

    setState((prev) => ({
      ...prev,
      experiences: state.currentItem
        ? prev.experiences.map((exp) => (exp._id === state.currentItem._id ? experience : exp))
        : [...prev.experiences, experience],
      activeDialog: null,
      currentItem: null,
    }))

    toast.success(`Experience ${state.currentItem ? "updated" : "added"} successfully`)
  }

  const handleEducationSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const education = {
      _id: state.currentItem?._id || Date.now().toString(),
      institution: formData.get("institution"),
      degree: formData.get("degree"),
      fieldOfStudy: formData.get("fieldOfStudy"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      current: formData.get("current") === "on",
      description: formData.get("description"),
    }

    setState((prev) => ({
      ...prev,
      formations: state.currentItem
        ? prev.formations.map((edu) => (edu._id === state.currentItem._id ? education : edu))
        : [...prev.formations, education],
      activeDialog: null,
      currentItem: null,
    }))

    toast.success(`Education ${state.currentItem ? "updated" : "added"} successfully`)
  }

  const handleCertificationSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const certification = {
      _id: state.currentItem?._id || Date.now().toString(),
      name: formData.get("name"),
      issuingOrganization: formData.get("issuingOrganization"),
      issueDate: formData.get("issueDate"),
      expirationDate: formData.get("expirationDate"),
      credentialId: formData.get("credentialId"),
      credentialUrl: formData.get("credentialUrl"),
    }

    setState((prev) => ({
      ...prev,
      certifications: state.currentItem
        ? prev.certifications.map((cert) => (cert._id === state.currentItem._id ? certification : cert))
        : [...prev.certifications, certification],
      activeDialog: null,
      currentItem: null,
    }))

    toast.success(`Certification ${state.currentItem ? "updated" : "added"} successfully`)
  }

  const deleteItem = (type, id) => {
    switch (type) {
      case "experience":
        setState((prev) => ({
          ...prev,
          experiences: prev.experiences.filter((exp) => exp._id !== id),
        }))
        break
      case "education":
        setState((prev) => ({
          ...prev,
          formations: prev.formations.filter((edu) => edu._id !== id),
        }))
        break
      case "certification":
        setState((prev) => ({
          ...prev,
          certifications: prev.certifications.filter((cert) => cert._id !== id),
        }))
        break
      default:
        break
    }
    setState((prev) => ({ ...prev, showDeleteDialog: false, currentItem: null }))
    toast.success("Item deleted successfully")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-1/3">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {state.profilePicture ? (
                      <img
                        src={state.profilePicture}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-md">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={triggerFileInput}
                      className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
                    >
                      {state.isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-center">
                    {state.profileData.firstName} {state.profileData.lastName}
                  </h2>
                  {state.profileData.position && (
                    <p className="text-gray-600 text-center">{state.profileData.position}</p>
                  )}
                  {state.profileData.location && (
                    <div className="flex items-center text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{state.profileData.location}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <span className="text-sm font-semibold">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Personal Info</span>
                    {Object.values(state.profileData).some((val) => val) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Skills ({state.skills.length})</span>
                    {state.skills.length >= 3 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Experience</span>
                    {state.experiences.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Education</span>
                    {state.formations.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certifications</span>
                    {state.certifications.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                <Button
                  onClick={saveProfile}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                  disabled={state.saving}
                >
                  {state.saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="w-full md:w-2/3">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information. This will be used to personalize your experience.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={state.profileData.firstName}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={state.profileData.lastName}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={state.profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={state.profileData.phone}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          name="location"
                          value={state.profileData.location}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          name="position"
                          value={state.profileData.position}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={state.profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Skills</CardTitle>
                    <CardDescription>
                      Add your skills to help us match you with relevant job opportunities. Our AI will analyze your
                      skills to provide personalized recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                          <Button
                            onClick={() => handleSkillOperation("add")}
                            className="bg-purple-700 hover:bg-purple-800"
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
                          className="px-3 py-1.5 text-sm flex items-center gap-2 bg-white hover:bg-gray-50"
                        >
                          <span>{skill.name}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                            {skill.level}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSkillOperation("edit", skill)}
                              className="text-gray-500 hover:text-purple-600"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleSkillOperation("remove", skill)}
                              className="text-gray-500 hover:text-red-600"
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Work Experience</CardTitle>
                        <CardDescription>
                          Add your work experience to showcase your professional background.
                        </CardDescription>
                      </div>
                      <Button onClick={() => openDialog("experience")} className="bg-purple-700 hover:bg-purple-800">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {state.experiences.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <Briefcase className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No experience added</h3>
                        <p className="text-gray-500 mb-4">Add your work experience to showcase your background</p>
                        <Button onClick={() => openDialog("experience")} className="bg-purple-700 hover:bg-purple-800">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.experiences.map((exp) => (
                          <div
                            key={exp._id}
                            className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium">{exp.position}</h3>
                                <p className="text-gray-600">{exp.company}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{exp.location}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDialog("experience", exp)}
                                >
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
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {exp.description && (
                              <p className="mt-2 text-gray-700 text-sm">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Education</CardTitle>
                        <CardDescription>
                          Add your education history to showcase your academic background.
                        </CardDescription>
                      </div>
                      <Button onClick={() => openDialog("education")} className="bg-purple-700 hover:bg-purple-800">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {state.formations.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <GraduationCap className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No education added</h3>
                        <p className="text-gray-500 mb-4">Add your education history to showcase your background</p>
                        <Button onClick={() => openDialog("education")} className="bg-purple-700 hover:bg-purple-800">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {state.formations.map((edu) => (
                          <div
                            key={edu._id}
                            className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium">{edu.degree}</h3>
                                <p className="text-gray-600">{edu.institution}</p>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <span>{edu.fieldOfStudy}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDialog("education", edu)}
                                >
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
                                    }))
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {edu.description && (
                              <p className="mt-2 text-gray-700 text-sm">{edu.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Certifications</CardTitle>
                        <CardDescription>
                          Add your professional certifications to showcase your expertise.
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => openDialog("certification")}
                        className="bg-purple-700 hover:bg-purple-800"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {state.certifications.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <Award className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-900">No certifications added</h3>
                        <p className="text-gray-500 mb-4">Add your professional certifications to showcase your expertise</p>
                        <Button
                          onClick={() => openDialog("certification")}
                          className="bg-purple-700 hover:bg-purple-800"
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
                            className="border rounded-lg p-4 hover:border-gray-400 transition-colors"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-medium">{cert.name}</h3>
                                <p className="text-gray-600">{cert.issuingOrganization}</p>
                                {cert.credentialId && (
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <span>ID: {cert.credentialId}</span>
                                  </div>
                                )}
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>
                                    Issued: {cert.issueDate}
                                    {cert.expirationDate && ` - Expires: ${cert.expirationDate}`}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDialog("certification", cert)}
                                >
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {state.currentItem ? "Edit Work Experience" : "Add Work Experience"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details of your work experience. This will help employers understand your background.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleExperienceSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      defaultValue={state.currentItem?.company || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      defaultValue={state.currentItem?.position || ""}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={state.currentItem?.location || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current">Currently Working</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="current"
                        name="current"
                        defaultChecked={state.currentItem?.current || false}
                      />
                      <Label htmlFor="current">
                        {state.currentItem?.current ? "Yes" : "No"}
                      </Label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={state.currentItem?.startDate || ""}
                      required
                    />
                  </div>
                  {!state.currentItem?.current && (
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        defaultValue={state.currentItem?.endDate || ""}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={state.currentItem?.description || ""}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Education Dialog */}
        <Dialog open={state.activeDialog === "education"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {state.currentItem ? "Edit Education" : "Add Education"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details of your education. This will help employers understand your academic background.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEducationSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      name="institution"
                      defaultValue={state.currentItem?.institution || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      name="degree"
                      defaultValue={state.currentItem?.degree || ""}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input
                    id="fieldOfStudy"
                    name="fieldOfStudy"
                    defaultValue={state.currentItem?.fieldOfStudy || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={state.currentItem?.startDate || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current">Currently Studying</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="current"
                        name="current"
                        defaultChecked={state.currentItem?.current || false}
                      />
                      <Label htmlFor="current">
                        {state.currentItem?.current ? "Yes" : "No"}
                      </Label>
                    </div>
                  </div>
                </div>
                {!state.currentItem?.current && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={state.currentItem?.endDate || ""}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={state.currentItem?.description || ""}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Certification Dialog */}
        <Dialog open={state.activeDialog === "certification"} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {state.currentItem ? "Edit Certification" : "Add Certification"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details of your professional certification. This will help showcase your expertise.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCertificationSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Certification Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={state.currentItem?.name || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issuingOrganization">Issuing Organization</Label>
                  <Input
                    id="issuingOrganization"
                    name="issuingOrganization"
                    defaultValue={state.currentItem?.issuingOrganization || ""}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      defaultValue={state.currentItem?.issueDate || ""}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date (if applicable)</Label>
                    <Input
                      id="expirationDate"
                      name="expirationDate"
                      type="date"
                      defaultValue={state.currentItem?.expirationDate || ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credentialId">Credential ID (if applicable)</Label>
                    <Input
                      id="credentialId"
                      name="credentialId"
                      defaultValue={state.currentItem?.credentialId || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credentialUrl">Credential URL (if applicable)</Label>
                    <Input
                      id="credentialUrl"
                      name="credentialUrl"
                      type="url"
                      defaultValue={state.currentItem?.credentialUrl || ""}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={state.showDeleteDialog}
          onOpenChange={(open) => setState((prev) => ({ ...prev, showDeleteDialog: open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the selected item.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setState((prev) => ({ ...prev, showDeleteDialog: false }))}
              >
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
                    }
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default ProfilePage