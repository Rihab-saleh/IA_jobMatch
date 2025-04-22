"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../contexts/auth-context"
import { recommendationService } from "../services/recommendation-service"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Bookmark, Sparkles, MapPin, Briefcase, DollarSign, ExternalLink, Loader, AlertTriangle } from "lucide-react"
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
  const [retryCount, setRetryCount] = useState(0)
  const [rawResponse, setRawResponse] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchRecommendations(user._id)
      fetchSavedJobs(user._id)
    }
  }, [isAuthenticated, user, retryCount])

  const fetchRecommendations = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      setRecommendations([])

      toast.info("Génération des recommandations en cours...", {
        duration: 10000,
      })

      const response = await recommendationService.getRecommendationsForUser(userId)
      console.log("Raw API response:", response)
      setRawResponse(response) // Store raw response for debugging

      if (!response) {
        throw new Error("Aucune réponse du serveur")
      }

      // FIXED: Extract numeric keys from the response object
      let recommendationsData = []

      // Check if response has numeric keys (0, 1, 2, etc.)
      const hasNumericKeys = Object.keys(response).some((key) => !isNaN(Number.parseInt(key)))

      if (hasNumericKeys) {
        console.log("Response has numeric keys")
        // Extract only the numeric keys and their values
        recommendationsData = Object.keys(response)
          .filter((key) => !isNaN(Number.parseInt(key)))
          .map((key) => response[key])
      }
      // Case 1: Direct array in response
      else if (Array.isArray(response)) {
        console.log("Response is an array")
        recommendationsData = response
      }
      // Case 2: Response has a data property that is an array
      else if (Array.isArray(response.data)) {
        console.log("Response.data is an array")
        recommendationsData = response.data
      }
      // Case 3: Response has a data property with numeric keys
      else if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
        console.log("Response.data is an object")
        const hasNumericKeysInData = Object.keys(response.data).some((key) => !isNaN(Number.parseInt(key)))

        if (hasNumericKeysInData) {
          recommendationsData = Object.keys(response.data)
            .filter((key) => !isNaN(Number.parseInt(key)))
            .map((key) => response.data[key])
        } else {
          recommendationsData = Object.values(response.data)
        }
      }

      console.log("Processed recommendations:", recommendationsData)
      console.log("Number of recommendations:", recommendationsData.length)

      if (recommendationsData && recommendationsData.length > 0) {
        const markedJobs = recommendationsData.map((job) => ({
          ...job,
          id: job.id || job._id || Math.random().toString(36).substring(2, 9), // Ensure we have an ID
          isSaved: savedJobs.some(
            (savedJob) => savedJob.jobId === (job.id || job._id) || savedJob._id === (job.id || job._id),
          ),
        }))

        setRecommendations(markedJobs)
        toast.success(`${markedJobs.length} recommandations trouvées`)
      } else {
        throw new Error("Aucune recommandation disponible pour le moment")
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setError(error.message || "Erreur lors du chargement des recommandations")
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedJobs = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/jobs/saved/${userId}`)
      if (!response.ok) throw new Error("Erreur de chargement")
      const data = await response.json()
      setSavedJobs(data || [])
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
    }
  }

  const handleToggleSaveJob = async (job) => {
    if (!user?._id) {
      toast.error("Veuillez vous connecter pour sauvegarder des emplois")
      return
    }

    // Validate required fields before proceeding
    if (!job.id) {
      toast.error("ID de l'emploi manquant")
      return
    }

    if (!job.title) {
      toast.error("Titre de l'emploi manquant")
      return
    }

    if (!job.company) {
      toast.error("Entreprise manquante")
      return
    }

    setSavingJobs((prev) => ({ ...prev, [job.id]: true }))

    try {
      if (job.isSaved) {
        // Find the saved job to delete
        const savedJob = savedJobs.find((sj) => sj.jobId === job.id || sj._id === job.id)

        if (!savedJob) {
          console.error("Saved job not found:", job.id)
          throw new Error("Emploi sauvegardé non trouvé")
        }

        await fetch(`http://localhost:3001/api/jobs/saved/${user._id}/${savedJob._id}`, {
          method: "DELETE",
        })

        setSavedJobs((prev) => prev.filter((j) => j._id !== savedJob._id))
        setRecommendations((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: false } : j)))

        toast.success("Emploi retiré des favoris")
      } else {
        // Save new job with FLATTENED structure to match the schema
        const jobData = {
          userId: user._id,
          job: {
            jobId: job.id,
            title: job.title || "Titre non spécifié",
            company: job.company || "Entreprise non spécifiée",
            location: job.location || "Localisation non spécifiée",
            description: job.description || "",
            salary: job.salary || "",
            url: job.url || "",
            datePosted: job.datePosted || new Date().toISOString(),
            jobType: job.jobType || "",
            source: job.source || "",
            skills: job.skills || [],
          },
        }

        console.log("Saving job data:", jobData)

        const response = await fetch("http://localhost:3001/api/jobs/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error("Échec de la sauvegarde")
        }

        const data = await response.json()
        console.log("Save response:", data)

        // Check if we got a job object back
        const savedJob = data.job || data

        setSavedJobs((prev) => [...prev, savedJob])
        setRecommendations((prev) => prev.map((j) => (j.id === job.id ? { ...j, isSaved: true } : j)))

        toast.success("Emploi sauvegardé avec succès")
      }
    } catch (error) {
      console.error("Error saving job:", error)
      toast.error(error.message || "Échec de l'opération")
    } finally {
      setSavingJobs((prev) => ({ ...prev, [job.id]: false }))
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // For debugging - show raw response
  const showRawResponse = () => {
    if (rawResponse) {
      console.log("Raw response:", rawResponse)
      alert("Raw response logged to console")
    } else {
      alert("No response data available")
    }
  }

  // Pagination logic
  const paginatedData = recommendations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(recommendations.length / itemsPerPage)

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-purple-700" />
          <p className="text-gray-600">Recherche des meilleures opportunités...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700">
                Réessayer
              </Button>
              <Button variant="outline" onClick={showRawResponse} className="border-purple-300">
                Voir données brutes
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center py-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune recommandation disponible</h3>
            <p className="text-gray-500 mb-6">
              Essayez d'ajouter plus d'informations à votre profil ou de modifier vos critères
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry} className="bg-purple-600 hover:bg-purple-700">
                Actualiser les recommandations
              </Button>
              <Button variant="outline" onClick={showRawResponse} className="border-purple-300">
                Voir données brutes
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Vos recommandations</h1>
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <Button variant="outline" onClick={handleRetry} className="text-purple-700 border-purple-200">
            Actualiser
          </Button>
        </div>

        <div className="space-y-6">
          {paginatedData.map((job) => (
            <article
              key={job.id}
              className="bg-white rounded-xl border p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{job.title || "Titre non spécifié"}</h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      {job.company || "Entreprise non spécifiée"}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1.5" />
                      {job.location || "Localisation non spécifiée"}
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
                  <strong>Pourquoi cette recommandation :</strong> {job.matchReason}
                </div>
              )}

              <p className="text-gray-700 mb-4">
                {job.description?.substring(0, 265) + (job.description?.length > 265 ? "..." : "")}
              </p>

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
                  onClick={() => navigate("/job-details-view", { state: { job } })}
                  className="text-purple-700 hover:bg-purple-50"
                >
                  Voir détails
                </Button>
                <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <a
                    href={job.url || "#"}
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
            <nav className="flex gap-2 items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="px-4">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}
