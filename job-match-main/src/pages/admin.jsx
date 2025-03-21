"use client"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Input } from "../components/ui/input"
import { Briefcase, Plus, Search, Trash2, Edit, Eye, Link2, BrainCircuit, User } from "lucide-react"
import { Skeleton } from "../components/ui/skeleton"
import { Badge } from "../components/ui/badge"

const API_BASE_URL = "http://localhost:5000/api"

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("jobs")
  const [jobs, setJobs] = useState({ scraped: [], external: [] })
  const [users, setUsers] = useState([])
  const [apiIntegrations, setApiIntegrations] = useState([])
  const [aiConfig, setAiConfig] = useState({ apiKey: "", model: "gpt-4o" })
  const [newApi, setNewApi] = useState({ name: "", apiKey: "", baseUrl: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState(null)
  const [jobsPage, setJobsPage] = useState(1)
  const [jobsTotalPages, setJobsTotalPages] = useState(1)
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [loading, setLoading] = useState({
    jobs: false,
    users: false,
    api: false,
    ai: false
  })

  // Configuration Axios
  axios.interceptors.request.use(config => {
    const token = localStorage.getItem("token")
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  axios.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token")
        navigate("/login")
      }
      return Promise.reject(error)
    }
  )

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) navigate("/login")

    const controller = new AbortController()
    const fetchData = async () => {
      try {
        switch (activeTab) {
          case 'jobs': await fetchJobs(controller.signal); break
          case 'users': await fetchUsers(controller.signal); break
          case 'api': await fetchApiIntegrations(controller.signal); break
          case 'ai': await fetchAiConfig(controller.signal); break
        }
      } catch (err) {
        if (!axios.isCancel(err)) setError(`Erreur: ${err.message}`)
      }
    }
    fetchData()
    return () => controller.abort()
  }, [activeTab, jobsPage, usersPage])

  const fetchJobs = async (signal) => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }))
      const [scraped, external] = await Promise.all([
        axios.get(`${API_BASE_URL}/jobs/scraped/all`, { 
          params: { page: jobsPage, limit: 10, query: searchTerm }, 
          signal 
        }),
        axios.get(`${API_BASE_URL}/jobs/external/all`, { 
          params: { page: jobsPage, limit: 10, query: searchTerm }, 
          signal 
        })
      ])
      setJobs({
        scraped: scraped.data.results.map(j => ({ ...j, source: 'scraped' })),
        external: external.data.results.map(j => ({ ...j, source: 'external' }))
      })
      setJobsTotalPages(Math.max(
        scraped.data.pagination?.pages || 1,
        external.data.pagination?.pages || 1
      ))
    } catch (err) {
      handleFetchError(err, "Erreur jobs")
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }))
    }
  }

  const fetchUsers = async (signal) => {
    try {
      setLoading(prev => ({ ...prev, users: true }))
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        params: { page: usersPage, limit: 10 },
        signal
      })
      setUsers(response.data.users.map(user => ({
        ...user,
        name: [user.person?.firstName, user.person?.lastName].filter(Boolean).join(' ') || 'Anonyme',
        email: user.email || user.person?.email || 'Non spécifié',
        id: user._id
      })))
      setUsersTotalPages(response.data.pagination?.pages || 1)
    } catch (err) {
      handleFetchError(err, "Erreur utilisateurs")
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }

  const fetchApiIntegrations = async (signal) => {
    try {
      setLoading(prev => ({ ...prev, api: true }))
      const response = await axios.get(`${API_BASE_URL}/admin/api-integrations`, { signal })
      setApiIntegrations(response.data)
    } catch (err) {
      handleFetchError(err, "Erreur API")
    } finally {
      setLoading(prev => ({ ...prev, api: false }))
    }
  }

  const fetchAiConfig = async (signal) => {
    try {
      setLoading(prev => ({ ...prev, ai: true }))
      const response = await axios.get(`${API_BASE_URL}/admin/ai-config`, { signal })
      setAiConfig(response.data)
    } catch (err) {
      handleFetchError(err, "Erreur IA")
    } finally {
      setLoading(prev => ({ ...prev, ai: false }))
    }
  }

  const handleFetchError = (err, message) => {
    if (!axios.isCancel(err)) {
      setError(`${message}: ${err.response?.data?.message || err.message}`)
      console.error(err)
    }
  }

  const handleDelete = async (id, type, source) => {
    if (!window.confirm("Confirmer la suppression ?")) return
    try {
      setProcessingId(id)
      if (type === 'user') {
        await axios.delete(`${API_BASE_URL}/admin/user/delete/${id}`)
        setUsers(prev => prev.filter(u => u.id !== id))
      } else {
        await axios.delete(`${API_BASE_URL}/admin/jobs/delete/${id}`)
        setJobs(prev => ({
          scraped: source === 'scraped' ? prev.scraped.filter(j => j._id !== id) : prev.scraped,
          external: source === 'external' ? prev.external.filter(j => j._id !== id) : prev.external
        }))
      }
    } catch (err) {
      setError(`Échec suppression: ${err.response?.data?.message || err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      setProcessingId(userId)
      const response = await axios.put(`${API_BASE_URL}/admin/user/toggleStatus/${userId}`)
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive: response.data.isActive } : user
      ))
    } catch (err) {
      setError(`Échec statut: ${err.response?.data?.message || err.message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const renderSkeleton = (items = 5) => (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  )

  const renderPagination = (page, totalPages, setPage) => (
    <div className="flex justify-between items-center mt-4">
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => setPage(p => Math.max(p - 1, 1))}
      >
        Précédent
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} sur {totalPages}
      </span>
      <Button
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => setPage(p => p + 1)}
      >
        Suivant
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-6">
        <Button variant="ghost" onClick={handleLogout}>
          Déconnexion
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="jobs">
            <Briefcase className="w-4 h-4 mr-2" /> Offres
          </TabsTrigger>
          <TabsTrigger value="users">
            <User className="w-4 h-4 mr-2" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="api">
            <Link2 className="w-4 h-4 mr-2" /> API
          </TabsTrigger>
          <TabsTrigger value="ai">
            <BrainCircuit className="w-4 h-4 mr-2" /> IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <div className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des offres..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link to="/post-job" className="gap-2">
                  <Plus className="w-4 h-4" /> Nouvelle offre
                </Link>
              </Button>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {loading.jobs ? renderSkeleton() : (
              <div className="space-y-4">
                <div className="border rounded-lg divide-y">
                  {[...jobs.scraped, ...jobs.external].map(job => (
                    <div key={job._id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{job.title}</span>
                          <Badge variant="outline">
                            {job.source === 'scraped' ? 'Scrapé' : 'Externe'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {job.company?.display_name} • {job.location?.display_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/jobs/${job._id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(job._id, 'job', job.source)}
                          disabled={processingId === job._id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(jobsPage, jobsTotalPages, setJobsPage)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher utilisateurs..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            {loading.users ? renderSkeleton() : (
              <div className="space-y-4">
                <div className="border rounded-lg divide-y">
                  {users.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={processingId === user.id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, 'user')}
                          disabled={processingId === user.id}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(usersPage, usersTotalPages, setUsersPage)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api">
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 p-6 border rounded-lg">
                <h3 className="text-lg font-semibold">Nouvelle API</h3>
                <Input
                  placeholder="Nom API"
                  value={newApi.name}
                  onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                />
                <Input
                  placeholder="Clé API"
                  value={newApi.apiKey}
                  onChange={(e) => setNewApi({ ...newApi, apiKey: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  value={newApi.baseUrl}
                  onChange={(e) => setNewApi({ ...newApi, baseUrl: e.target.value })}
                />
                <Button
                  onClick={async () => {
                    try {
                      setLoading(prev => ({ ...prev, api: true }))
                      const response = await axios.post(`${API_BASE_URL}/admin/api-integrations`, newApi)
                      setApiIntegrations([...apiIntegrations, response.data])
                      setNewApi({ name: "", apiKey: "", baseUrl: "" })
                    } catch (err) {
                      setError(err.response?.data?.message || "Erreur")
                    } finally {
                      setLoading(prev => ({ ...prev, api: false }))
                    }
                  }}
                  disabled={loading.api}
                >
                  {loading.api ? 'Chargement...' : 'Ajouter API'}
                </Button>
              </div>

              <div className="border rounded-lg divide-y">
                {apiIntegrations.map(api => (
                  <div key={api._id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{api.name}</span>
                        <Badge variant={api.status === 'active' ? 'default' : 'secondary'}>
                          {api.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{api.baseUrl}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await axios.put(`${API_BASE_URL}/admin/api-integrations/${api._id}/toggle`)
                          setApiIntegrations(prev =>
                            prev.map(a =>
                              a._id === api._id ? { ...a, status: response.data.status } : a
                            )
                          )
                        } catch (err) {
                          setError("Erreur modification")
                        }
                      }}
                    >
                      {api.status === 'active' ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="mt-6 max-w-2xl mx-auto">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  setLoading(prev => ({ ...prev, ai: true }))
                  await axios.post(`${API_BASE_URL}/admin/ai-config`, aiConfig)
                  setError("")
                  alert("Config sauvegardée !")
                } catch (err) {
                  setError(err.response?.data?.message || "Erreur")
                } finally {
                  setLoading(prev => ({ ...prev, ai: false }))
                }
              }}
              className="space-y-6 p-6 border rounded-lg"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Clé OpenAI</label>
                  <Input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Modèle</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={aiConfig.model}
                    onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button
                  type="submit"
                  disabled={loading.ai}
                  className="w-full"
                >
                  {loading.ai ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}