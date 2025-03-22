"use client"

import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import {
  Briefcase,
  Search,
  Trash2,
  RefreshCw,
  Sparkles,
  User,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { adminService } from "../services/admin-service"

export default function AdminPage() {
  const [state, setState] = useState({
    jobs: [],
    users: [],
    apiIntegrations: [
      { id: 1, name: "Adzuna API", status: "Connected", lastSync: "2 hours ago" },
      { id: 2, name: "LinkedIn Jobs API", status: "Disconnected", lastSync: "Never" },
    ],
    aiConfig: { apiKey: "", model: "gpt-4" },
    currentPage: 1,
    totalPages: 1,
    searchQuery: "",
    loading: true,
    error: null,
    activeTab: "users",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const [jobsResponse, usersResponse] = await Promise.all([
          adminService.getAllScrapedJobs(),
          adminService.getAllUsers({
            page: state.currentPage,
            limit: 10,
            search: state.searchQuery,
          }),
        ])

        // Handle the nested data structure from the API
        // The API returns { data: { users: [...], pagination: {...} } }
        const userData = usersResponse.data || usersResponse

        if (!userData?.users) {
          throw new Error("Format des utilisateurs invalide")
        }

        setState((prev) => ({
          ...prev,
          users: userData.users,
          jobs: jobsResponse?.results || jobsResponse?.data?.results || [],
          totalPages: userData.pagination?.pages || 1,
          loading: false,
        }))
      } catch (err) {
        console.error("Error fetching data:", err)
        setState((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
        }))
      }
    }

    fetchData()
  }, [state.activeTab, state.currentPage, state.searchQuery])

  const handleUserAction = async (action, userId) => {
    try {
      if (action === "delete") {
        await adminService.deleteUser(userId)
        setState((prev) => ({
          ...prev,
          users: prev.users.filter((user) => user._id !== userId),
        }))
      }
      if (action === "toggle") {
        await adminService.toggleUserStatus(userId)
        setState((prev) => ({
          ...prev,
          users: prev.users.map((user) => (user._id === userId ? { ...user, isActive: !user.isActive } : user)),
        }))
      }
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const handleJobDeletion = async (jobId) => {
    try {
      await adminService.deleteJob(jobId)
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((job) => job._id !== jobId),
      }))
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const handleApiToggle = async (apiId) => {
    setState((prev) => ({
      ...prev,
      apiIntegrations: prev.apiIntegrations.map((api) =>
        api.id === apiId ? { ...api, status: api.status === "Connected" ? "Disconnected" : "Connected" } : api,
      ),
    }))
  }

  const handleAIConfigSubmit = async (e) => {
    e.preventDefault()
    try {
      await adminService.configureAI(state.aiConfig)
      setState((prev) => ({ ...prev, error: null }))
      alert("Configuration IA sauvegardée avec succès !")
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const handleSearch = (e) => {
    setState((prev) => ({ ...prev, searchQuery: e.target.value, currentPage: 1 }))
  }

  const handleTabChange = (tab) => {
    setState((prev) => ({ ...prev, activeTab: tab, currentPage: 1, searchQuery: "" }))
  }

  if (state.loading) return <LoadingSpinner />
  if (state.error) return <ErrorDisplay message={state.error} />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord administrateur</h1>

        <StatsOverview
          jobsCount={state.jobs.length}
          usersCount={state.users.length}
          activeApis={state.apiIntegrations.filter((api) => api.status === "Connected").length}
          totalApis={state.apiIntegrations.length}
        />

        <Tabs value={state.activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="jobs">Offres</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="ia">IA</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <DashboardSection
              title="Gestion des offres"
              searchValue={state.searchQuery}
              onSearch={handleSearch}
              pagination={{
                current: state.currentPage,
                total: state.totalPages,
                onPrev: () => setState((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) })),
                onNext: () =>
                  setState((prev) => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) })),
              }}
            >
              <JobsTable jobs={state.jobs} onDelete={handleJobDeletion} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="users">
            <DashboardSection
              title="Gestion des utilisateurs"
              searchValue={state.searchQuery}
              onSearch={handleSearch}
              pagination={{
                current: state.currentPage,
                total: state.totalPages,
                onPrev: () => setState((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) })),
                onNext: () =>
                  setState((prev) => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) })),
              }}
            >
              <UsersTable users={state.users} onAction={handleUserAction} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="api">
            <DashboardSection title="Intégrations API">
              <ApiIntegrationList apis={state.apiIntegrations} onToggle={handleApiToggle} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="ia">
            <DashboardSection title="Configuration IA">
              <AIConfigForm
                config={state.aiConfig}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, [e.target.name]: e.target.value },
                  }))
                }
                onSubmit={handleAIConfigSubmit}
              />
            </DashboardSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const LoadingSpinner = () => (
  <div className="text-center py-12">
    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
    <p className="mt-4">Chargement des données...</p>
  </div>
)

const ErrorDisplay = ({ message }) => (
  <div className="text-center py-8 bg-red-50 rounded-lg">
    <div className="text-red-600 font-medium">Erreur : {message}</div>
    <Button className="mt-4" onClick={() => window.location.reload()}>
      Réessayer
    </Button>
  </div>
)

const StatsOverview = ({ jobsCount, usersCount, activeApis, totalApis }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
    <StatCard title="Offres actives" value={jobsCount} icon={<Briefcase />} />
    <StatCard title="Utilisateurs" value={usersCount} icon={<User />} />
    <StatCard title="API actives" value={`${activeApis}/${totalApis}`} icon={<RefreshCw />} />
    <StatCard title="Modèle IA" value="GPT-4" icon={<Sparkles />} />
  </div>
)

const StatCard = ({ title, value, icon }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
)

const DashboardSection = ({ title, children, searchValue, onSearch, pagination }) => (
  <div className="bg-white rounded-lg border p-6 shadow-sm">
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      {onSearch && (
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher..." className="pl-9" value={searchValue} onChange={onSearch} />
        </div>
      )}
    </div>

    {children}

    {pagination && (
      <div className="mt-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Page {pagination.current} sur {pagination.total}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={pagination.onPrev} disabled={pagination.current === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>
          <Button variant="outline" onClick={pagination.onNext} disabled={pagination.current === pagination.total}>
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    )}
  </div>
)

const UsersTable = ({ users, onAction }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b text-left text-xs uppercase text-gray-500">
          <th className="px-6 py-3">Nom complet</th>
          <th className="px-6 py-3">Email</th>
          <th className="px-6 py-3">Statut</th>
          <th className="px-6 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {users.length > 0 ? (
          users.map((user) => (
            <tr key={user._id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                {user.firstName} {user.lastName}
              </td>
              <td className="px-6 py-4">{user.email}</td>
              <td className="px-6 py-4">
                <StatusBadge active={user.isActive} />
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAction("toggle", user._id)}
                    title="Modifier statut"
                  >
                    {user.isActive ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onAction("delete", user._id)} title="Supprimer">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
              Aucun utilisateur trouvé
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

const JobsTable = ({ jobs, onDelete }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b text-left text-xs uppercase text-gray-500">
          <th className="px-6 py-3">Titre</th>
          <th className="px-6 py-3">Entreprise</th>
          <th className="px-6 py-3">Localisation</th>
          <th className="px-6 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <tr key={job._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{job.title}</td>
              <td className="px-6 py-4">{job.company?.display_name}</td>
              <td className="px-6 py-4">{job.location?.display_name}</td>
              <td className="px-6 py-4">
                <Button variant="ghost" size="icon" onClick={() => onDelete(job._id)} title="Supprimer">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
              Aucune offre trouvée
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

const ApiIntegrationList = ({ apis, onToggle }) => (
  <div className="space-y-4">
    {apis.map((api) => (
      <div key={api.id} className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{api.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Dernière synchronisation : {api.lastSync}</p>
          </div>
          <Button variant={api.status === "Connected" ? "destructive" : "default"} onClick={() => onToggle(api.id)}>
            {api.status === "Connected" ? "Déconnecter" : "Connecter"}
          </Button>
        </div>
      </div>
    ))}
  </div>
)

const AIConfigForm = ({ config, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Clé API OpenAI</label>
        <Input type="password" name="apiKey" value={config.apiKey} onChange={onChange} placeholder="sk-..." required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Modèle</label>
        <select name="model" value={config.model} onChange={onChange} className="w-full border rounded-md p-2" required>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>
    </div>
    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
      Sauvegarder la configuration
    </Button>
  </form>
)

const StatusBadge = ({ active }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
      active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    }`}
  >
    {active ? "Actif" : "Inactif"}
  </span>
)