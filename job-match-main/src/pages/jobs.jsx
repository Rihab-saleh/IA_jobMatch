"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Search, MapPin, Bookmark, Loader, Briefcase, Calendar, DollarSign, Filter, X, ChevronDown, Clock, Building, ArrowUpRight } from 'lucide-react'
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useAuth } from "../contexts/auth-context"
import { toast } from "sonner"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"

export default function JobsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // State initialization
  const [jobs, setJobs] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    location: searchParams.get("location") || "",
    minSalary: "",
    jobType: "any",
    datePosted: "any",
    limit: 20,
  })
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState("")
  const [savingJobs, setSavingJobs] = useState({})
  const [initialSearchDone, setInitialSearchDone] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const api = axios.create({
    baseURL: "http://localhost:3001/api/jobs",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  })

  // Helper functions
  const isValidDate = (dateString) => {
    if (!dateString) return false
    const date = new Date(dateString)
    return !isNaN(date.getTime())
  }

  const formatDateDisplay = (dateString) => {
    if (!isValidDate(dateString)) return "Unknown date"
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  const normalizeDate = (dateString) => {
    if (!isValidDate(dateString)) return new Date().toISOString()
    return new Date(dateString).toISOString()
  }

  // Calculate how long ago a job was posted
  const getTimeAgo = (dateString) => {
    if (!isValidDate(dateString)) return "Recently"

    const now = new Date()
    const postedDate = new Date(dateString)
    const diffInMs = now - postedDate
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  // Fetch saved jobs for the current user
  const fetchSavedJobs = async () => {
    if (!user?._id) return

    try {
      const response = await fetch(`http://localhost:3001/api/jobs/saved/${user._id}`)
      if (!response.ok) throw new Error("Failed to fetch saved jobs")
      const data = await response.json()
      setSavedJobs(data || [])

      // Update jobs with saved status
      setJobs((prevJobs) =>
        prevJobs.map((job) => ({
          ...job,
          isSaved: data.some((savedJob) => savedJob.jobId === job.id),
        })),
      )
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
      toast.error("Failed to load saved jobs")
    }
  }

  // Main jobs fetching function
  const fetchJobs = async (signal) => {
    try {
      setLoading(true)
      setError("")

      const requestBody = {
        ...filters,
        minSalary: filters.minSalary ? Number(filters.minSalary) : null,
        jobType: filters.jobType === "any" ? "any" : filters.jobType.replace(" ", "_").toLowerCase(),
      }

      const response = await api.post("/search", requestBody, {
        signal,
        timeout: 30000,
      })

      const jobsData = response.data.jobs || []
      const markedJobs = jobsData.map((job) => ({
        ...job,
        datePosted: normalizeDate(job.datePosted),
        isSaved: savedJobs.some((savedJob) => savedJob.jobId === job.id),
      }))

      setJobs(markedJobs)
      setHasMore(jobsData.length >= filters.limit)
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled:", err.message)
      } else if (err.code === "ECONNABORTED") {
        setError("Request timed out. Please try again.")
      } else {
        setError(err.response?.data?.error || err.message || "Failed to load jobs. Please try again later.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Effect for fetching jobs with debounce
  useEffect(() => {
    const controller = new AbortController()
    let debounceTimer

    const debounceFetch = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => fetchJobs(controller.signal), 800)
    }

    if ((filters.query.trim() || filters.location.trim()) && initialSearchDone) {
      debounceFetch()
    } else if (!initialSearchDone && (filters.query.trim() || filters.location.trim())) {
      // Initial search with URL params
      fetchJobs(controller.signal)
      setInitialSearchDone(true)
    }

    return () => {
      controller.abort()
      clearTimeout(debounceTimer)
    }
  }, [filters, savedJobs, initialSearchDone])

  // Initialize from URL params and fetch saved jobs
  useEffect(() => {
    if (user?._id) {
      fetchSavedJobs()
    }
  }, [user])

  // Form submission handler
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setFilters((prev) => ({ ...prev, limit: 20 }))
    setInitialSearchDone(true)
    setShowMobileFilters(false)
  }

  // Filter change handler
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name !== "limit" && { limit: 20 }),
    }))
    if (name === "query" || name === "location") {
      setInitialSearchDone(true)
    }
  }

  // Load more jobs handler
  const loadMoreJobs = () => {
    setFilters((prev) => ({ ...prev, limit: prev.limit + 20 }))
  }

  // Save/unsave job handler
  const toggleSaveJob = async (job) => {
    if (!user?._id) {
      toast.error("Please log in to save jobs")
      return
    }

    if (!job.id) {
      toast.error("Missing job ID")
      return
    }

    setSavingJobs((prev) => ({ ...prev, [job.id]: true }))

    try {
      if (job.isSaved) {
        const savedJob = savedJobs.find((sj) => sj.jobId === job.id)

        if (!savedJob) {
          console.error("Saved job not found:", job.id)
          throw new Error("Saved job not found")
        }

        const response = await fetch(`http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, {
          method: "DELETE",
        })

        if (!response.ok) throw new Error("Failed to remove job")

        setSavedJobs((prev) => prev.filter((j) => j._id !== savedJob._id))
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j)))

        toast.success("Job removed from saved list")
      } else {
        const jobData = {
          userId: user._id,
          job: {
            jobId: job.id,
            title: job.title || "Untitled Position",
            company: job.company || "Unknown Company",
            location: job.location || "Remote",
            description: job.description || "",
            salary: job.salary || "",
            url: job.url || "",
            datePosted: normalizeDate(job.datePosted),
            jobType: job.jobType || "",
            source: job.source || "",
            skills: job.skills || [],
          },
        }

        const response = await fetch("http://localhost:3001/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to save job")
        }

        const data = await response.json()
        setSavedJobs((prev) => [...prev, data.job])
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j)))

        toast.success("Job saved successfully")
      }
    } catch (error) {
      console.error("Error toggling job save:", error)
      toast.error(error.message || "Failed to update job save status")
    } finally {
      setSavingJobs((prev) => ({ ...prev, [job.id]: false }))
    }
  }

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.minSalary) count++
    if (filters.jobType !== "any") count++
    if (filters.datePosted !== "any") count++
    return count
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      minSalary: "",
      jobType: "any",
      datePosted: "any",
    }))
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        /* Search header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8 shadow-lg">
            <h1 className="text-2xl font-bold text-white mb-4">Find Your Dream Job</h1>
            <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              placeholder="Job title, keywords, or company"
              className="pl-10 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
                </div>

                <div className="relative flex-grow md:border-l md:border-gray-200 pl-0 md:pl-3">
            <MapPin className="absolute left-3 md:left-6 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              placeholder="Location or remote"
              className="pl-10 md:pl-12 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
                </div>

                <Button type="submit" className="bg-blue-700 hover:bg-blue-800 px-6 shadow-sm">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : (
              <span style={{color:"white"}} >Search Jobs</span>
            )}
                </Button>
              </div>
            </form>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {getActiveFilterCount() > 0 && (
                  <Badge className="bg-blue-500 text-white ml-2">{getActiveFilterCount()}</Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Filters sidebar */}
          <div
            className={`${
              showMobileFilters ? "block" : "hidden"
            } lg:block w-full lg:w-1/4 bg-white rounded-xl shadow-sm p-6 space-y-6 h-fit sticky top-4 border border-blue-200`}
          >
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto"
                >
                  Reset all
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-800">Minimum Salary</h3>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    placeholder="Minimum annual salary"
                    value={filters.minSalary}
                    onChange={(e) => handleFilterChange("minSalary", e.target.value)}
                    type="number"
                    min="0"
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-800">Job Type</h3>
                </div>
                <select
                  value={filters.jobType}
                  onChange={(e) => handleFilterChange("jobType", e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="any">Any Type</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="font-medium text-gray-800">Date Posted</h3>
                </div>
                <select
                  value={filters.datePosted}
                  onChange={(e) => handleFilterChange("datePosted", e.target.value)}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="any">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jobs list */}
          <div className="w-full lg:w-3/4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <X className="h-4 w-4 text-red-500" />
                  </div>
                  <span className="text-red-700">{error}</span>
                </div>
                <Button
                  onClick={() => setError("")}
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  {jobs.length > 0 ? (
                    <>
                      <span className="text-blue-600">{jobs.length}</span> {jobs.length === 1 ? "job" : "jobs"} found
                    </>
                  ) : loading ? (
                    "Searching for jobs..."
                  ) : (
                    "Enter search criteria to find jobs"
                  )}
                </h2>
                {jobs.length > 0 && <div className="text-sm text-gray-500">Sorted by relevance</div>}
              </div>
            </div>

            {/* Loading skeletons */}
            {loading && jobs.length === 0 && (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                    <div className="flex justify-between">
                      <div>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-4" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="flex gap-2 mb-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-24 rounded-md" />
                      <Skeleton className="h-10 w-28 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow-sm p-6 relative hover:shadow-md transition-all duration-300 border border-transparent hover:border-blue-100"
                >
                  <button
                    onClick={() => toggleSaveJob(job)}
                    className={`absolute right-4 top-4 p-2 rounded-full transition-colors ${
                      job.isSaved
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title={job.isSaved ? "Remove from saved jobs" : "Save job"}
                    disabled={savingJobs[job.id]}
                  >
                    {savingJobs[job.id] ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
                    )}
                  </button>

                  <h3 className="text-xl font-semibold mb-1 pr-10 text-gray-800">{job.title}</h3>

                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">{job.company}</span>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.source && (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        {job.source?.toUpperCase()}
                      </Badge>
                    )}
                    {job.jobType && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                        {job.jobType?.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    )}
                    {job.datePosted && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(job.datePosted)}</span>
                      </div>
                    )}
                  </div>

                  {job.salary && (
                    <div className="flex items-center gap-1 mb-4 text-gray-800 font-medium">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span>{job.salary}</span>
                    </div>
                  )}

                  {job.skills && job.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 5 && (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500">
                            +{job.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() =>
                        navigate("/job-details-view", {
                          state: {
                            job,
                            fromJobsPage: true,
                          },
                        })
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}

              {hasMore && jobs.length > 0 && (
                <div className="text-center py-8">
                  <Button
                    onClick={loadMoreJobs}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg shadow-sm"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="h-5 w-5 animate-spin" />
                        Loading more jobs...
                      </div>
                    ) : (
                      "Load More Jobs"
                    )}
                  </Button>
                </div>
              )}

              {!loading && jobs.length === 0 && !error && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {filters.query || filters.location
                      ? "No jobs found matching your criteria"
                      : "Start your job search"}
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {filters.query || filters.location
                      ? "Try adjusting your search filters or try a different search term"
                      : "Enter a job title, keyword, or location to find relevant job opportunities"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
