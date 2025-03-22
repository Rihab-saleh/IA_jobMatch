"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
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
import { env } from "../config/env"

export default function DashboardPage() {
  const [user] = useState({
    _id: "67ddf59ff17dca464e8b41b5", // Use a valid ID
    person: { firstName: "John" },
  })

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
      skills: [],
      location: "",
      jobTitle: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile and skills
        const profileData = await userService.getUserProfile(user._id)
        const skillsData = await userService.getUserSkills(user._id)

        // Create search parameters from user data
        const searchParams = {
          what: profileData?.profile?.jobTitle || "",
          where: profileData?.profile?.location || "",
          skills: skillsData?.map((skill) => skill.name).join(",") || "",
        }

        // Fetch jobs data in parallel
        let applications = []
        let savedJobs = []
        let recommendedJobs = []

        try {
          const jobsData = await userService.getScrapedJobs(searchParams)
          applications = jobsData?.results || []
        } catch (error) {
          console.error("Error fetching applications:", error)
        }

        try {
          const savedJobsData = await userService.getAllJobs()
          savedJobs = savedJobsData?.results?.filter((job) => job.isSaved) || []
        } catch (error) {
          console.error("Error fetching saved jobs:", error)
        }

        // Only fetch recommendations if enabled in environment
        if (env.enableJobRecommendations) {
          try {
            const recommendedData = await userService.searchJobsBySkills({
              skills: skillsData?.map((skill) => skill.name) || [],
              location: profileData?.profile?.location || "",
            })
            recommendedJobs = recommendedData?.results || []
          } catch (error) {
            console.error("Error fetching recommended jobs:", error)
          }
        }

        // Update state with fetched data
        setState({
          loading: false,
          savedJobs: savedJobs,
          applications: applications,
          recommendedJobs: recommendedJobs.map((job) => ({
            ...job,
            matchScore: Math.floor(Math.random() * 30) + 70, // Simulate match score
            postedDate: job.created || new Date().toISOString(),
          })),
          profileData: {
            skills: skillsData || [],
            location: profileData?.profile?.location || "",
            jobTitle: profileData?.profile?.jobTitle || "",
          },
          stats: {
            totalApplications: applications.length || 0,
            interviews: applications.filter((app) => app.status === "interview").length || 0,
            profileViews: Math.floor(Math.random() * 50) + 10, // Simulate profile views
          },
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        setState((prev) => ({ ...prev, loading: false }))
      }
    }

    if (user?._id) fetchData()
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

      // Show success message
      const message = updatedJob.isSaved ? "Job saved successfully" : "Job removed from saved list"
      console.log(message)
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">
          Welcome back, {user.person.firstName} {state.profileData.jobTitle && `(${state.profileData.jobTitle})`}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(state.stats).map(([key, value]) => (
            <Card key={key}>
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

        {/* Profile Completion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg font-bold">75%</div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">Complete your profile to improve job matches</p>
              </div>
              <Link to="/profile">
                <Button className="mt-3 md:mt-0 bg-purple-700 hover:bg-purple-800">Complete Profile</Button>
              </Link>
            </div>
            <Progress value={75} className="h-2 bg-gray-200" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Personal Information</h3>
                  <p className="text-sm text-gray-500">Basic details completed</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Work Experience</h3>
                  <p className="text-sm text-gray-500">2 experiences added</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium">Resume/CV</h3>
                  <p className="text-sm text-gray-500">Not uploaded</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="applications">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="saved">Saved Jobs</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {state.applications.length > 0 ? (
                  <div className="space-y-6">
                    {state.applications.slice(0, 3).map((application, index) => (
                      <div key={application.id || index} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                              {application.company?.logo ? (
                                <img
                                  src={application.company.logo || "/placeholder.svg"}
                                  alt={application.company.display_name || "Company"}
                                  className="object-contain p-1"
                                />
                              ) : (
                                <Building className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold">{application.title || "Job Position"}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <Building className="h-4 w-4 mr-1" />
                                  {application.company?.display_name || "Company Name"}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {application.location?.display_name || "Location"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={
                              application.status === "interview"
                                ? "success"
                                : application.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {application.status || "Applied"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                    <p className="text-gray-500 mb-4">Start applying to jobs to track your applications here</p>
                    <Link to="/jobs">
                      <Button className="bg-purple-700 hover:bg-purple-800">Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {state.savedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {state.savedJobs.map((job, index) => (
                      <div key={job.id || index} className="border rounded-lg p-4 relative">
                        <button
                          className="absolute right-4 top-4 text-purple-700 hover:text-purple-900"
                          onClick={() => toggleSaveJob(job)}
                        >
                          <Bookmark className="h-5 w-5 fill-current" />
                        </button>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                            {job.company?.logo ? (
                              <img
                                src={job.company.logo || "/placeholder.svg"}
                                alt={job.company.display_name || "Company"}
                                className="object-contain p-1"
                              />
                            ) : (
                              <Building className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{job.title || "Job Position"}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {job.company?.display_name || "Company Name"}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location?.display_name || "Location"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Posted {new Date(job.created || Date.now()).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/jobs/${job.id || index}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                            <Link to={`/apply/${job.id || index}`}>
                              <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                                Apply Now
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved jobs</h3>
                    <p className="text-gray-500 mb-4">Save jobs you're interested in to apply later</p>
                    <Link to="/jobs">
                      <Button className="bg-purple-700 hover:bg-purple-800">Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommended Jobs Tab */}
          <TabsContent value="recommended">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Jobs</CardTitle>
                <p className="text-sm text-gray-500 mt-2">
                  Based on your skills: {state.profileData.skills.map((s) => s.name).join(", ")}
                </p>
              </CardHeader>
              <CardContent>
                {state.recommendedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {state.recommendedJobs.map((job, index) => (
                      <div key={job.id || index} className="border rounded-lg p-4 relative">
                        <div className="absolute right-4 top-4 flex items-center gap-2">
                          <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {job.matchScore || 85}% Match
                          </div>
                          <button className="text-gray-400 hover:text-purple-700" onClick={() => toggleSaveJob(job)}>
                            <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current text-purple-700" : ""}`} />
                          </button>
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border shrink-0 flex items-center justify-center">
                            {job.company?.logo ? (
                              <img
                                src={job.company.logo || "/placeholder.svg"}
                                alt={job.company.display_name || "Company"}
                                className="object-contain p-1"
                              />
                            ) : (
                              <Building className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{job.title || "Job Position"}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                {job.company?.display_name || "Company Name"}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {job.location?.display_name || "Location"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Posted {new Date(job.postedDate || job.created || Date.now()).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/jobs/${job.id || index}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                            <Link to={`/apply/${job.id || index}`}>
                              <Button size="sm" className="bg-purple-700 hover:bg-purple-800">
                                Apply Now
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                    <p className="text-gray-500 mb-4">Add more skills to your profile to get job recommendations</p>
                    <Link to="/profile">
                      <Button className="bg-purple-700 hover:bg-purple-800">Update Skills</Button>
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

