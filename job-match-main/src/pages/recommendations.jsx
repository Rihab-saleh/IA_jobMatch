// src/pages/RecommendationsPage.jsx
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
  const [error, setError] = useState(null);
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
      setError(null);
      
      const response = await recommendationService.getJobRecommendations(userId);
      console.log("API Response Data:", response.data);

      // Correction clé - Vérification des deux structures possibles
      const recommendationsData = response.data?.data?.recommendations || 
                                 response.data?.recommendations || 
                                 [];

      if (recommendationsData.length > 0) {
        setRecommendations(recommendationsData);
      } else {
        throw new Error("Aucune recommandation disponible");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setError(error.message || "Erreur lors du chargement des recommandations");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedData = recommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(recommendations.length / itemsPerPage);

  const formatScore = (score) => {
    return score?.toFixed?.(1) || 'N/A';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button 
          onClick={() => fetchRecommendations(user.id)}
          className="mt-4"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucune recommandation disponible</p>
        <p className="mt-2 text-sm">
          Essayez de mettre à jour votre profil ou de modifier vos critères
        </p>
        <Button 
          onClick={() => fetchRecommendations(user.id)}
          className="mt-4"
          variant="outline"
        >
          Actualiser
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <h1 className="text-3xl font-bold">Recommandations d'emplois</h1>
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>

        <div className="space-y-6">
          {paginatedData.map((job) => (
            <article 
              key={`${job.id}-${job.source}`}
              className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      {job.company || 'Entreprise non spécifiée'}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      {job.location || 'Localisation non spécifiée'}
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
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    {formatScore(job.score)}%
                  </div>
                  <button className="text-gray-400 hover:text-purple-600">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="border-purple-200 text-purple-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-gray-600 mb-4">
                {job.description?.substring(0, 200)}...
              </p>

              <div className="flex flex-wrap gap-3">
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
                    Postuler
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              
              <div className="flex items-center px-4">
                Page {currentPage} sur {totalPages}
              </div>

              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}