

import { useState, useEffect, useRef } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  PlusCircle,
  FileText,
  Edit,
  Trash2,
  Loader2,
  Save,
  CalendarIcon,
  MapPin,
  Briefcase,
  GraduationCap,
  X,
  Link,
  Globe,
  Award,
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
import ResumeTemplate from "./resume-template"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import html2pdf from "html2pdf.js"
import EnhanceAIButton from "./enhance-ai-button"
import CVReviewAnalyzer from "./cv-review-analyzer"

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
  const [skillLevel, setSkillLevel] = useState("Intermediate")
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
  const [languages, setLanguages] = useState([])
  const [certifications, setCertifications] = useState([])

  // Format date for display (MM/YYYY or "Present")
  const formatDate = (dateString) => {
    if (!dateString || dateString === "2099-12-31") return "Present"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`
    } catch {
      return dateString
    }
  }

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateString) => {
    if (!dateString || dateString === "Present") return new Date().toISOString().split("T")[0]

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString
    }

    // Handle DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split("/")
      return `${year}-${month}-${day}`
    }

    // Handle MM/YYYY format
    if (/^\d{2}\/\d{4}$/.test(dateString)) {
      const [month, year] = dateString.split("/")
      return `${year}-${month}-01` // Using first day of month
    }

    return dateString
  }

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

        const [profile, skills, experiences, formations, languages, certifications] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id).catch(() => []),
          userService.getExperiences(user._id).catch(() => []),
          userService.getFormations(user._id).catch(() => []),
          userService.getLanguages(user._id).catch(() => []),
          userService.getCertifications(user._id).catch(() => []),
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
          setSkills(Array.isArray(skills) ? skills : [])

          // Set work experience
          setWorkExperience(
            Array.isArray(experiences)
              ? experiences.map((exp) => ({
                  id: exp._id,
                  title: exp.jobTitle || "",
                  company: exp.company || "",
                  location: exp.location || "",
                  startDate: exp.startDate || "",
                  endDate: exp.current ? "Present" : exp.endDate || "",
                  description: exp.description || "",
                  skills: exp.skills || [],
                  current: exp.current || false,
                }))
              : [],
          )

          // Set education
          setEducation(
            Array.isArray(formations)
              ? formations.map((edu) => ({
                  id: edu._id,
                  degree: edu.degree || "",
                  school: edu.school || "",
                  location: edu.location || "",
                  startDate: edu.startDate || "",
                  endDate: edu.current ? "Present" : edu.endDate || "",
                  description: edu.description || "",
                  fieldOfStudy: edu.fieldOfStudy || "",
                  current: edu.current || false,
                }))
              : [],
          )

          // Set languages
          setLanguages(
            Array.isArray(languages)
              ? languages.map((lang) => ({
                  id: lang._id,
                  name: lang.name || "",
                  level: lang.proficiency || "Intermediate",
                }))
              : [],
          )

          // Set certifications
          setCertifications(
            Array.isArray(certifications)
              ? certifications.map((cert) => ({
                  id: cert._id,
                  name: cert.name || "",
                  issuer: cert.issuer || "",
                  issueDate: cert.issueDate || "",
                  expirationDate: cert.expirationDate ? cert.expirationDate : "No Expiration",
                }))
              : [],
          )

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

  // AI enhancement for summary
  const handleEnhanceSummary = (enhancedContent) => {
    setPersonalInfo({
      ...personalInfo,
      summary: enhancedContent,
    })
    toast.success("Professional summary enhanced with AI")
  }

  // AI enhancement for experience description
  const handleEnhanceExperience = (experienceId, enhancedContent) => {
    setWorkExperience(
      workExperience.map((exp) => (exp.id === experienceId ? { ...exp, description: enhancedContent } : exp)),
    )
    toast.success("Experience description enhanced with AI")
  }

  // AI enhancement for education description
  const handleEnhanceEducation = (educationId, enhancedContent) => {
    setEducation(education.map((edu) => (edu.id === educationId ? { ...edu, description: enhancedContent } : edu)))
    toast.success("Education description enhanced with AI")
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

  const openSkillDialog = () => {
    setActiveDialog("skill")
    setCurrentItem(null)
    setNewSkill("")
    setSkillLevel("Intermediate")
  }

  const handleAddSkill = async () => {
    if (!user || !user._id) {
      toast.error("You must be logged in to add skills")
      return
    }

    if (!newSkill.trim()) {
      toast.error("Please enter a skill name")
      return
    }

    try {
      setSaving(true)

      const response = await userService.addUserSkill(user._id, {
        name: newSkill.trim(),
        level: skillLevel,
      })

      setSkills([...skills, { _id: response._id, name: newSkill.trim(), level: skillLevel }])
      setNewSkill("")
      setSkillLevel("Intermediate")
      setActiveDialog(null)
      toast.success("Skill added successfully")
    } catch (error) {
      console.error("Error adding skill:", error)
      toast.error("Failed to add skill")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSkill = async (skill) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to update skills")
      return
    }

    try {
      setSaving(true)

      await userService.updateUserSkill(user._id, skill._id, {
        name: newSkill.trim(),
        level: skillLevel,
      })

      setSkills(skills.map((s) => (s._id === skill._id ? { ...s, name: newSkill.trim(), level: skillLevel } : s)))
      setNewSkill("")
      setSkillLevel("Intermediate")
      setActiveDialog(null)
      setCurrentItem(null)
      toast.success("Skill updated successfully")
    } catch (error) {
      console.error("Error updating skill:", error)
      toast.error("Failed to update skill")
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

      await userService.removeUserSkill(user._id, skillToRemove._id)
      setSkills(skills.filter((skill) => skill._id !== skillToRemove._id))
      toast.success("Skill removed successfully")
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
          jobTitle: data.title,
          company: data.company,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? new Date().toISOString().split("T")[0] : formatDateForAPI(data.endDate),
          description: data.description,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          current: data.current,
        }

        const response = await userService.addExperience(user._id, apiData)

        setWorkExperience([
          ...workExperience,
          {
            id: response._id,
            title: response.jobTitle,
            company: response.company,
            location: response.location,
            startDate: response.startDate,
            endDate: response.current ? "Present" : response.endDate,
            description: response.description,
            skills: response.skills || [],
            current: response.current,
          },
        ])

        toast.success("Work experience added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          jobTitle: data.title,
          company: data.company,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? new Date().toISOString().split("T")[0] : formatDateForAPI(data.endDate),
          description: data.description,
          skills: data.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          current: data.current,
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
                  current: data.current,
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
          school: data.school,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? new Date().toISOString().split("T")[0] : formatDateForAPI(data.endDate),
          description: data.description,
          fieldOfStudy: data.fieldOfStudy,
          current: data.current,
        }

        const response = await userService.addFormation(user._id, apiData)

        setEducation([
          ...education,
          {
            id: response._id,
            degree: response.degree,
            school: response.school,
            location: response.location,
            startDate: response.startDate,
            endDate: response.current ? "Present" : response.endDate,
            description: response.description,
            fieldOfStudy: response.fieldOfStudy,
            current: response.current,
          },
        ])

        toast.success("Education added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          degree: data.degree,
          school: data.school,
          location: data.location,
          startDate: formatDateForAPI(data.startDate),
          endDate: data.current ? new Date().toISOString().split("T")[0] : formatDateForAPI(data.endDate),
          description: data.description,
          fieldOfStudy: data.fieldOfStudy,
          current: data.current,
        }

        await userService.updateFormation(user._id, currentItem.id, apiData)

        setEducation(
          education.map((edu) =>
            edu.id === currentItem.id
              ? {
                  ...edu,
                  degree: data.degree,
                  school: data.school,
                  location: data.location,
                  startDate: data.startDate,
                  endDate: data.current ? "Present" : data.endDate,
                  description: data.description,
                  fieldOfStudy: data.fieldOfStudy,
                  current: data.current,
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

  const handleLanguageOperation = async (operation, data = null, index = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to manage languages")
      return
    }

    try {
      setSaving(true)

      if (operation === "add") {
        const apiData = {
          name: data.name,
          level: data.level,
        }

        const response = await userService.addLanguage(user._id, apiData)

        setLanguages([
          ...languages,
          {
            id: response._id,
            name: response.name,
            level: response.proficiency,
          },
        ])

        toast.success("Language added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          name: data.name,
          level: data.level,
        }

        await userService.updateLanguage(user._id, currentItem.id, apiData)

        setLanguages(
          languages.map((lang) =>
            lang.id === currentItem.id
              ? {
                  ...lang,
                  name: data.name,
                  level: data.level,
                }
              : lang,
          ),
        )

        toast.success("Language updated successfully")
      }

      if (operation === "delete" && data) {
        await userService.deleteLanguage(user._id, data.id)
        setLanguages(languages.filter((lang) => lang.id !== data.id))
        toast.success("Language deleted successfully")
      }
    } catch (error) {
      console.error("Error managing language:", error)
      toast.error(`Failed to ${operation} language`)
    } finally {
      setSaving(false)
      setActiveDialog(null)
      setCurrentItem(null)
    }
  }

  const handleCertificationOperation = async (operation, data = null) => {
    if (!user || !user._id) {
      toast.error("You must be logged in to manage certifications")
      return
    }

    try {
      setSaving(true)

      if (operation === "add") {
        const apiData = {
          name: data.name,
          issuer: data.issuer,
          issueDate: formatDateForAPI(data.issueDate),
          expirationDate: data.expirationDate ? formatDateForAPI(data.expirationDate) : null,
        }

        const response = await userService.addCertification(user._id, apiData)

        setCertifications([
          ...certifications,
          {
            id: response._id,
            name: response.name,
            issuer: response.issuer,
            issueDate: response.issueDate,
            expirationDate: response.expirationDate ? response.expirationDate : "No Expiration",
          },
        ])

        toast.success("Certification added successfully")
      }

      if (operation === "update" && currentItem) {
        const apiData = {
          name: data.name,
          issuer: data.issuer,
          issueDate: formatDateForAPI(data.issueDate),
          expirationDate: data.expirationDate ? formatDateForAPI(data.expirationDate) : null,
        }

        await userService.updateCertification(user._id, currentItem.id, apiData)

        setCertifications(
          certifications.map((cert) =>
            cert.id === currentItem.id
              ? {
                  ...cert,
                  name: data.name,
                  issuer: data.issuer,
                  issueDate: data.issueDate,
                  expirationDate: data.expirationDate ? data.expirationDate : "No Expiration",
                }
              : cert,
          ),
        )

        toast.success("Certification updated successfully")
      }

      if (operation === "delete" && data) {
        await userService.deleteCertification(user._id, data.id)
        setCertifications(certifications.filter((cert) => cert.id !== data.id))
        toast.success("Certification deleted successfully")
      }
    } catch (error) {
      console.error("Error managing certification:", error)
      toast.error(`Failed to ${operation} certification`)
    } finally {
      setSaving(false)
      setActiveDialog(null)
      setCurrentItem(null)
    }
  }

  const generatePDF = async () => {
    if (!resumeRef.current) {
      toast.error("No resume content found")
      return
    }

    try {
      setGeneratingPdf(true)

      // Créer un clone profond du contenu
      const element = resumeRef.current.cloneNode(true)

      // Appliquer les styles nécessaires pour le PDF
      element.style.width = "210mm" // Largeur A4
      element.style.minHeight = "297mm" // Hauteur A4
      element.style.padding = "0"
      element.style.margin = "0"
      element.style.boxSizing = "border-box"

      // Créer un conteneur pour le PDF
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.appendChild(element)
      document.body.appendChild(container)

      // Options pour html2pdf
      const opt = {
        margin: 10,
        filename: `${personalInfo.firstName}_${personalInfo.lastName}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      }

      // Générer le PDF
      await html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          toast.success("Resume downloaded successfully")
        })
        .catch((error) => {
          console.error("PDF generation error:", error)
          toast.error("Failed to generate PDF")
        })
        .finally(() => {
          // Nettoyer le DOM
          if (container.parentNode) {
            document.body.removeChild(container)
          }
          setGeneratingPdf(false)
        })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("Failed to generate PDF")
      setGeneratingPdf(false)
    }
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
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white shadow-md">
            <div ref={resumeRef}>
              <ResumeTemplate
                personalInfo={personalInfo}
                workExperience={workExperience.map((exp) => ({
                  ...exp,
                  startDate: formatDate(exp.startDate),
                  endDate: formatDate(exp.endDate),
                }))}
                education={education.map((edu) => ({
                  ...edu,
                  startDate: formatDate(edu.startDate),
                  endDate: formatDate(edu.endDate),
                }))}
                skills={skills}
                languages={languages}
                certifications={certifications.map((cert) => ({
                  ...cert,
                  issueDate: formatDate(cert.issueDate),
                  expirationDate:
                    cert.expirationDate === "No Expiration" ? cert.expirationDate : formatDate(cert.expirationDate),
                }))}
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

          <TabsContent value="builder" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    <Button
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                      onClick={savePersonalInfo}
                      disabled={saving}
                    >
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
                    <div className="space-y-2">
                      <Textarea
                        id="summary"
                        name="summary"
                        rows={4}
                        value={personalInfo.summary}
                        onChange={handlePersonalInfoChange}
                        placeholder="Summarize your professional background, key skills, and career goals..."
                      />
                      <div className="flex justify-end">
                        <EnhanceAIButton
                          contentType="summary"
                          content={personalInfo.summary}
                          onApplyEnhancement={handleEnhanceSummary}
                        />
                      </div>
                    </div>
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
                          className="bg-blue-700 hover:bg-blue-800 text-white"
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
                        <DialogHeader className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                          <DialogTitle className="text-blue-800 text-xl">
                            {currentItem ? "Edit Experience" : "Add New Experience"}
                          </DialogTitle>
                          <DialogDescription className="text-blue-700/70">
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
                          className="border-blue-700 text-blue-700 hover:bg-blue-50"
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
                            <h3 className="font-semibold text-blue-900">{experience.title || "New Position"}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
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
                              <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                              {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
                            </p>
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs text-gray-500">Description</label>
                            <div className="space-y-2">
                              <p className="text-sm whitespace-pre-line text-gray-700">{experience.description}</p>
                              <div className="flex justify-end">
                                <EnhanceAIButton
                                  contentType="experience"
                                  content={experience.description}
                                  onApplyEnhancement={(enhanced) => handleEnhanceExperience(experience.id, enhanced)}
                                />
                              </div>
                            </div>
                          </div>

                          {experience.skills && experience.skills.length > 0 && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Skills</label>
                              <div className="flex flex-wrap gap-1">
                                {experience.skills.map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200"
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
                          className="bg-blue-700 hover:bg-blue-800 text-white"
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
                        className="border-blue-700 text-blue-700 hover:bg-blue-50"
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
                              <label className="block text-xs text-gray-500">school</label>
                              <p className="font-medium text-gray-800">{edu.school}</p>
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
                              <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                              {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
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
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">{edu.description}</p>
                              <div className="flex justify-end">
                                <EnhanceAIButton
                                  contentType="education"
                                  content={edu.description}
                                  onApplyEnhancement={(enhanced) => handleEnhanceEducation(edu.id, enhanced)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Certifications</h2>
                    <Dialog
                      open={activeDialog === "certification"}
                      onOpenChange={(open) => {
                        if (!open) {
                          setActiveDialog(null)
                          setCurrentItem(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-blue-700 hover:bg-blue-800 text-white"
                          onClick={() => {
                            setActiveDialog("certification")
                            setCurrentItem(null)
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Certification
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border shadow-lg">
                        <DialogHeader className="bg-green-50 px-6 py-4 border-b border-green-100">
                          <DialogTitle className="text-green-800 text-xl">
                            {currentItem ? "Edit Certification" : "Add New Certification"}
                          </DialogTitle>
                          <DialogDescription className="text-green-700/70">
                            Add details about your professional certifications
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                          <CertificationForm
                            certification={currentItem}
                            onSubmit={(data) => {
                              if (currentItem) {
                                handleCertificationOperation("update", data)
                              } else {
                                handleCertificationOperation("add", data)
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

                  {certifications.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <Award className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No certifications added yet</h3>
                      <p className="text-gray-500 mb-4">Add your professional certifications to enhance your CV</p>
                      <Button
                        variant="outline"
                        className="border-blue-700 text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          setActiveDialog("certification")
                          setCurrentItem(null)
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Certification
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-green-900">{cert.name || "New Certification"}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                onClick={() => {
                                  setActiveDialog("certification")
                                  setCurrentItem(cert)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCertificationOperation("delete", cert)}
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs text-gray-500">Issuer</label>
                            <p className="font-medium text-gray-800">{cert.issuer}</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-xs text-gray-500">Issue Date</label>
                              <p className="text-gray-800 flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                                {formatDate(cert.issueDate)}
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Expiration Date</label>
                              <p className="text-gray-800 flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1 text-gray-400" />
                                {cert.expirationDate === "No Expiration"
                                  ? cert.expirationDate
                                  : formatDate(cert.expirationDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Skills */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Skills</h2>
                    <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={openSkillDialog}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Skill
                    </Button>
                  </div>

                  <Dialog
                    open={activeDialog === "skill"}
                    onOpenChange={(open) => {
                      if (!open) {
                        setActiveDialog(null)
                        setCurrentItem(null)
                        setNewSkill("")
                        setSkillLevel("Intermediate")
                      }
                    }}
                  >
                    <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg">
                      <DialogHeader className="border-b border-gray-200 pb-4">
                        <DialogTitle className="text-lg font-semibold text-gray-800">
                          {currentItem ? "Edit Skill" : "Add New Skill"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                          {currentItem
                            ? "Update the details of your skill below."
                            : "Add a new skill to showcase your expertise."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-6">
                        <div className="space-y-2">
                          <Label htmlFor="skillName" className="text-sm font-medium text-gray-700">
                            Skill Name
                          </Label>
                          <Input
                            id="skillName"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Enter skill name (e.g., React, Python)"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skillLevel" className="text-sm font-medium text-gray-700">
                            Skill Level
                          </Label>
                          <Select value={skillLevel} onValueChange={(value) => setSkillLevel(value)}>
                            <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-20">
                              <SelectItem value="Beginner">Beginner</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Advanced">Advanced</SelectItem>
                              <SelectItem value="Expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveDialog(null)
                            setCurrentItem(null)
                            setNewSkill("")
                            setSkillLevel("Intermediate")
                          }}
                          className="text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (currentItem) {
                              handleUpdateSkill(currentItem)
                            } else {
                              handleAddSkill()
                            }
                          }}
                          disabled={!newSkill.trim() || saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <>{currentItem ? "Update" : "Add"}</>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

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
                          key={skill._id}
                          className="border rounded-lg p-3 flex justify-between items-center bg-gradient-to-r from-blue-50 "
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-800">{skill.name}</span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {skill.level}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => {
                                setActiveDialog("skill")
                                setCurrentItem(skill)
                                setNewSkill(skill.name)
                                setSkillLevel(skill.level)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeSkill(skill)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            </Button>
                          </div>
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
                          className="bg-blue-700 hover:bg-blue-800 text-white"
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
                            {currentItem ? "Edit Language" : "Add New Language"}
                          </DialogTitle>
                          <DialogDescription className="text-orange-700/70">
                            Add details about your language proficiency
                          </DialogDescription>
                        </DialogHeader>
                        <div className="px-6 py-4">
                          <LanguageForm
                            language={currentItem}
                            onSubmit={(data) => {
                              if (currentItem) {
                                handleLanguageOperation("update", data)
                              } else {
                                handleLanguageOperation("add", data)
                              }
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
                        className="border-blue-700 text-blue-700 hover:bg-blue-50"
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
                      {languages.map((lang) => (
                        <div key={lang.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                          <div className="flex justify-between mb-1">
                            <h3 className="font-semibold text-orange-900">{lang.name}</h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                                onClick={() => {
                                  setActiveDialog("language")
                                  setCurrentItem(lang)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleLanguageOperation("delete", lang)}
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
              </div>

              <div className="">
                <div className="bg-white rounded-lg border p-4 sticky top-4">
                  <div className="space-y-3">
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
                <div className={`border rounded-lg p-2 ${activeTemplate === "modern" ? "ring-2 ring-blue-700" : ""}`}>
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
                      className={activeTemplate === "modern" ? "bg-blue-700 hover:bg-blue-800 text-white" : ""}
                      onClick={() => setActiveTemplate("modern")}
                    >
                      {activeTemplate === "modern" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* Template 2 */}
                <div
                  className={`border rounded-lg p-2 ${activeTemplate === "professional" ? "ring-2 ring-blue-700" : ""}`}
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
                      className={
                        activeTemplate === "professional" ? "bg-blue-700 hover:bg-blue-800 text-white" : ""
                      }
                      onClick={() => setActiveTemplate("professional")}
                    >
                      {activeTemplate === "professional" ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Optimizer Tab */}
          <TabsContent value="optimizer" className="space-y-6">
            <CVReviewAnalyzer
              personalInfo={personalInfo}
              workExperience={workExperience}
              education={education}
              skills={skills}
              languages={languages}
              certifications={certifications}
            />
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
    current: experience?.current || false,
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              className="pl-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">
              Start Date *
            </Label>
            <div className="relative">
              <Input
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                onClick={() => {
                  const datePicker = document.getElementById("startDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="startDatePicker"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      startDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <div className="relative">
              <Input
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                disabled={formData.current}
                className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${formData.current ? "bg-gray-100 text-gray-500" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                disabled={formData.current}
                onClick={() => {
                  const datePicker = document.getElementById("endDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="endDatePicker"
                className="sr-only"
                disabled={formData.current}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      endDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <input
            type="checkbox"
            id="current"
            name="current"
            checked={formData.current}
            onChange={(e) => {
              const checked = e.target.checked
              setFormData((prev) => ({
                ...prev,
                current: checked,
                endDate: checked ? "" : prev.endDate,
              }))
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe your responsibilities and achievements..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white text-white" disabled={isSaving}>
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
    school: education?.school || "",
    fieldOfStudy: education?.fieldOfStudy || "",
    location: education?.location || "",
    startDate: education?.startDate || "",
    endDate: education?.endDate === "Present" ? "" : education?.endDate || "",
    description: education?.description || "",
    current: education?.current || false,
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
          <Label htmlFor="school" className="text-sm font-medium text-gray-700">
            school *
          </Label>
          <Input
            id="school"
            name="school"
            value={formData.school}
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
            <div className="relative">
              <Input
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                onClick={() => {
                  const datePicker = document.getElementById("eduStartDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="eduStartDatePicker"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      startDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <div className="relative">
              <Input
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                disabled={formData.current}
                className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${formData.current ? "bg-gray-100 text-gray-500" : ""}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                disabled={formData.current}
                onClick={() => {
                  const datePicker = document.getElementById("eduEndDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="eduEndDatePicker"
                className="sr-only"
                disabled={formData.current}
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      endDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <input
            type="checkbox"
            id="current"
            name="current"
            checked={formData.current}
            onChange={(e) => {
              const checked = e.target.checked
              setFormData((prev) => ({
                ...prev,
                current: checked,
                endDate: checked ? "" : prev.endDate,
              }))
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

function CertificationForm({ certification, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    name: certification?.name || "",
    issuer: certification?.issuer || "",
    issueDate: certification?.issueDate || "",
    expirationDate: certification?.expirationDate === "No Expiration" ? "" : certification?.expirationDate || "",
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
            Certification Name *
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
          <Label htmlFor="issuer" className="text-sm font-medium text-gray-700">
            Issuing Organization *
          </Label>
          <Input
            id="issuer"
            name="issuer"
            value={formData.issuer}
            onChange={handleChange}
            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="issueDate" className="text-sm font-medium text-gray-700">
              Issue Date *
            </Label>
            <div className="relative">
              <Input
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                onClick={() => {
                  const datePicker = document.getElementById("issueDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="issueDatePicker"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      issueDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="text-sm font-medium text-gray-700">
              Expiration Date
            </Label>
            <div className="relative">
              <Input
                id="expirationDate"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                onClick={() => {
                  const datePicker = document.getElementById("expirationDatePicker")
                  if (datePicker) {
                    datePicker.showPicker()
                  }
                }}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <input
                type="date"
                id="expirationDatePicker"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.value) {
                    const date = new Date(e.target.value)
                    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
                    setFormData((prev) => ({
                      ...prev,
                      expirationDate: formattedDate,
                    }))
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {certification ? "Update Certification" : "Add Certification"}
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
            placeholder="e.g. English, French, Spanish"
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
