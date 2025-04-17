// src/pages/RecommendationsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import { recommendationService } from "../services/recommendation-service";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Bookmark, Sparkles, MapPin, Briefcase, Clock, DollarSign, ExternalLink } from 'lucide-react';

export default function RecommendationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchRecommendations(user.id);
    }
  }, [isAuthenticated, user]);

  const fetchRecommendations = async (userId) => {
    try {
      setLoading(true);
      const { success, recommendations } = await recommendationService.getRecommendationsForUser(userId);
      
      if (success) {
        setRecommendations(recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRecommendations = recommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(recommendations.length / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">AI Job Recommendations</h1>
          <Sparkles className="h-6 w-6 text-purple-700" />
        </div>
        
        {loading ? (
          <div className="text-center py-8">Loading recommendations...</div>
        ) : paginatedRecommendations.length > 0 ? (
          <>
            {paginatedRecommendations.map((job) => (
              <div key={job.id} className="bg-white rounded-lg border p-6 mb-4 relative shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute right-6 top-6 flex items-center">
                  <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-3">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {job.score}% Match
                  </div>
                  <button className="text-gray-400 hover:text-purple-700">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>

                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    {job.company}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {job.jobType.replace('_', ' ').toLowerCase()}
                  </div>
                  {job.salary && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {job.salary}
                    </div>
                  )}
                </div>

                {job.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <Link 
                      to={`/jobs/${job.id}`} 
                      className="flex items-center gap-1"
                    >
                      View Details
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild className="bg-purple-700 hover:bg-purple-800">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      Apply Now
                    </a>
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center mt-8">
              <nav className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recommendations available
          </div>
        )}
      </div>
    </div>
  );
}
