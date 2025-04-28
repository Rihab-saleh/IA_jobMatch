"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { recommendationService } from "../services/recommendation-service";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bookmark, Sparkles, MapPin, Briefcase, DollarSign, ExternalLink, Loader, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [savedJobs, setSavedJobs] = useState([]);
  const [savingJobs, setSavingJobs] = useState({});
  const [recommendationType, setRecommendationType] = useState("saved");

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchSavedJobs(user._id).then(() => {
        fetchRecommendations(user._id);
      });
    }
  }, [isAuthenticated, user, recommendationType]);

  const fetchRecommendations = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      setRecommendations([]);
      setCurrentPage(1);

      toast.info("Generating recommendations...", { duration: 3000 });

      let response;
      if (recommendationType === "saved") {
        response = await recommendationService.getSavedJobRecommendations(userId);
      } else {
        response = await recommendationService.getRecommendationsForUser(userId);
      }

      let recommendationsData = [];
      if (response?.data?.recommendations) {
        recommendationsData = response.data.recommendations;
      } else if (response?.recommendations) {
        recommendationsData = response.recommendations;
      } else if (response?.savedJobs) {
        recommendationsData = response.savedJobs;
      } else if (Array.isArray(response)) {
        recommendationsData = response;
      }

      if (recommendationsData.length > 0) {
        const markedJobs = recommendationsData.map((job) => ({
          ...job,
          id: job.jobId || job.id || job._id,
          isSaved: savedJobs.some(
            (savedJob) =>
              savedJob.jobId === (job.jobId || job.id) || savedJob._id === (job.jobId || job.id)
          ),
        }));

        setRecommendations(markedJobs);
      } else {
        throw new Error("No recommendations found");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(error.message);
      toast.error("Loading error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/jobs/saved/${userId}`);
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setSavedJobs(data?.savedJobs || data || []);
    } catch (error) {
      console.error("Fetch saved error:", error);
      toast.error("Error loading saved jobs");
    }
  };

  const handleToggleSaveJob = async (job) => {
    if (!user?._id) return toast.error("Please login");
    if (!job.id) return toast.error("Missing ID");

    setSavingJobs((prev) => ({ ...prev, [job.id]: true }));

    try {
      if (job.isSaved) {
        const savedJob = savedJobs.find((sj) => sj.jobId === job.id);
        await fetch(`http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, {
          method: "DELETE",
        });
        setSavedJobs((prev) => prev.filter((j) => j._id !== savedJob._id));
        setRecommendations((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j))
        );
        toast.success("Removed from saved jobs");
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
        };

        const response = await fetch("http://localhost:3001/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });

        const data = await response.json();
        setSavedJobs((prev) => [...prev, data.job || data]);
        setRecommendations((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j))
        );
        toast.success("Successfully saved");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Error");
    } finally {
      setSavingJobs((prev) => ({ ...prev, [job.id]: false }));
    }
  };

  const handleViewNewRecommendations = async () => {
    setRecommendationType("general");
    await fetchRecommendations(user._id);
  };

  const paginatedData = recommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-purple-700" />
          <p className="text-gray-600">Finding the best opportunities...</p>
        </div>
      </div>
    );
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Your Recommendations</h1>
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleViewNewRecommendations}
              className="border-purple-200 text-purple-700"
            >
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
                        <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          {job.matchPercentage}%
                        </div>
                      )}
                      <button
                        className={`${job.isSaved ? "text-purple-600" : "text-gray-400"} hover:text-purple-600`}
                        onClick={() => handleToggleSaveJob(job)}
                        disabled={savingJobs[job.id]}
                      >
                        {savingJobs[job.id] ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Bookmark className={`h-5 w-5 ${job.isSaved ? "fill-current" : ""}`} />
                        )}
                      </button>
                    </div>
                  </div>

                  {job.matchReason && (
                    <div className="bg-purple-50 text-purple-800 p-3 rounded-md mb-4 text-sm">
                      <strong>Why this recommendation:</strong> {job.matchReason}
                    </div>
                  )}

                  <div
                    className="text-gray-700 mb-4"
                    dangerouslySetInnerHTML={{
                      __html: job.description?.substring(0, 265) + (job.description?.length > 265 ? "..." : ""),
                    }}
                  />

                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        navigate("/job-details-view", {
                          state: { job },
                        })
                      }
                      className="text-purple-700 hover:bg-purple-50"
                    >
                      View details
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5"
                      >
                        Apply
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}