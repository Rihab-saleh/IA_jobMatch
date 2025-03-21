"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Checkbox } from "../components/ui/checkbox"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { ChevronLeft, Upload, FileText, Trash2, Building, MapPin, Clock, DollarSign, AlertCircle } from "lucide-react"
import * as jobService  from "../services/job-service.js"

export default function ApplyPage() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    resume: null,
    experience: "",
    linkedin: "",
    website: "",
    agreeToTerms: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true)
        // In a real app, you would fetch the job details from your API
        const jobData = await jobService.getJobById(id)
        setJob(jobData)
        setLoading(false)
      } catch (err) {
        setError("Failed to load job details. Please try again.")
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [id])

  // Mock job data for demonstration
  useEffect(() => {
    // This simulates an API response
    setTimeout(() => {
      setJob({
        id: id,
        title: "Senior Frontend Developer",
        company: "Google Inc.",
        location: "New York, USA (Hybrid)",
        type: "Full-time",
        salary: "$120,000 - $150,000",
        logo: "/placeholder.svg?height=64&width=64",
      })
      setLoading(false)
    }, 1000)
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        resume: file,
      })
    }
  }

  const removeFile = () => {
    setFormData({
      ...formData,
      resume: null,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.agreeToTerms) {
      setSubmitError("You must agree to the terms and conditions to proceed.")
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // In a real app, you would submit the form data to your API
      // await jobService.applyForJob(id, formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSubmitted(true)
    } catch (err) {
      setSubmitError("Failed to submit your application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5 inline-block mr-2" />
            {error}
          </div>
          <Button className="mt-4" onClick={() => window.history.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!job) return null

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your application for <span className="font-semibold">{job.title}</span> at{" "}
              <span className="font-semibold">{job.company}</span> has been successfully submitted.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                We've sent a confirmation email to <span className="font-medium">{formData.email}</span>. You can track
                the status of your application in your dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <Button className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800">Go to Dashboard</Button>
                </Link>
                <Link to="/jobs">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Browse More Jobs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Job
        </Button>

        <div className="bg-white rounded-lg border p-6 mb-8">
          <h1 className="text-2xl font-bold mb-6">Apply for this position</h1>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border shrink-0">
              <img src={job.logo || "/placeholder.svg"} alt={job.company} width={48} height={48} />
            </div>
            <div>
              <h2 className="font-semibold">{job.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {job.company}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {job.type}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salary}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-6">
                <AlertCircle className="h-5 w-5 inline-block mr-2" />
                {submitError}
              </div>
            )}

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">
                      Full Name<span className="text-red-500">*</span>
                    </Label>
                    <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="phone">
                    Phone Number<span className="text-red-500">*</span>
                  </Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resume/CV</h3>
                {!formData.resume ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-gray-400 mb-4" />
                      <h4 className="font-medium mb-2">Upload your resume</h4>
                      <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOCX, TXT (Max 5MB)</p>
                      <input
                        type="file"
                        id="resume"
                        name="resume"
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="resume">
                        <Button type="button" variant="outline" className="cursor-pointer">
                          Browse Files
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-6 w-6 text-purple-700 mr-3" />
                        <div>
                          <p className="font-medium">{formData.resume.name}</p>
                          <p className="text-sm text-gray-500">{(formData.resume.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={removeFile}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Cover Letter</h3>
                <Textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={6}
                  placeholder="Tell us why you're a good fit for this position..."
                  value={formData.coverLetter}
                  onChange={handleChange}
                />
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Select
                      value={formData.experience}
                      onValueChange={(value) => handleSelectChange("experience", value)}
                    >
                      <SelectTrigger id="experience">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedin}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Personal Website/Portfolio</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: checked })}
                  />
                  <div>
                    <Label htmlFor="agreeToTerms" className="font-normal">
                      I agree to the{" "}
                      <Link to="/terms" className="text-purple-700 hover:underline">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-purple-700 hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      By submitting this application, you consent to the processing of your personal data for the
                      purposes of the recruitment process.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 py-6 text-lg"
                  disabled={submitting}
                >
                  {submitting ? "Submitting Application..." : "Submit Application"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

