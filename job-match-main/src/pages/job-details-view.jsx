;

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Bookmark,
  MapPin,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { toast } from "sonner";

export default function JobDetailsView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const job = state?.job;

  const isValidDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const normalizeDate = (dateString) => {
    if (!isValidDate(dateString)) return new Date().toISOString();
    return new Date(dateString).toISOString();
  };

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user?._id || !job?.id) return;

      try {
        const response = await fetch(`http://localhost:3001/api/jobs/saved/${user._id}`);
        if (!response.ok) throw new Error("Failed to fetch saved jobs");
        const savedJobs = await response.json();
        const isSaved = savedJobs.some(savedJob => savedJob.jobId === job.id);
        setSaved(isSaved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };

    checkSavedStatus();
  }, [user, job?.id]);

  const toggleSaveJob = async () => {
    if (!user?._id) {
      toast.error("Please log in to save jobs");
      return;
    }

    setSaving(true);

    try {
      if (saved) {
        const response = await fetch(`http://localhost:3001/api/jobs/saved/${user._id}`);
        if (!response.ok) throw new Error("Failed to fetch saved jobs");
        const savedJobs = await response.json();
        const savedJob = savedJobs.find(sj => sj.jobId === job.id);
        
        if (!savedJob) {
          throw new Error("Saved job not found");
        }

        const deleteResponse = await fetch(
          `http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, 
          { method: "DELETE" }
        );

        if (!deleteResponse.ok) throw new Error("Failed to remove job");
        setSaved(false);
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

        setSaved(true);
        toast.success("Job saved successfully");
      }
    } catch (error) {
      console.error("Error toggling job save:", error);
      toast.error(error.message || "Failed to update job save status");
    } finally {
      setSaving(false);
    }
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No job to display
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find details for this position.
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to recommendations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to jobs</span>
            </Button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Building className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                        <Building className="h-4 w-4 mr-1.5 text-blue-500" />
                        {job.company || "Company not specified"}
                      </span>
                      <span className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
                        {job.location || "Location not specified"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant={saved ? "default" : "outline"}
                      onClick={toggleSaveJob}
                      className="gap-2"
                      disabled={saving}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${saved ? "fill-white" : ""}`}
                      />
                      {saving ? "Saving..." : (saved ? "Saved" : "Save Job")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Job Type</p>
                    <p className="font-medium text-gray-900">
                      {job.type || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Salary</p>
                    <p className="font-medium text-gray-900">
                      {job.salary || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium text-gray-900">
                      {job.experience || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Posted Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(job.datePosted).toLocaleDateString() || "Unknown date"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {job.skills?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-sm py-1.5 px-3"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Card className="mb-8 border border-gray-200">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Job Description
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {job.description ? (
                    <div
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  ) : (
                    <p className="text-gray-500">No description provided</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {job.benefits?.length > 0 && (
              <Card className="mb-8 border border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Benefits
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={job.applyUrl || job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1 gap-2"
              >
                Apply Now
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/jobs")}
              >
                View Other Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}