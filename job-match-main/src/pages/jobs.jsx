"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Bookmark, Loader } from "lucide-react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/auth-context";
import { toast } from "sonner";

export default function JobsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    query: "",
    location: "",
    minSalary: "",
    jobType: "any",
    datePosted: "any",
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [savingJobs, setSavingJobs] = useState({});
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const api = axios.create({
    baseURL: "http://localhost:3001/api/jobs",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const formatDateDisplay = (dateString) => {
    if (!isValidDate(dateString)) return "Unknown date";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const normalizeDate = (dateString) => {
    if (!isValidDate(dateString)) return new Date().toISOString();
    return new Date(dateString).toISOString();
  };

  const fetchSavedJobs = async () => {
    if (!user?._id) return;

    try {
      const response = await fetch(`http://localhost:3001/api/jobs/saved/${user._id}`);
      if (!response.ok) throw new Error("Failed to fetch saved jobs");
      const data = await response.json();
      setSavedJobs(data || []);
      
      setJobs(prevJobs => 
        prevJobs.map(job => ({
          ...job,
          isSaved: data.some(savedJob => savedJob.jobId === job.id)
        }))
      );
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      toast.error("Failed to load saved jobs");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let debounceTimer;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const requestBody = {
          ...filters,
          minSalary: filters.minSalary ? Number(filters.minSalary) : null,
          jobType: filters.jobType === "any" ? "any" : filters.jobType.replace(" ", "_").toLowerCase(),
        };

        const response = await api.post("/search", requestBody, {
          signal: controller.signal,
          timeout: 30000,
        });

        const jobsData = response.data.jobs || [];
        const markedJobs = jobsData.map(job => ({
          ...job,
          datePosted: normalizeDate(job.datePosted),
          isSaved: savedJobs.some(savedJob => savedJob.jobId === job.id)
        }));

        setJobs(markedJobs);
        setHasMore(jobsData.length >= filters.limit);
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("Request canceled:", err.message);
        } else if (err.code === "ECONNABORTED") {
          setError("Request timed out. Please try again.");
        } else {
          setError(err.response?.data?.error || err.message || "Failed to load jobs. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchJobs, 800);
    };

    if (filters.query.trim() || filters.location.trim()) {
      debounceFetch();
    } else {
      setJobs([]);
      setHasMore(false);
    }

    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [filters, savedJobs]);

  useEffect(() => {
    if (user?._id) {
      fetchSavedJobs();
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, limit: 20 }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name !== "limit" && { limit: 20 }),
    }));
  };

  const loadMoreJobs = () => {
    setFilters(prev => ({ ...prev, limit: prev.limit + 20 }));
  };

  const toggleSaveJob = async (job) => {
    if (!user?._id) {
      toast.error("Please log in to save jobs");
      return;
    }

    if (!job.id) {
      toast.error("Missing job ID");
      return;
    }

    setSavingJobs(prev => ({ ...prev, [job.id]: true }));

    try {
      if (job.isSaved) {
        const savedJob = savedJobs.find(sj => sj.jobId === job.id);
        
        if (!savedJob) {
          console.error("Saved job not found:", job.id);
          throw new Error("Saved job not found");
        }

        const response = await fetch(
          `http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, 
          { method: "DELETE" }
        );

        if (!response.ok) throw new Error("Failed to remove job");

        setSavedJobs(prev => prev.filter(j => j._id !== savedJob._id));
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, isSaved: false } : j
        ));

        toast.success("Job removed from saved list");
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
        };

        const response = await fetch("http://localhost:3001/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save job");
        }

        const data = await response.json();
        setSavedJobs(prev => [...prev, data.job]);
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, isSaved: true } : j
        ));

        toast.success("Job saved successfully");
      }
    } catch (error) {
      console.error("Error toggling job save:", error);
      toast.error(error.message || "Failed to update job save status");
    } finally {
      setSavingJobs(prev => ({ ...prev, [job.id]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSearchSubmit} className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              placeholder="Job title"
              className="pl-10"
            />
          </div>

          <div className="relative flex-grow">
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              placeholder="Location"
              className="pl-10"
            />
          </div>

          <Button type="submit" className="bg-purple-700 hover:bg-purple-800 px-6" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 bg-white rounded-lg border p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Minimum Salary ($)</h3>
            <Input
              placeholder="Minimum salary"
              value={filters.minSalary}
              onChange={(e) => handleFilterChange("minSalary", e.target.value)}
              type="number"
              min="0"
            />
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Job Type</h3>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange("jobType", e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="any">Any Type</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Date Posted</h3>
            <select
              value={filters.datePosted}
              onChange={(e) => handleFilterChange("datePosted", e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="any">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 rounded flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={() => setFilters(prev => ({ ...prev }))}
                className="text-purple-700 hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </h2>
          </div>

          <div className="space-y-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-lg border p-6 relative hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSaveJob(job)}
                  className={`absolute right-4 top-4 ${
                    job.isSaved ? "text-purple-700" : "text-gray-400"
                  } hover:text-purple-700`}
                  title={job.isSaved ? "Remove from saved jobs" : "Save job"}
                  disabled={savingJobs[job.id]}
                >
                  {savingJobs[job.id] ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
                  )}
                </button>

                <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{job.source?.toUpperCase()}</span>
                  {job.jobType && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {job.jobType?.replace(/_/g, " ").toUpperCase()}
                    </span>
                  )}
                  {job.datePosted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {formatDateDisplay(job.datePosted)}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-gray-600 text-sm mb-2">
                    {job.company} • {job.location}
                  </p>
                  {job.salary && <p className="text-sm font-medium text-black">Salary: {job.salary}</p>}
                </div>

                <div className="flex gap-2 mt-4">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-700 text-white rounded text-sm font-medium hover:bg-purple-800 transition-colors"
                  >
                    View Job ↗
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/job-details-view', { state: { job } })}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}

            {hasMore && jobs.length > 0 && (
              <div className="text-center mt-8">
                <Button onClick={loadMoreJobs} disabled={loading} className="bg-purple-700 hover:bg-purple-800 px-8">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    "Load More Jobs"
                  )}
                </Button>
              </div>
            )}

            {!loading && jobs.length === 0 && !error && (
              <div className="text-center py-12 text-gray-500">
                {filters.query || filters.location
                  ? "No jobs found matching your criteria"
                  : "Enter search criteria to find jobs"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}