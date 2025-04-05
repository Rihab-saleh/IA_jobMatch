"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import {
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Building,
  Star,
  Bookmark,
  Eye,
  Loader2,
} from "lucide-react"
import { userService } from "../services/user-service"
import { useAuth } from "../contexts/auth-context"

export default function DashboardPage() {
  const { user } = useAuth()
  const [state, setState] = useState({
    loading: true,
    savedJobs: [],
    applications: [],
    recommendedJobs: [],
    stats: {
      totalApplications: 0,
      interviews: 0,
      profileViews: 0,
    },
    profileData: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      position: "",
      bio: "",
      profilePicture: null,
      skills: [],
      experiences: [],
      formations: [],
      certifications: [],
      languages: [], // Added languages array
    },
  })

  const [completionPercentage, setCompletionPercentage] = useState(0)

  // Updated to include languages in the calculation
  const calculateProfileCompletion = (profileData) => {
    let total = 0

    // Personal Info (25%)
    if (profileData.firstName) total += 4
    if (profileData.lastName) total += 4
    if (profileData.email) total += 4
    if (profileData.phone) total += 3
    if (profileData.location) total += 3
    if (profileData.position) total += 3
    if (profileData.bio) total += 3
    if (profileData.profilePicture) total += 1

    // Skills (20%)
    if (profileData.skills && profileData.skills.length >= 3) {
      total += 20
    } else if (profileData.skills) {
      total += (profileData.skills.length / 3) * 20
    }

    // Experience (20%)
    if (profileData.experiences && profileData.experiences.length > 0) total += 20

    // Education (15%)
    if (profileData.formations && profileData.formations.length > 0) total += 15

    // Certifications (10%)
    if (profileData.certifications && profileData.certifications.length > 0) total += 10

    // Languages (10%) - Added languages to the calculation
    if (profileData.languages && profileData.languages.length > 0) total += 10

    return Math.min(Math.round(total), 100)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) return

        // Added languages to the Promise.all array
        const [profile, skills, experiences, formations, certifications, languages, stats] = await Promise.all([
          userService.getUserProfile(user._id),
          userService.getUserSkills(user._id),
          userService.getExperiences(user._id),
          userService.getFormations(user._id),
          userService.getCertifications(user._id),
          userService
            .getLanguages(user._id)
            .catch(() => []), // Added languages fetch
          // Ajoutez ici un appel à votre service pour récupérer les statistiques si nécessaire
          Promise.resolve({
            totalApplications: 0,
            interviews: 0,
            profileViews: 0,
          }),
        ])

        const profileData = {
          firstName: profile.user.person.firstName || "",
          lastName: profile.user.person.lastName || "",
          email: profile.user.person.email || "",
          phone: profile.user.person.phoneNumber || "",
          location: profile.profile.location || "",
          position: profile.profile.position || "",
          bio: profile.profile.bio || "",
          profilePicture: profile.user.person.profilePicture?.url || null,
          skills: skills || [],
          experiences: experiences || [],
          formations: formations || [],
          certifications: certifications || [],
          languages: languages || [], // Added languages to profileData
        }

        setState({
          loading: false,
          savedJobs: [],
          applications: [],
          recommendedJobs: [],
          stats,
          profileData,
        })

        setCompletionPercentage(calculateProfileCompletion(profileData))
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        setState((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [user])

  const toggleSaveJob = async (job) => {
    try {
      const updatedJob = { ...job, isSaved: !job.isSaved }
      await userService.saveJob(updatedJob)

      setState((prev) => ({
        ...prev,
        savedJobs: updatedJob.isSaved ? [...prev.savedJobs, updatedJob] : prev.savedJobs.filter((j) => j.id !== job.id),
        recommendedJobs: prev.recommendedJobs.map((j) => (j.id === job.id ? updatedJob : j)),
      }))
    } catch (error) {
      console.error("Error toggling job save:", error)
    }
  }

  if (state.loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-700" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {state.profileData.firstName} {state.profileData.position && `(${state.profileData.position})`}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(state.stats).map(([key, value]) => (
            <Card key={key} className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </CardTitle>
                {
                  {
                    totalApplications: <Briefcase className="h-4 w-4 text-gray-500" />,
                    interviews: <Calendar className="h-4 w-4 text-gray-500" />,
                    profileViews: <Eye className="h-4 w-4 text-gray-500" />,
                  }[key]
                }
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-500">
                  {key === "totalApplications" && "Total applications submitted"}
                  {key === "interviews" && "Upcoming interviews scheduled"}
                  {key === "profileViews" && "Profile views by recruiters"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-8 border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-bold">{completionPercentage}%</div>
                  <Badge
                    variant="outline"
                    className={
                      completionPercentage >= 80
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : completionPercentage >= 50
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {completionPercentage >= 80
                      ? "Complete"
                      : completionPercentage >= 50
                        ? "In Progress"
                        : "Needs Work"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">Complete your profile to improve job matches</p>
              </div>
              <Link to="/profile">
                <Button className="mt-3 md:mt-0 bg-purple-600 hover:bg-purple-700 text-white">Complete Profile</Button>
              </Link>
            </div>

            {/* Custom progress bar implementation */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  completionPercentage < 30
                    ? "bg-red-500"
                    : completionPercentage < 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Personal Information */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.firstName && state.profileData.lastName && state.profileData.email
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.firstName && state.profileData.lastName && state.profileData.email ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Personal Information</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.firstName && state.profileData.lastName && state.profileData.email
                      ? "Basic details completed"
                      : "Missing required information"}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.skills.length >= 3
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.skills.length >= 3 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Skills</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.skills.length >= 3
                      ? `${state.profileData.skills.length} skills added`
                      : `${3 - state.profileData.skills.length} more needed`}
                  </p>
                </div>
              </div>

              {/* Work Experience */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.experiences.length > 0
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.experiences.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Work Experience</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.experiences.length > 0
                      ? `${state.profileData.experiences.length} experiences added`
                      : "Not added yet"}
                  </p>
                </div>
              </div>

              {/* Education */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.formations.length > 0
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.formations.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Education</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.formations.length > 0
                      ? `${state.profileData.formations.length} education entries added`
                      : "Not added yet"}
                  </p>
                </div>
              </div>

              {/* Certifications */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.certifications.length > 0
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.certifications.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Certifications</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.certifications.length > 0
                      ? `${state.profileData.certifications.length} certifications added`
                      : "Not added yet"}
                  </p>
                </div>
              </div>

              {/* Languages - Added new section */}
              <div className="flex items-start gap-3">
                <div
                  className={
                    state.profileData.languages.length > 0
                      ? "bg-green-100 p-2 rounded-full"
                      : "bg-red-100 p-2 rounded-full"
                  }
                >
                  {state.profileData.languages.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Languages</h3>
                  <p className="text-sm text-gray-500">
                    {state.profileData.languages.length > 0
                      ? `${state.profileData.languages.length} languages added`
                      : "Not added yet"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="applications">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md"
            >
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md"
            >
              Saved Jobs
            </TabsTrigger>
            <TabsTrigger
              value="recommended"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-md"
            >
              Recommended
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {state.applications.length > 0 ? (
                  <div className="space-y-6">
                    {state.applications.slice(0, 3).map((application, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                              <Building className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{application.jobTitle || "Software Engineer"}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 mr-1" />
                                  {application.company || "Tech Company Inc"}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {application.location || "San Francisco, CA"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">{application.status || "Applied"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                    <p className="text-gray-500 mb-4">Start applying to jobs to track your applications here</p>
                    <Link to="/jobs">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                <CardTitle>Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {state.savedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {state.savedJobs.slice(0, 2).map((job, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 relative hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <button
                          className="absolute right-4 top-4 text-purple-700 hover:text-purple-900"
                          onClick={() => toggleSaveJob(job)}
                        >
                          <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
                        </button>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{job.title || "Senior React Developer"}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {job.company || "WebTech Solutions"}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location || "Remote"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-500">{job.postedDate || "Posted 2 days ago"}</div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved jobs</h3>
                    <p className="text-gray-500 mb-4">Save jobs you're interested in to apply later</p>
                    <Link to="/jobs">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Jobs Tab */}
          <TabsContent value="recommended">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                <CardTitle>Recommended Jobs</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Based on your skills: {state.profileData.skills.map((s) => s.name).join(", ")}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {state.recommendedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {state.recommendedJobs.slice(0, 3).map((job, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 relative hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="absolute right-4 top-4 flex items-center gap-2">
                          {job.matchPercentage && (
                            <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                              <Star className="h-3 w-3 mr-1" />
                              {job.matchPercentage || 85 + index * 5}% Match
                            </div>
                          )}
                          <button className="text-gray-400 hover:text-purple-700" onClick={() => toggleSaveJob(job)}>
                            <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current text-purple-700" : ""}`} />
                          </button>
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{job.title || "Full Stack Developer (React/Node)"}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {job.company || "Digital Innovations"}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location || state.profileData.location}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-500">{job.postedDate || "Posted 1 week ago"}</div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                              Apply Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No recommended jobs yet</h3>
                    <p className="text-gray-500 mb-4">Complete your profile to get personalized job recommendations</p>
                    <Link to="/profile">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">Complete Profile</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

