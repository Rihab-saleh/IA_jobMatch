import { useEffect, useState } from "react";
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
  const itemsPerPage = 5; // Nombre de recommandations par page

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchRecommendations(user.id);
    }
  }, [isAuthenticated, user]);

  const fetchRecommendations = async (userId) => {
    try {
      setLoading(true);
      const data = await recommendationService.getRecommendationsForUser(userId);
      console.log("Fetched recommendations:", data);

      // Vérifiez si les données sont valides avant de les définir
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        console.error("Invalid data structure:", data);
        setRecommendations([]);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les recommandations paginées
  const paginatedRecommendations = recommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">AI Job Recommendations</h1>
          <Sparkles className="h-6 w-6 text-purple-700" />
        </div>
        <p className="text-gray-600 mb-8">
          Personalized job recommendations based on your profile, skills, and preferences
        </p>
        {loading ? (
          <p>Loading recommendations...</p>
        ) : paginatedRecommendations && paginatedRecommendations.length > 0 ? (
          paginatedRecommendations.map((job) => (
            <div key={job.id} className="bg-white rounded-lg border p-6 mb-4 relative">
              <div className="absolute right-6 top-6 flex items-center">
                <div className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full flex items-center mr-3">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {job.score}% Match
                </div>
                <button className="text-gray-400 hover:text-purple-700">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
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
                  {job.jobType}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salary}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {job.skills && job.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                {job.url ? (
                  <Button variant="outline" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      View Details <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    No Details Available
                  </Button>
                )}
                <Button className="bg-purple-700 hover:bg-purple-800">Apply Now</Button>
              </div>
            </div>
          ))
        ) : (
          <p>No recommendations available at the moment.</p>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">{currentPage}</span>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(recommendations.length / itemsPerPage))
              )
            }
            disabled={currentPage === Math.ceil(recommendations.length / itemsPerPage)}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}