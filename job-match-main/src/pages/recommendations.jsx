"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { recommendationService } from "../services/recommendation-service"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Bookmark, Sparkles, MapPin, Briefcase, DollarSign, Loader, AlertTriangle, ArrowUpRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [savedJobs, setSavedJobs] = useState([])
  const [savingJobs, setSavingJobs] = useState({})
  const [recommendationType, setRecommendationType] = useState("saved")

  useEffect(() => {
    // Fetch saved jobs first and decide recommendation type based on that
    if (isAuthenticated && user?._id) {
      fetchSavedJobs(user._id).then((jobs) => {
        if (jobs && jobs.length > 0) {
          setSavedJobs(jobs)
          setRecommendationType("saved")
        } else {
          setRecommendationType("general")
        }
      })
    }
  }, [isAuthenticated, user])

  // Single effect to handle fetching recommendations when recommendationType changes
  useEffect(() => {
    // Fetch recommendations only if the user is authenticated and recommendation type is set
    if (isAuthenticated && user?._id) {
      fetchRecommendations(user._id, recommendationType)
    }
  }, [isAuthenticated, user, recommendationType])

  const fetchRecommendations = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      setRecommendations([])
      setCurrentPage(1)

      toast.info("Generating recommendations...", { duration: 3000 })

      let response
      if (recommendationType === "saved") {
        response = await recommendationService.getSavedJobRecommendations(userId)
      } else {
        response = await recommendationService.getRecommendationsForUser(userId)
      }

      // Handle 204 No Content response
      if (response?.status === 204) {
        setRecommendations([])
        return
      }

      let recommendationsData = []
      if (response?.data?.recommendations) {
        recommendationsData = response.data.recommendations
      } else if (response?.recommendations) {
        recommendationsData = response.recommendations
      } else if (response?.savedJobs) {
        recommendationsData = response.savedJobs
      } else if (Array.isArray(response)) {
        recommendationsData = response
      }

      if (recommendationsData.length > 0) {
        const markedJobs = recommendationsData.map((job) => ({
          ...job,
          id: job.jobId || job.id || job._id,
          isSaved: savedJobs.some(
            (savedJob) => savedJob.jobId === (job.jobId || job.id) || savedJob._id === (job.jobId || job.id),
          ),
        }))

        setRecommendations(markedJobs)
      } else {
        // Don't throw error for empty array, just set empty state
        setRecommendations([])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      setError(error.message)
      toast.error("Loading error")
    } finally {
      setLoading(false)
    }
  }

  async function fetchSavedJobs(userId) {
    try {
      const response = await fetch(`http://localhost:3001/api/jobs/saved/${userId}`)
      if (!response.ok) {
        throw new Error("Server error")
      }
      const data = await response.json()
      setSavedJobs(data)
      return data
    } catch (error) {
      console.error("Fetch saved error:", error)
      return []
    }
  }

  const handleToggleSaveJob = async (job) => {
    if (!user?._id) return toast.error("Please login")
    if (!job.id) return toast.error("Missing ID")

    setSavingJobs((prev) => ({ ...prev, [job.id]: true }))

    try {
      if (job.isSaved) {
        const savedJob = savedJobs.find((sj) => sj.jobId === job.id)
        await fetch(`http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, {
          method: "DELETE",
        })
        setSavedJobs((prev) => prev.filter((j) => j._id !== savedJob._id))
        setRecommendations((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j)))
        toast.success("Removed from saved jobs")
      } else {
        const jobData = {
          userId: user._id,
          job: {
            jobId: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            salary: job.salary,
            url: job.url,
            datePosted: job.datePosted,
            jobType: job.jobType,
            source: job.source,
            skills: job.skills,
          },
        }

        const response = await fetch("http://localhost:3001/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        })

        const data = await response.json()
        setSavedJobs((prev) => [...prev, data.job || data])
        setRecommendations((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j)))
        toast.success("Successfully saved")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error(error.message || "Error")
    } finally {
      setSavingJobs((prev) => ({ ...prev, [job.id]: false }))
    }
  }

  const handleApplyNow = (job) => {
    if (!user) {
      toast.error("Please log in to apply for jobs")
      navigate("/login")
      return
    }
    window.open(job.url, "_blank", "noopener,noreferrer")
  }

  const handleViewDetails = (job) => {
    navigate("/job-details-view", {
      state: {
        job,
        fromRecommendationsPage: true,
      },
    })
  }

  const handleViewNewRecommendations = async () => {
    setRecommendationType("general")
    await fetchRecommendations(user._id)
  }

  const paginatedData = recommendations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(recommendations.length / itemsPerPage)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-blue-700" />
          <p className="text-gray-600">Finding the best opportunities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Your Recommendations</h1>
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewNewRecommendations} className="border-blue-200 text-blue-700">
              View New Recommendations
            </Button>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No recommendations available</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedData.map((job) => (
                <article
                  key={job.id}
                  className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1.5" />
                          {job.company}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1.5" />
                          {job.location}
                        </div>
                        {job.salary && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1.5" />
                            {job.salary}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.matchPercentage && (
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          {job.matchPercentage}%
                        </div>
                      )}
                      {user && (
                        <button
                          className={`${job.isSaved ? "text-blue-600" : "text-gray-400"} hover:text-blue-600`}
                          onClick={() => handleToggleSaveJob(job)}
                          disabled={savingJobs[job.id]}
                        >
                          {savingJobs[job.id] ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {job.matchReason && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md mb-4 text-sm">
                      <strong>Why this recommendation:</strong> {job.matchReason}
                    </div>
                  )}

                  <div
                    className="text-gray-700 mb-4"
                    dangerouslySetInnerHTML={{
                      __html: job.description?.substring(0, 265) + (job.description?.length > 265 ? "..." : ""),
                    }}
                  />

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills?.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="border-blue-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                      onClick={() => handleApplyNow(job)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleViewDetails(job)}
                    >
                      View Details
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  key={index}
                  variant={currentPage === index + 1 ? "default" : "outline"}
                  onClick={() => setCurrentPage(index + 1)}
                  className="rounded-full px-4 py-1"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
