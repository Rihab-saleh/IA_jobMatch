"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Bookmark, Loader } from "lucide-react"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"

export default function JobsPage() {
  const [savedJobs, setSavedJobs] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedJobs')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [jobs, setJobs] = useState([])
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    minSalary: '',
    jobType: 'any',
    datePosted: 'any',
    limit: 20
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)

  const api = axios.create({
    baseURL: 'http://localhost:3001/api/jobs',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  useEffect(() => {
    const controller = new AbortController()
    let debounceTimer

    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError('')
        
        const requestBody = {
          ...filters,
          minSalary: filters.minSalary ? Number(filters.minSalary) : null,
          jobType: filters.jobType === 'any' ? 'any' : filters.jobType.replace(' ', '_').toLowerCase()
        }

        const response = await api.post('/search', requestBody, {
          signal: controller.signal
        })

        setJobs(prev => {
          const newJobs = response.data.jobs
          setHasMore(newJobs.length >= filters.limit)
          return filters.limit > 20 ? [...prev, ...newJobs] : newJobs
        })
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.error || err.message || 'Error searching jobs')
          setJobs([])
        }
      } finally {
        setLoading(false)
      }
    }

    const debounceFetch = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(fetchJobs, 500)
    }

    debounceFetch()

    return () => {
      controller.abort()
      clearTimeout(debounceTimer)
    }
  }, [filters])

  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs))
  }, [savedJobs])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, limit: 20 }))
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name !== 'limit' && { limit: 20 })
    }))
  }

  const loadMoreJobs = () => {
    setFilters(prev => ({ ...prev, limit: prev.limit + 20 }))
  }

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' }
      return new Date(dateString).toLocaleDateString('fr-FR', options)
    } catch {
      return 'Date inconnue'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <form onSubmit={handleSearchSubmit} className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Poste recherché"
              className="pl-10"
            />
          </div>
          
          <div className="relative flex-grow">
            <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              placeholder="Localisation"
              className="pl-10"
            />
          </div>

          <Button 
            type="submit"
            className="bg-purple-700 hover:bg-purple-800 px-6"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Recherche...
              </div>
            ) : 'Rechercher'}
          </Button>
        </div>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 bg-white rounded-lg border p-6 space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Salaire minimum (€)</h3>
            <Input
              placeholder="Salaire minimum"
              value={filters.minSalary}
              onChange={(e) => handleFilterChange('minSalary', e.target.value)}
              type="number"
              min="0"
            />
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Type de contrat</h3>
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange('jobType', e.target.value)}
              className="w-full p-2 border rounded"
            >
              {['any', 'full_time', 'part_time', 'contract', 'internship'].map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium mb-3">Date de publication</h3>
            <select
              value={filters.datePosted}
              onChange={(e) => handleFilterChange('datePosted', e.target.value)}
              className="w-full p-2 border rounded"
            >
              {['any', 'today', 'week', 'month'].map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</div>}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">
              {jobs.length} offre{jobs.length !== 1 ? 's' : ''} trouvée{jobs.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg border p-6 relative hover:shadow-md transition-shadow">
                <button
                  onClick={() => setSavedJobs(prev => 
                    prev.some(j => j.id === job.id) 
                      ? prev.filter(j => j.id !== job.id) 
                      : [...prev, job]
                  )}
                  className={`absolute right-4 top-4 ${
                    savedJobs.some(j => j.id === job.id) ? "text-purple-700" : "text-gray-400"
                  }`}
                >
                  <Bookmark className={`h-5 w-5 ${savedJobs.some(j => j.id === job.id) ? "fill-current" : ""}`} />
                </button>

                <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {job.source?.toUpperCase()}
                  </span>
                  {job.jobType && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {job.jobType?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  )}
                  {job.datePosted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {formatDate(job.datePosted)}
                    </span>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-600 text-sm mb-2">
                    {job.company} • {job.location}
                  </p>
                  {job.salary && (
                    <p className="text-sm font-medium text-purple-700">
                      Salaire: {job.salary}
                    </p>
                  )}
                </div>

                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-purple-700 text-white rounded text-sm font-medium hover:bg-purple-800 transition-colors"
                >
                  Voir l'offre ↗
                </a>
              </div>
            ))}

            {hasMore && jobs.length > 0 && (
              <div className="text-center mt-8">
                <Button 
                  onClick={loadMoreJobs}
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-800 px-8"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      Chargement...
                    </div>
                  ) : 'Voir plus'}
                </Button>
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Aucune offre trouvée avec ces critères
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}