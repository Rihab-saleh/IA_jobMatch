"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, MapPin, Building, Star, Bookmark, Loader2 } from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { toast } from "sonner"
import { userService } from "../services/user-service"
import { recommendationService } from "../services/recommendation-service"

export default function DashboardPage() {
  const { user } = useAuth()
  const [state, setState] = useState({
    loading: true,
    savedJobs: [],
    applications: [],
    recommendedJobs: [],
    stats: {
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
      languages: [],
    },
  })
  const [completionPercentage, setCompletionPercentage] = useState(0)

  const calculateProfileCompletion = (profileData) => {
    let total = 0
    if (profileData.firstName) total += 4
    if (profileData.lastName) total += 4
    if (profileData.email) total += 4
    if (profileData.phone) total += 3
    if (profileData.location) total += 3
    if (profileData.position) total += 3
    if (profileData.bio) total += 3
    if (profileData.profilePicture) total += 1
    if (profileData.skills?.length >= 3) total += 20
    if (profileData.experiences?.length) total += 20
    if (profileData.formations?.length) total += 15
    if (profileData.certifications?.length) total += 10
    if (profileData.languages?.length) total += 10
    return Math.min(Math.round(total), 100)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?._id) return

        const [profileData, savedJobsResponse] = await Promise.all([
          userService.getFullProfile(user._id),
          userService.getSavedJobs(user._id) // Correction ici
        ])

        setState(prev => ({
          ...prev,
          loading: false,
          savedJobs: savedJobsResponse.data || [],
          profileData: {
            ...prev.profileData,
            ...profileData
          }
        }))
        setCompletionPercentage(calculateProfileCompletion(profileData))
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        toast.error("Failed to load dashboard data")
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [user])

  const toggleSaveJob = async (job) => {
    try {
      const originalJobs = state.savedJobs
      const isSaved = state.savedJobs.some(j => j.id === job.id)

      // Mise à jour optimiste
      setState(prev => ({
        ...prev,
        savedJobs: isSaved 
          ? prev.savedJobs.filter(j => j.id !== job.id)
          : [...prev.savedJobs, job]
      }))

      // Appel API corrigé
      await recommendationService.saveJob({
        ...job,
        _action: isSaved ? 'unsave' : 'save'
      })

      toast.success(`Job ${isSaved ? 'removed' : 'saved'} successfully`)
    } catch (error) {
      console.error("Job action failed:", error)
      toast.error("Failed to perform action")
      setState(prev => ({ ...prev, savedJobs: originalJobs }))
    }
  }
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        
        {/* Profile Completion Section */}
        <Card className="mb-8 border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-lg font-bold">{completionPercentage}%</div>
                <p className="text-sm text-gray-500">Profile Completion</p>
              </div>
              <Link to="/profile">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Saved Jobs Section */}
        <Tabs defaultValue="saved">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger value="saved" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              Saved Jobs ({state.savedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardContent className="pt-6">
                {state.savedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {state.savedJobs.map((job) => (
                      <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            <div className="flex items-center gap-2 mt-2 text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{job.company}</span>
                              <MapPin className="h-4 w-4 ml-2" />
                              <span>{job.location}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {job.skills?.map((skill, index) => (
                                <Badge key={index} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => toggleSaveJob(job)}
                            >
                              <Bookmark className={`h-5 w-5 ${state.savedJobs.some(j => j.id === job.id) ? 'text-purple-700 fill-current' : 'text-gray-400'}`} />
                            </Button>
                            <Link to={`/jobs/${job.id}`}>
                              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Posted {new Date(job.postDate).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {job.type}
                            </span>
                            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                              ${job.salary}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved jobs</h3>
                    <Link to="/jobs">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        Browse Jobs
                      </Button>
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