"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, MapPin, Bookmark } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Checkbox } from "../components/ui/checkbox"
import { getJobs } from "../services/job-service" // Import the getJobs function

export default function JobsPage() {
  const [savedJobs, setSavedJobs] = useState([])
  const [jobs, setJobs] = useState([]) // State to store jobs

  useEffect(() => {
    async function fetchJobs() {
      try {
        const jobsData = await getJobs()
        setJobs(jobsData)
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
      }
    }

    fetchJobs()
  }, [])

  const toggleSaveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter((id) => id !== jobId))
    } else {
      setSavedJobs([...savedJobs, jobId])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Job Search</h1>
        <p className="text-gray-600 mb-6">Search for your desired job matching your skills</p>

        {/* Search Bar */}
        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter Job title"
                className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="relative flex-grow">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Enter location"
                className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Years of experience"
                className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <Button className="bg-purple-700 hover:bg-purple-800 px-6">Search</Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters */}
          <div className="w-full lg:w-1/4 bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filter</h2>
              <button className="text-sm text-gray-500">Clear all</button>
            </div>

            {/* Salary Range */}
            <div className="border-b pb-4 mb-4">
              <h3 className="font-medium mb-3">Salary Range</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Min" className="w-full" />
                <Input placeholder="Max" className="w-full" />
              </div>
            </div>

            {/* Job Type */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Job Type</h3>
                <button className="text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="all" defaultChecked className="text-purple-700 border-gray-300" />
                  <label htmlFor="all" className="text-sm">
                    All (2567)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="full-time" className="text-purple-700 border-gray-300" />
                  <label htmlFor="full-time" className="text-sm">
                    Full-Time (450)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="part-time" className="text-purple-700 border-gray-300" />
                  <label htmlFor="part-time" className="text-sm">
                    Part-Time (145)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="internship" className="text-purple-700 border-gray-300" />
                  <label htmlFor="internship" className="text-sm">
                    Internship (65)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="contract" className="text-purple-700 border-gray-300" />
                  <label htmlFor="contract" className="text-sm">
                    Contract (12)
                  </label>
                </div>
              </div>
            </div>

            {/* Work Mode */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Work Mode</h3>
                <button className="text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="on-site" className="text-purple-700 border-gray-300" />
                  <label htmlFor="on-site" className="text-sm">
                    On-Site
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remote" className="text-purple-700 border-gray-300" />
                  <label htmlFor="remote" className="text-sm">
                    Remote (180)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hybrid" className="text-purple-700 border-gray-300" />
                  <label htmlFor="hybrid" className="text-sm">
                    Hybrid (200)
                  </label>
                </div>
              </div>
            </div>

            {/* More filters would go here */}

            <button className="flex items-center justify-center w-full text-purple-700 font-medium">
              <span>Expand all</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* Job Listings */}
          <div className="w-full lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">All Jobs ({jobs.length})</h2>
              <div className="flex items-center">
                <span className="text-sm mr-2">Popular</span>
                <button className="text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg border p-6 relative">
                  <button
                    className={`absolute right-4 top-4 ${savedJobs.includes(job.id) ? "text-purple-700" : "text-gray-400 hover:text-purple-700"}`}
                    onClick={() => toggleSaveJob(job.id)}
                  >
                    <Bookmark className={`h-5 w-5 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                  </button>

                  <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                  <div className={`bg-${job.type === "FULL-TIME" ? "purple" : "green"}-100 text-${job.type === "FULL-TIME" ? "purple" : "green"}-800 text-xs font-medium px-2 py-0.5 rounded inline-block mb-2`}>
                    {job.type}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">Salary: {job.salary}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white border">
                      <img src={job.logo} alt={job.company} width={32} height={32} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.company}</p>
                      <p className="text-gray-500 text-xs">{job.location}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex-1 text-center py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50"
                    >
                      View details
                    </Link>
                    <Link
                      to={`/apply/${job.id}`}
                      className="flex-1 text-center py-2 bg-purple-700 text-white rounded text-sm font-medium hover:bg-purple-800"
                    >
                      Apply now
                    </Link>
                  </div>
                </div>
              ))}

              {/* More Job Cards */}
              <div className="text-center mt-8">
                <Link to="#" className="text-purple-700 font-medium hover:underline">
                  View more
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
