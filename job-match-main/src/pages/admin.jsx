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
  ExternalLink,
} from "lucide-react"
import { adminService } from "../services/admin-service"

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AdminPage() {
  const [state, setState] = useState({
    jobs: [],
    users: [],
    apiIntegrations: [
      { id: 1, name: "Adzuna API", status: "Connected", lastSync: "2 hours ago" },
      { id: 2, name: "LinkedIn Jobs API", status: "Connected", lastSync: "Just now" },
    ],
    aiConfig: { apiKey: "", model: "gpt-4" },
    currentUsersPage: 1,
    currentJobsPage: 1,
    totalUsersPages: 1,
    totalJobsPages: 1,
    usersSearchQuery: "",
    jobsSearchQuery: "",
    loading: true,
    error: null,
    activeTab: "jobs",
  })

  const debouncedUsersSearch = useDebounce(state.usersSearchQuery, 300)
  const debouncedJobsSearch = useDebounce(state.jobsSearchQuery, 300)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))

        if (state.activeTab === "jobs") {
          const [scrapedResponse, externalResponse] = await Promise.all([
            adminService.getAllScrapedJobs({
              page: state.currentJobsPage,
              limit: 10,
              search: debouncedJobsSearch
            }),
            adminService.getAllExternalJobs({
              page: state.currentJobsPage,
              limit: 10,
              search: debouncedJobsSearch
            })
          ])

          // Normalisation des données Adzuna
          const normalizeAdzunaJob = (job) => ({
            id: job.id,
            title: job.title,
            description: job.description,
            company: job.company?.display_name || "Company not specified",
            location: job.location?.display_name || "Location not specified",
            created: job.created,
            salary: job.salary_min || 0,
            contractType: job.contract_type || "Full-time",
            sourceUrl: job.redirect_url,
            source: "Adzuna",
            isExternal: true
          })

          // Normalisation des données LinkedIn
          const normalizeLinkedInJob = (job) => ({
            id: job.sourceId || `linkedin-${Math.random().toString(36).substr(2, 9)}`,
            title: job.title,
            description: job.description,
            company: job.company?.display_name || "Company not specified",
            location: job.location?.display_name || "Location not specified",
            created: job.created,
            salary: job.salary || 0,
            contractType: job.contractType || "Full-time",
            sourceUrl: job.sourceUrl,
            source: "LinkedIn",
            isExternal: true
          })

          const scrapedJobs = scrapedResponse.data?.results?.map(normalizeAdzunaJob) || []
          const externalJobs = externalResponse.data?.results?.map(normalizeLinkedInJob) || []

          const combinedJobs = [...scrapedJobs, ...externalJobs]
          
          setState(prev => ({
            ...prev,
            jobs: combinedJobs,
            totalJobsPages: Math.max(
              scrapedResponse.data?.pagination?.pages || 1,
              externalResponse.data?.totalPages || 1
            ),
            loading: false
          }))
        }

        if (state.activeTab === "users") {
          const usersResponse = await adminService.getAllUsers({
            page: state.currentUsersPage,
            limit: 10,
            search: debouncedUsersSearch,
          })

          setState(prev => ({
            ...prev,
            users: usersResponse.data.users,
            totalUsersPages: usersResponse.data.pagination?.pages || 1,
            loading: false
          }))
        }

        if (state.activeTab === "api" || state.activeTab === "ia") {
          setState(prev => ({ ...prev, loading: false }))
        }

      } catch (err) {
        console.error("Error fetching data:", err)
        setState(prev => ({
          ...prev,
          error: err.message,
          loading: false,
        }))
      }
    }

    fetchData()
  }, [
    state.activeTab,
    state.currentUsersPage,
    state.currentJobsPage,
    debouncedUsersSearch,
    debouncedJobsSearch
  ])

  const handleJobDeletion = async (jobId) => {
    try {
      await adminService.deleteJob(jobId)
      setState(prev => ({
        ...prev,
        jobs: prev.jobs.filter(job => job.id !== jobId),
      }))
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message }))
    }
  }

  const handleUserAction = async (action, userId) => {
    try {
      if (action === "delete") {
        await adminService.deleteUser(userId)
        setState(prev => ({
          ...prev,
          users: prev.users.filter(user => user._id !== userId),
        }))
      }
      if (action === "toggle") {
        await adminService.toggleUserStatus(userId)
        setState(prev => ({
          ...prev,
          users: prev.users.map(user => 
            user._id === userId ? { ...user, isActive: !user.isActive } : user
          ),
        }))
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: err.message }))
    }
  }

  const handleJobsSearch = (e) => {
    setState(prev => ({
      ...prev,
      jobsSearchQuery: e.target.value,
      currentJobsPage: 1
    }))
  }

  const handleUsersSearch = (e) => {
    setState(prev => ({
      ...prev,
      usersSearchQuery: e.target.value,
      currentUsersPage: 1
    }))
  }

  const handleTabChange = (tab) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
      currentUsersPage: 1,
      currentJobsPage: 1,
      usersSearchQuery: "",
      jobsSearchQuery: ""
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return "Invalid date"
    }
  }

  const formatSalary = (salary) => {
    if (!salary || isNaN(salary)) return "Salary not specified"
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD'
    }).format(salary)
  }

  if (state.loading) return <LoadingSpinner />
  if (state.error) return <ErrorDisplay message={state.error} />

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <StatsOverview
          jobsCount={state.jobs.length}
          usersCount={state.users.length}
          activeApis={state.apiIntegrations.filter(api => api.status === "Connected").length}
          totalApis={state.apiIntegrations.length}
        />

        <Tabs value={state.activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="ia">AI</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <DashboardSection
              title="Job Management"
              searchValue={state.jobsSearchQuery}
              onSearch={handleJobsSearch}
              pagination={{
                current: state.currentJobsPage,
                total: state.totalJobsPages,
                onPrev: () => setState(prev => ({
                  ...prev,
                  currentJobsPage: Math.max(1, prev.currentJobsPage - 1)
                })),
                onNext: () => setState(prev => ({
                  ...prev,
                  currentJobsPage: Math.min(prev.totalJobsPages, prev.currentJobsPage + 1)
                })),
              }}
            >
              <JobsTable jobs={state.jobs} onDelete={handleJobDeletion} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="users">
            <DashboardSection
              title="User Management"
              searchValue={state.usersSearchQuery}
              onSearch={handleUsersSearch}
              pagination={{
                current: state.currentUsersPage,
                total: state.totalUsersPages,
                onPrev: () => setState(prev => ({
                  ...prev,
                  currentUsersPage: Math.max(1, prev.currentUsersPage - 1)
                })),
                onNext: () => setState(prev => ({
                  ...prev,
                  currentUsersPage: Math.min(prev.totalUsersPages, prev.currentUsersPage + 1)
                })),
              }}
            >
              <UsersTable users={state.users} onAction={handleUserAction} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="api">
            <DashboardSection title="API Integrations">
              <ApiIntegrationList apis={state.apiIntegrations} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="ia">
            <DashboardSection title="AI Configuration">
              <AIConfigForm
                config={state.aiConfig}
                onChange={(e) =>
                  setState(prev => ({
                    ...prev,
                    aiConfig: { ...prev.aiConfig, [e.target.name]: e.target.value },
                  }))
                }
                onSubmit={(e) => {
                  e.preventDefault()
                  alert("AI configuration saved!")
                }}
              />
            </DashboardSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <RefreshCw className="h-12 w-12 animate-spin" />
    </div>
  )
}

function ErrorDisplay({ message }) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  )
}

function StatsOverview({ jobsCount, usersCount, activeApis, totalApis }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard title="Active Jobs" value={jobsCount} icon={<Briefcase />} />
      <StatCard title="Users" value={usersCount} icon={<User />} />
      <StatCard title="Active APIs" value={`${activeApis}/${totalApis}`} icon={<RefreshCw />} />
      <StatCard title="AI Model" value="GPT-4" icon={<Sparkles />} />
    </div>
  )
}

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function DashboardSection({ title, children, searchValue, onSearch, pagination }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {onSearch && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              className="pl-9 w-full"
              value={searchValue}
              onChange={onSearch}
            />
          </div>
        )}
      </div>

      {children}

      {pagination && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Page {pagination.current} of {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onPrev}
              disabled={pagination.current === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pagination.onNext}
              disabled={pagination.current === pagination.total}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function JobsTable({ jobs, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {job.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {job.salary ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(job.salary) : 'Not specified'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {job.created ? new Date(job.created).toLocaleDateString() : 'Unknown'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    job.source === 'Adzuna' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {job.source}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onDelete(job.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                No jobs found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function UsersTable({ users, onAction }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAction('toggle', user._id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onAction('delete', user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ApiIntegrationList({ apis }) {
  return (
    <div className="space-y-4">
      {apis.map((api) => (
        <div key={api.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{api.name}</h3>
              <p className="text-sm text-gray-500">
                Status: <span className={`font-medium ${
                  api.status === 'Connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {api.status}
                </span> | Last sync: {api.lastSync}
              </p>
            </div>
            <Button
              variant={api.status === 'Connected' ? 'destructive' : 'default'}
              size="sm"
            >
              {api.status === 'Connected' ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AIConfigForm({ config, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
        <Input
          type="password"
          name="apiKey"
          value={config.apiKey}
          onChange={onChange}
          placeholder="Enter your API key"
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select
          name="model"
          value={config.model}
          onChange={onChange}
          className="w-full border rounded-md p-2"
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-2">Claude 2</option>
        </select>
      </div>
      <Button type="submit" className="mt-4">
        Save Configuration
      </Button>
    </form>
  )
}