"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  PlusCircle,
  Download,
  FileText,
  Edit,
  Trash2,
  Upload,
  Sparkles,
  Loader2,
  Save,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  X,
  Link,
  Globe,
} from "lucide-react"
import { userService } from "../services/user-service"
import { useAuth } from "../contexts/auth-context"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"
import ResumeTemplate from "./resume-template"
import { formatDate, formatDateForAPI } from "../lib/date-utils"
import html2pdf from "html2pdf.js"

export default function CVBuilderPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const resumeRef = useRef(null)

  const [activeTemplate, setActiveTemplate] = useState("modern")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeDialog, setActiveDialog] = useState(null)
  const [currentItem, setCurrentItem] = useState(null)
  const [newSkill, setNewSkill] = useState("")
  const [previewMode, setPreviewMode] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    professionalTitle: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    linkedin: "",
  })

  const [workExperience, setWorkExperience] = useState([])
  const [education, setEducation] = useState([])
  const [skills, setSkills] = useState([])
  const [languages, setLanguages] = useState([
    { name: "English", level: "Proficient" },
    { name: "French", level: "Advanced" },
    { name: "Arabic", level: "Native" },
  ])
  const [training, setTraining] = useState([])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", {
        state: { from: "/cv-builder", message: "Please log in to access the CV Builder" },
      })
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    let isMounted = true

    const loadUserData = async () => {
      try {
        if (!user || !user._id) {
          setLoading(false)
          return
        }

        const [profile, skills, experiences, formations] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id).catch(() => []),
          userService.getExperiences(user._id).catch(() => []),
          userService.getFormations(user._id).catch(() => []),
        ])

        if (isMounted) {
          // Set personal info
          setPersonalInfo({
            firstName: profile.user.person.firstName || "",
            lastName: profile.user.person.lastName || "",
            professionalTitle: profile.profile.jobTitle || "",
            email: profile.user.person.email || "",
            phone: profile.user.person.phoneNumber || "",
            location: profile.profile.location || "",
            summary: profile.profile.bio || "",
            linkedin: profile.profile.socialLinks?.linkedin || "",
          })

          // Set skills
          setSkills(Array.isArray(skills) ? skills.map((skill) => skill.name) : [])

          // Set work experience
          setWorkExperience(
            Array.isArray(experiences)
              ? experiences.map((exp) => ({
                  id: exp._id,
                  title: exp.title || "",
                  company: exp.company || "",
                  location: exp.location || "",
                  startDate: formatDate(exp.startDate),
                  endDate: exp.endDate ? formatDate(exp.endDate) : "Present",
                  description: exp.description || "",
                  skills: exp.skills || [],
                }))
              : [],
          )

          // Set education
          setEducation(
            Array.isArray(formations)
              ? formations.map((edu) => ({
                  id: edu._id,
                  degree: edu.degree || "",
                  institution: edu.institution || "",
                  location: edu.location || "",
                  startDate: formatDate(edu.startDate),
                  endDate: edu.endDate ? formatDate(edu.endDate) : "Present",
                  description: edu.description || "",
                  fieldOfStudy: edu.fieldOfStudy || "",
                }))
              : [],
          )

          // Set sample training courses if none exist
          if (!training.length) {
            setTraining([
              { name: "Vue.js Training", institution: "Advancia Training Center Tunis" },
              { name: "NestJs Training", institution: "Clevory Training Center Tunis" },
              { name: "Full-Stack Javascript (MERN)", institution: "GoMyCode" },
            ])
          }

          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading user data:", error)
          toast.error("Failed to load your profile data. Please try again.")
          setLoading(false)
        }
      }
    }

    if (user) {
      loadUserData()
    } else if (!authLoading) {
      setLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [user, authLoading])

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setPersonalInfo({
      ...personalInfo,
      [name]: value,
    })
  }

  const savePersonalInfo = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to save your CV")
      return
    }

    try {
      setSaving(true)

      await userService.updateUserProfile(user._id, {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email,
        phoneNumber: personalInfo.phone,
        jobTitle: personalInfo.professionalTitle,
        location: personalInfo.location,
        bio: personalInfo.summary,
        socialLinks: {
          linkedin: personalInfo.linkedin,
        },
      })

      toast.success("Personal information saved successfully")
    } catch (error) {
      console.error("Error saving personal info:", error)
      toast.error("Failed to save personal information")
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to add skills")
      return
    }

    if (!newSkill.trim()) {
      return
    }

    if (skills.includes(newSkill.trim())) {
      toast.error("This skill already exists in your profile")
      return
    }

    try {
      setSaving(true)

      await userService.addUserSkill(user._id, {
        name: newSkill.trim(),
        level: "Intermediate", // Default level
      })

      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
      toast.success("Skill added successfully")
    } catch (error) {
      console.error("Error adding skill:", error)
      toast.error("Failed to add skill")
    } finally {
      setSaving(false)
    }
  }

  const removeSkill = async (skillToRemove) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to remove skills")
      return
    }

    try {
      setSaving(true)

      // Find the skill ID from the user's skills
      const userSkills = await userService.getUserSkills(user._id)
      const skillToDelete = userSkills.find((s) => s.name === skillToRemove)

      if (skillToDelete && skillToDelete._id) {
        await userService.removeUserSkill(user._id, skillToDelete._id)
        setSkills(skills.filter((skill) => skill !== skillToRemove))
        toast.success("Skill removed successfully")
      } else {
        toast.error("Skill not found in your profile")
      }
    } catch (error) {
      console.error("Error removing skill:", error)
      toast.error("Failed to remove skill")
    } finally {
      setSaving(false)
    }
  }

  const handleExperienceOperation = async (operation, data = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to manage work experience")
      return
    }

    try {
      setSaving(true)

      if (operation === "add") {
        const apiData = {
          title: data.title,
          company: data.company,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? null : formatDateForAPI(data.endDate),
          description: data.description,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        }

        const response = await userService.addExperience(user._id, apiData)

        setWorkExperience([
          ...workExperience,
          {
            id: response._id,
            title: response.title,
            company: response.company,
            location: response.location,
            startDate: formatDate(response.startDate),
            endDate: response.endDate ? formatDate(response.endDate) : "Present",
            description: response.description,
            skills: response.skills || [],
          },
        ])

        toast.success("Work experience added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          title: data.title,
          company: data.company,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? null : formatDateForAPI(data.endDate),
          description: data.description,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        }

        await userService.updateExperience(user._id, currentItem.id, apiData)

        setWorkExperience(
          workExperience.map((exp) =>
            exp.id === currentItem.id
              ? {
                  ...exp,
                  title: data.title,
                  company: data.company,
                  location: data.location,
                  startDate: data.startDate,
                  endDate: data.current ? "Present" : data.endDate,
                  description: data.description,
                  skills: apiData.skills,
                }
              : exp,
          ),
        )

        toast.success("Work experience updated successfully")
      }

      if (operation === "delete" && data) {
        await userService.deleteExperience(user._id, data.id)
        setWorkExperience(workExperience.filter((exp) => exp.id !== data.id))
        toast.success("Work experience deleted successfully")
      }
    } catch (error) {
      console.error("Error managing work experience:", error)
      toast.error(`Failed to ${operation} work experience`)
    } finally {
      setSaving(false)
      setActiveDialog(null)
      setCurrentItem(null)
    }
  }

  const handleEducationOperation = async (operation, data = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to manage education")
      return
    }

    try {
      setSaving(true)

      if (operation === "add") {
        const apiData = {
          degree: data.degree,
          institution: data.institution,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? null : formatDateForAPI(data.endDate),
          description: data.description,
          fieldOfStudy: data.fieldOfStudy,
        }

        const response = await userService.addFormation(user._id, apiData)

        setEducation([
          ...education,
          {
            id: response._id,
            degree: response.degree,
            institution: response.institution,
            location: response.location,
            startDate: formatDate(response.startDate),
            endDate: response.endDate ? formatDate(response.endDate) : "Present",
            description: response.description,
            fieldOfStudy: response.fieldOfStudy,
          },
        ])

        toast.success("Education added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          degree: data.degree,
          institution: data.institution,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? null : formatDateForAPI(data.endDate),
          description: data.description,
          fieldOfStudy: data.fieldOfStudy,
        }

        await userService.updateFormation(user._id, currentItem.id, apiData)

        setEducation(
          education.map((edu) =>
            edu.id === currentItem.id
              ? {
                  ...edu,
                  degree: data.degree,
                  institution: data.institution,
                  location: data.location,
                  startDate: data.startDate,
                  endDate: data.current ? "Present" : data.endDate,
                  description: data.description,
                  fieldOfStudy: data.fieldOfStudy,
                }
              : edu,
          ),
        )

        toast.success("Education updated successfully")
      }

      if (operation === "delete" && data) {
        await userService.deleteFormation(user._id, data.id)
        setEducation(education.filter((edu) => edu.id !== data.id))
        toast.success("Education deleted successfully")
      }
    } catch (error) {
      console.error("Error managing education:", error)
      toast.error(`Failed to ${operation} education`)
    } finally {
      setSaving(false)
      setActiveDialog(null)
      setCurrentItem(null)
    }
  }

  const handleTrainingOperation = (operation, data = null, index = null) => {
    if (operation === "add") {
      setTraining([...training, { name: data.name, institution: data.institution }])
    } else if (operation === "update" && index !== null) {
      const updatedTraining = [...training]
      updatedTraining[index] = { name: data.name, institution: data.institution }
      setTraining(updatedTraining)
    } else if (operation === "delete" && index !== null) {
      setTraining(training.filter((_, i) => i !== index))
    }
  }

  const handleLanguageOperation = (operation, data = null, index = null) => {
    if (operation === "add") {
      setLanguages([...languages, { name: data.name, level: data.level }])
    } else if (operation === "update" && index !== null) {
      const updatedLanguages = [...languages]
      updatedLanguages[index] = { name: data.name, level: data.level }
      setLanguages(updatedLanguages)
    } else if (operation === "delete" && index !== null) {
      setLanguages(languages.filter((_, i) => i !== index))
    }
  }

  const generatePDF = async () => {
    if (!resumeRef.current) return

    try {
      setGeneratingPdf(true)

      // Create a temporary div with proper styling for PDF generation
      const tempDiv = document.createElement("div")
      tempDiv.style.width = "100%"
      tempDiv.style.padding = "20px"
      tempDiv.style.backgroundColor = "white"

      // Clone the resume content
      const resumeContent = resumeRef.current.cloneNode(true)

      // Remove any scaling transforms for PDF generation
      resumeContent.style.transform = "none"
      resumeContent.style.height = "auto"
      resumeContent.style.width = "100%"

      tempDiv.appendChild(resumeContent)
      document.body.appendChild(tempDiv)

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${personalInfo.firstName}_${personalInfo.lastName}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#FFFFFF",
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }

      await html2pdf().set(opt).from(tempDiv).save()

      // Clean up
      document.body.removeChild(tempDiv)

      toast.success("Resume downloaded successfully")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-700 mb-4" />
          <p className="text-lg text-gray-600">Loading your CV data...</p>
        </div>
      </div>
    )
  }

  if (!user && !authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-6">You must be logged in to access the CV Builder.</p>
          <Button
            onClick={() => navigate("/login", { state: { from: "/cv-builder" } })}
            className="bg-purple-700 hover:bg-purple-800"
          >
            Log In
          </Button>
        </div>
      </div>
    )
  }

  if (previewMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Resume Preview</h1>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPreviewMode(false)}>
                Back to Editor
              </Button>
              <Button className="bg-purple-700 hover:bg-purple-800" onClick={generatePDF} disabled={generatingPdf}>
                {generatingPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white shadow-md">
            <div ref={resumeRef}>
              <ResumeTemplate
                personalInfo={personalInfo}
                workExperience={workExperience}
                education={education}
                skills={skills}
                languages={languages}
                training={training}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">CV Builder & Optimizer</h1>
        <p className="text-gray-600 mb-8">Create and optimize your CV with AI-powered suggestions</p>

        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="builder">CV Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="optimizer">AI Optimizer</TabsTrigger>
          </TabsList>

          {/* CV Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <Button className="bg-purple-700 hover:bg-purple-800" onClick={savePersonalInfo} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                        First Name
                      </label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={personalInfo.firstName}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                        Last Name
                      </label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={personalInfo.lastName}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="professionalTitle" className="block text-sm font-medium mb-1">
                      Professional Title
                    </label>
                    <Input
                      id="professionalTitle"
                      name="professionalTitle"
                      value={personalInfo.professionalTitle}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">
                        Phone
                      </label>
                      <Input id="phone" name="phone" value={personalInfo.phone} onChange={handlePersonalInfoChange} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Location
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={personalInfo.location}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="linkedin" className="block text-sm font-medium mb-1">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="linkedin"
                        name="linkedin"
                        value={personalInfo.linkedin}
                        onChange={handlePersonalInfoChange}
                        className="pl-9"
                        placeholder="https://www.linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="summary" className="block text-sm font-medium mb-1">
                      Professional Summary
                    </label>
                    <Textarea
                      id="summary"
                      name="summary"
                      rows={4}
                      value={personalInfo.summary}
                      onChange={handlePersonalInfoChange}
                      placeholder="Summarize your professional background, key skills, and career goals..."
                    />
                  </div>
                </div>

                {/* Work Experience */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Work Experience</h2>
                    <Dialog
                      open={activeDialog === "experience"}
                      onOpenChange={(open) => {
                        if (!open) {
                          setActiveDialog(null)
                          setCurrentItem(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-purple-700 hover:bg-purple-800"
                          onClick={() => {
                            setActiveDialog("experience")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                        <DialogHeader className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                          <DialogTitle className="text-purple-800 text-xl">
                            {currentItem ? "Edit Experience" : "Add New Experience"}
                          </DialogTitle>
                          <DialogDescription className="text-purple-700/70">
                            Add details about your work experience
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                          <ExperienceForm
                            experience={currentItem}
                            onSubmit={(data) => {
                              if (currentItem) {
                                handleExperienceOperation("update", data)
                              } else {
                                handleExperienceOperation("add", data)
                              }
                            }}
                            onCancel={() => {
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                            isSaving={saving}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-6">
                    {workExperience.length === 0 ? (
                      <div className="text-center py-10 border border-dashed rounded-lg">
                        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No experience added yet</h3>
                        <p className="text-gray-500 mb-4">Add your work history to improve your CV</p>
                        <Button
                          variant="outline"
                          className="border-purple-700 text-purple-700 hover:bg-purple-50"
                          onClick={() => {
                            setActiveDialog("experience")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                    ) : (
                      workExperience.map((experience) => (
                        <div
                          key={experience.id}
                          className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-purple-900">{experience.title || "New Position"}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                                onClick={() => {
                                  setActiveDialog("experience")
                                  setCurrentItem(experience)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleExperienceOperation("delete", experience)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500">Company</label>
                              <p className="font-medium text-gray-800">{experience.company}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Location</label>
                              <p className="text-gray-800 flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                {experience.location}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs text-gray-500">Duration</label>
                            <p className="text-gray-800 flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {experience.startDate} - {experience.endDate}
                            </p>
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs text-gray-500">Description</label>
                            <p className="text-sm whitespace-pre-line text-gray-700">{experience.description}</p>
                          </div>

                          {experience.skills && experience.skills.length > 0 && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Skills</label>
                              <div className="flex flex-wrap gap-1">
                                {experience.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Education</h2>
                    <Dialog
                      open={activeDialog === "education"}
                      onOpenChange={(open) => {
                        if (!open) {
                          setActiveDialog(null)
                          setCurrentItem(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-purple-700 hover:bg-purple-800"
                          onClick={() => {
                            setActiveDialog("education")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                        <DialogHeader className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                          <DialogTitle className="text-blue-800 text-xl">
                            {currentItem ? "Edit Education" : "Add New Education"}
                          </DialogTitle>
                          <DialogDescription className="text-blue-700/70">
                            Add details about your educational background
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                          <EducationForm
                            education={currentItem}
                            onSubmit={(data) => {
                              if (currentItem) {
                                handleEducationOperation("update", data)
                              } else {
                                handleEducationOperation("add", data)
                              }
                            }}
                            onCancel={() => {
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                            isSaving={saving}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {education.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No education added yet</h3>
                      <p className="text-gray-500 mb-4">Add your educational background to improve your CV</p>
                      <Button
                        variant="outline"
                        className="border-purple-700 text-purple-700 hover:bg-purple-50"
                        onClick={() => {
                          setActiveDialog("education")
                          setCurrentItem(null)
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <div key={edu.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-blue-900">{edu.degree || "New Education"}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => {
                                  setActiveDialog("education")
                                  setCurrentItem(edu)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleEducationOperation("delete", edu)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500">Institution</label>
                              <p className="font-medium text-gray-800">{edu.institution}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Location</label>
                              <p className="text-gray-800 flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                {edu.location}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs text-gray-500">Duration</label>
                            <p className="text-gray-800 flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {edu.startDate} - {edu.endDate}
                            </p>
                          </div>

                          {edu.fieldOfStudy && (
                            <div className="mb-3">
                              <label className="block text-xs text-gray-500">Field of Study</label>
                              <p className="text-sm text-blue-700 font-medium">{edu.fieldOfStudy}</p>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs text-gray-500">Description</label>
                            <p className="text-sm text-gray-700">{edu.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Training / Courses */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Training / Courses</h2>
                    <Dialog
                      open={activeDialog === "training"}
                      onOpenChange={(open) => {
                        if (!open) {
                          setActiveDialog(null)
                          setCurrentItem(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-purple-700 hover:bg-purple-800"
                          onClick={() => {
                            setActiveDialog("training")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Training
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                        <DialogHeader className="bg-green-50 px-6 py-4 border-b border-green-100">
                          <DialogTitle className="text-green-800 text-xl">
                            {currentItem !== null ? "Edit Training" : "Add New Training"}
                          </DialogTitle>
                          <DialogDescription className="text-green-700/70">
                            Add details about your training or courses
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4">
                          <TrainingForm
                            training={currentItem !== null ? training[currentItem] : null}
                            onSubmit={(data) => {
                              if (currentItem !== null) {
                                handleTrainingOperation("update", data, currentItem)
                              } else {
                                handleTrainingOperation("add", data)
                              }
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                            onCancel={() => {
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {training.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No training added yet</h3>
                      <p className="text-gray-500 mb-4">Add your training and courses to enhance your CV</p>
                      <Button
                        variant="outline"
                        className="border-purple-700 text-purple-700 hover:bg-purple-50"
                        onClick={() => {
                          setActiveDialog("training")
                          setCurrentItem(null)
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Training
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {training.map((course, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between mb-1">
                            <h3 className="font-semibold text-green-900">{course.name}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                onClick={() => {
                                  setActiveDialog("training")
                                  setCurrentItem(index)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleTrainingOperation("delete", null, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{course.institution}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Languages */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Languages</h2>
                    <Dialog
                      open={activeDialog === "language"}
                      onOpenChange={(open) => {
                        if (!open) {
                          setActiveDialog(null)
                          setCurrentItem(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-purple-700 hover:bg-purple-800"
                          onClick={() => {
                            setActiveDialog("language")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Language
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                        <DialogHeader className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                          <DialogTitle className="text-orange-800 text-xl">
                            {currentItem !== null ? "Edit Language" : "Add New Language"}
                          </DialogTitle>
                          <DialogDescription className="text-orange-700/70">
                            Add details about your language proficiency
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4">
                          <LanguageForm
                            language={currentItem !== null ? languages[currentItem] : null}
                            onSubmit={(data) => {
                              if (currentItem !== null) {
                                handleLanguageOperation("update", data, currentItem)
                              } else {
                                handleLanguageOperation("add", data)
                              }
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                            onCancel={() => {
                              setActiveDialog(null)
                              setCurrentItem(null)
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {languages.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <Globe className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No languages added yet</h3>
                      <p className="text-gray-500 mb-4">Add your language proficiencies to enhance your CV</p>
                      <Button
                        variant="outline"
                        className="border-purple-700 text-purple-700 hover:bg-purple-50"
                        onClick={() => {
                          setActiveDialog("language")
                          setCurrentItem(null)
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Language
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {languages.map((lang, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between mb-1">
                            <h3 className="font-semibold text-orange-900">{lang.name}</h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                onClick={() => {
                                  setActiveDialog("language")
                                  setCurrentItem(index)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleLanguageOperation("delete", null, index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{lang.level}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Skills</h2>
                    <div className="flex gap-2">
                      <Input
                        id="new-skill"
                        placeholder="Add a skill"
                        className="w-40"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                      />
                      <Button className="bg-purple-700 hover:bg-purple-800" onClick={addSkill} disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {skills.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <p className="text-gray-500">
                        No skills added yet. Add your professional skills to enhance your CV.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {skills.map((skill) => (
                        <div
                          key={skill}
                          className="border rounded-lg p-3 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white hover:shadow-sm transition-shadow"
                        >
                          <span className="font-medium text-purple-800">{skill}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeSkill(skill)}
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                      <div className="">
                      <div className="bg-white rounded-lg border p-4 sticky top-4">
                   
                        <div className="space-y-3">
                        <Button
                          className="w-full bg-purple-700 hover:bg-purple-800"
                          onClick={generatePDF}
                          disabled={generatingPdf}
                        >
                          {generatingPdf ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating PDF...
                          </>
                          ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </>
                          )}
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setPreviewMode(true)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Full Preview
                        </Button>
                        </div>
                      </div>
                      </div>
                    </div>
                    </TabsContent>

                    {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Choose a Template</h2>
              <p className="text-gray-600 mb-6">
                Select a professional template for your CV. You can switch templates at any time without losing your
                content.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Template 1 */}
                <div className={`border rounded-lg p-2 ${activeTemplate === "modern" ? "ring-2 ring-purple-700" : ""}`}>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img
                      src="/placeholder.svg?height=300&width=225"
                      alt="Modern Template"
                      width={225}
                      height={300}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Modern</span>
                    <Button
                      variant={activeTemplate === "modern" ? "default" : "outline"}
                      size="sm"
                      className={activeTemplate === "modern" ? "bg-purple-700 hover:bg-purple-800" : ""}
                      onClick={() => setActiveTemplate("modern")}
                    >
                      {activeTemplate === "modern" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* Template 2 */}
                <div
                  className={`border rounded-lg p-2 ${activeTemplate === "professional" ? "ring-2 ring-purple-700" : ""}`}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-2 overflow-hidden">
                    <img
                      src="/placeholder.svg?height=300&width=225"
                      alt="Professional Template"
                      width={225}
                      height={300}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Professional</span>
                    <Button
                      variant={activeTemplate === "professional" ? "default" : "outline"}
                      size="sm"
                      className={activeTemplate === "professional" ? "bg-purple-700 hover:bg-purple-800" : ""}
                      onClick={() => setActiveTemplate("professional")}
                    >
                      {activeTemplate === "professional" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* More templates would go here */}
              </div>
            </div>
          </TabsContent>

          {/* AI Optimizer Tab */}
          <TabsContent value="optimizer" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">AI CV Optimizer</h2>
                <Sparkles className="h-5 w-5 text-purple-700" />
              </div>
              <p className="text-gray-600 mb-6">
                Our AI will analyze your CV and provide personalized suggestions to improve it and increase your chances
                of getting noticed by recruiters.
              </p>

              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                    <h3 className="font-medium mb-2">Upload your existing CV</h3>
                    <p className="text-sm text-gray-500 mb-4">Drag and drop your CV file here, or click to browse</p>
                    <Button className="bg-purple-700 hover:bg-purple-800">Browse Files</Button>
                    <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3">Or analyze your current CV</h3>
                <Button className="bg-purple-700 hover:bg-purple-800">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Current CV
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">AI Optimization Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Sparkles className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h4 className="font-medium">Keyword Optimization</h4>
                      <p className="text-sm text-gray-600">
                        Our AI analyzes job descriptions and suggests keywords to include in your CV to pass Applicant
                        Tracking Systems (ATS).
                      </p>
                    </div>
                  </div>

                  {/* More features would go here */}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ExperienceForm({ experience, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    title: experience?.title || "",
    company: experience?.company || "",
    location: experience?.location || "",
    startDate: experience?.startDate || "",
    endDate: experience?.endDate === "Present" ? "" : experience?.endDate || "",
    description: experience?.description || "",
    skills: experience?.skills?.join(", ") || "",
    current: experience?.endDate === "Present",
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "current" && checked ? { endDate: "" } : {}),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium text-gray-700">
            Job Title *
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
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
              value={formData.startDate}
              onChange={handleChange}
              placeholder="January 2020"
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
              value={formData.endDate}
              onChange={handleChange}
              placeholder="December 2023"
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {experience ? "Update Experience" : "Add Experience"}
        </Button>
      </div>
    </form>
  )
}

function EducationForm({ education, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    degree: education?.degree || "",
    institution: education?.institution || "",
    fieldOfStudy: education?.fieldOfStudy || "",
    location: education?.location || "",
    startDate: education?.startDate || "",
    endDate: education?.endDate === "Present" ? "" : education?.endDate || "",
    description: education?.description || "",
    current: education?.endDate === "Present",
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "current" && checked ? { endDate: "" } : {}),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              value={formData.startDate}
              onChange={handleChange}
              placeholder="September 2016"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              value={formData.endDate}
              onChange={handleChange}
              placeholder="June 2020"
              disabled={formData.current}
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${formData.current ? "bg-gray-100 text-gray-500" : ""}`}
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
            className="data-[state=checked]:bg-blue-600"
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe your studies, achievements, and activities..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {education ? "Update Education" : "Add Education"}
        </Button>
      </div>
    </form>
  )
}

function TrainingForm({ training, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: training?.name || "",
    institution: training?.institution || "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Training Name *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
            Institution *
          </Label>
          <Input
            id="institution"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          {training ? "Update Training" : "Add Training"}
        </Button>
      </div>
    </form>
  )
}

function LanguageForm({ language, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: language?.name || "",
    level: language?.level || "Intermediate",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Language *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level" className="text-sm font-medium text-gray-700">
            Proficiency Level *
          </Label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 py-2 px-3 focus:border-orange-500 focus:ring-orange-500"
            required
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Proficient">Proficient</option>
            <option value="Native">Native</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
          {language ? "Update Language" : "Add Language"}
        </Button>
      </div>
    </form>
  )
}

