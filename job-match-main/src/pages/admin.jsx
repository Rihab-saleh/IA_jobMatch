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
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Edit,
  Plus,
  Save,
  Check,
  Ban,
  Users,
  Eye,
  Activity,
} from "lucide-react"
import { adminService } from "../services/admin-service"
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert"
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"

// Enregistrement des composants ChartJS nécessaires
ChartJS.register(ArcElement, ChartTooltip, Legend)

function DetailedStats({ stats }) {
  if (!stats) return null

  const userStatusData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: [stats.users.active, stats.users.inactive],
        backgroundColor: ["#10B981", "#EF4444"],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">User Statistics</CardTitle>
          <Users className="h-4 w-4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Active Users:</span>
            <span className="text-sm font-medium">{stats.users.active}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Inactive Users:</span>
            <span className="text-sm font-medium">{stats.users.inactive}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">New Today:</span>
            <span className="text-sm font-medium">{stats.users.today}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">New This Week:</span>
            <span className="text-sm font-medium">{stats.users.thisWeek}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">New This Month:</span>
            <span className="text-sm font-medium">{stats.users.thisMonth}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Visitor Statistics</CardTitle>
          <Eye className="h-4 w-4" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Today:</span>
            <span className="text-sm font-medium">{stats.visitors.today}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">This Week:</span>
            <span className="text-sm font-medium">{stats.visitors.thisWeek}</span>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">This Month:</span>
            <span className="text-sm font-medium">{stats.visitors.thisMonth}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">User Status</CardTitle>
          <Activity className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <Pie
              data={userStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative border border-gray-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}

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

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-64">
      <RefreshCw className="h-12 w-12 animate-spin" />
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

function StatsOverview({ jobsCount, usersCount, adminsCount, aiModel }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard title="Total Jobs" value={jobsCount} icon={<Briefcase className="h-4 w-4" />} />
      <StatCard title="Total Users" value={usersCount} icon={<User className="h-4 w-4" />} />
      <StatCard title="Total Admins" value={adminsCount} icon={<User className="h-4 w-4" />} />
      <StatCard title="AI Model" value={aiModel || "Not configured"} icon={<Sparkles className="h-4 w-4" />} />
    </div>
  )
}

function DashboardSection({ title, children, searchValue, onSearch, pagination, actionButton }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-9 w-full md:w-[300px]"
                value={searchValue}
                onChange={onSearch}
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {children}

      {pagination && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Page {pagination.current} of {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={pagination.onPrev} disabled={pagination.current === 1}>
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

function JobsTable({ jobs }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const formatSalary = (salary) => {
    if (!salary || isNaN(salary)) return "Salary not specified"
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
    }).format(salary)
  }

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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <tr key={job.id || job._id || `job-${Math.random().toString(36).substr(2, 9)}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{job.title}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{job.location}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatSalary(job.salary)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(job.created)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      job.source === "Adzuna" ? "bg-blue-100 text-blue-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {job.source}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction("toggle", user._id)}
                      className={`${
                        user.isActive
                          ? "text-amber-600 hover:text-amber-900 hover:bg-amber-50"
                          : "text-green-600 hover:text-green-900 hover:bg-green-50"
                      }`}
                      aria-label={user.isActive ? "Deactivate user" : "Activate user"}
                    >
                      {user.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction("delete", user._id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50"
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

function AdminsTable({ admins, onEdit, onDelete }) {
  // Add this function to get the current admin's email from localStorage token
  const getCurrentAdminEmail = () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return null

      // Decode JWT token (assuming it's a JWT token)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )

      const payload = JSON.parse(jsonPayload)
      return payload.email // Assuming the email is stored in the token payload
    } catch (error) {
      console.error("Error decoding token:", error)
      return null
    }
  }

  // Get current admin email
  const currentAdminEmail = getCurrentAdminEmail()

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {admins && admins.length > 0 ? (
            admins.map((admin) => {
              if (!admin) return null

              // Check if this admin is the current logged-in admin
              const isCurrentAdmin = currentAdminEmail && admin.email === currentAdminEmail

              return (
                <tr key={admin._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {admin.firstName || ""} {admin.lastName || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email || ""}</div>
                  </td>
                 
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(admin)}
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        aria-label="Edit admin"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(admin)}
                        className={`text-red-600 hover:text-red-900 hover:bg-red-50 ${isCurrentAdmin ? "opacity-50 cursor-not-allowed" : ""}`}
                        aria-label="Delete admin"
                        disabled={isCurrentAdmin}
                        title={isCurrentAdmin ? "You cannot delete your own account" : "Delete admin"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                No admins found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function AIConfigForm({ config, onChange, onSubmit, isSaving }) {
  const handleSourceToggle = (source) => {
    const newSources = config.allowedApiSources.includes(source)
      ? config.allowedApiSources.filter((s) => s !== source)
      : [...config.allowedApiSources, source]

    onChange({
      target: {
        name: "allowedApiSources",
        value: newSources,
      },
    })
  }

  if (!config.llmModel) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LLM Model</label>
          <select
            name="llmModel"
            value={config.llmModel}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="mistral">Mistral</option>
            <option value="llama2">Llama 2</option>
            <option value="mistral:instruct">Mistral Instruct</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Daily Run Time</label>
          <input
            type="time"
            name="dailyRunTime"
            value={config.dailyRunTime}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Allowed Job Sources</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"].map((source) => (
            <div key={source} className="flex items-center">
              <input
                type="checkbox"
                id={`source-${source}`}
                checked={config.allowedApiSources.includes(source)}
                onChange={() => handleSourceToggle(source)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`source-${source}`} className="ml-2 block text-sm text-gray-700 capitalize">
                {source}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const [state, setState] = useState({
    jobs: [],
    users: [],
    admins: [],
    adminConfig: {
      llmModel: "",
      allowedApiSources: ["adzuna", "reed", "apijobs", "jooble", "findwork", "remotive", "scraped"],
      dailyRunTime: "00:00",
    },
    currentUsersPage: 1,
    currentJobsPage: 1,
    currentAdminsPage: 1,
    totalUsersPages: 1,
    totalJobsPages: 1,
    totalAdminsPages: 1,
    totalJobsCount: 0,
    totalUsersCount: 0,
    totalAdminsCount: 0,
    usersSearchQuery: "",
    jobsSearchQuery: "",
    adminsSearchQuery: "",
    loading: true,
    error: null,
    success: null,
    activeTab: "jobs",
    deleteConfirmOpen: false,
    userToDelete: null,
    adminToDelete: null,
    isAdminModalOpen: false,
    adminFormMode: "create",
    adminFormData: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      age: "",
      role: "admin",
    },
    statusChangeModalOpen: false,
    userToToggleStatus: null,
    stats: {
      users: {
        active: 40,
        inactive: 5,
        thisWeek: 2,
        thisMonth: 8,
      },
      visitors: {
        today: 11,
        thisWeek: 34,
        thisMonth: 57,
      },
    },
  })

  // Add a new useEffect to fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getStats()
        if (response && response.data) {
          setState((prev) => ({
            ...prev,
            stats: response.data,
          }))
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])

  const [isSaving, setIsSaving] = useState(false)

  const normalizeAdzunaJob = (job) => ({
    id: job.id,
    title: job.title,
    description: job.description,
    company: job.company?.display_name || "Company not specified",
    location: job.location?.display_name || "Location not specified",
    created: job.created,
    salary: job.salary_min || 0,
    contractType: job.contract_type || job.contractType || "Full-time",
    sourceUrl: job.redirect_url,
    source: "Adzuna",
    isExternal: true,
  })

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
    isExternal: true,
  })

  useEffect(() => {
    const fetchAdminConfig = async () => {
      try {
        // Add a loading state for the AI config
        setState((prev) => ({ ...prev, loading: state.activeTab === "ia" }))

        const response = await adminService.getAdminConfig()
        if (response) {
          setState((prev) => ({
            ...prev,
            adminConfig: {
              llmModel: response.llmModel || "",
              allowedApiSources: response.allowedApiSources || [
                "adzuna",
                "reed",
                "apijobs",
                "jooble",
                "findwork",
                "remotive",
                "scraped",
              ],
              dailyRunTime: response.dailyRunTime || "00:00",
            },
            loading: false,
          }))
        }
      } catch (err) {
        console.error("Error fetching admin config:", err)
        setState((prev) => ({
          ...prev,
          error: "Failed to load AI configuration",
          loading: false,
        }))
      }
    }

    fetchAdminConfig()
  }, [])

  const debouncedUsersSearch = useDebounce(state.usersSearchQuery, 500)
  const debouncedJobsSearch = useDebounce(state.jobsSearchQuery, 500)
  const debouncedAdminsSearch = useDebounce(state.adminsSearchQuery, 500)

  useEffect(() => {
    const fetchAllTotals = async () => {
      setState((prev) => ({ ...prev, loading: true }))

      try {
        const [scrapedResponse, externalResponse] = await Promise.all([
          adminService.getAllScrapedJobs({ page: 1, limit: 1 }).catch((err) => {
            console.error("Error fetching scraped jobs count:", err)
            return { count: 0 }
          }),
          adminService.getAllExternalJobs({ page: 1, limit: 1 }).catch((err) => {
            console.error("Error fetching external jobs count:", err)
            return { count: 0 }
          }),
        ])

        const totalScrapedJobs = scrapedResponse.count || scrapedResponse.data?.count || 0
        const totalExternalJobs = externalResponse.count || externalResponse.data?.count || 0
        const totalJobs = totalScrapedJobs + totalExternalJobs

        const usersResponse = await adminService.getAllUsers({ page: 1, limit: 1 }).catch((err) => {
          console.error("Error fetching users count:", err)
          return { data: { pagination: { total: 0 } } }
        })

        const totalUsers = usersResponse.data?.pagination?.total || 0

        const adminsResponse = await adminService.getAllAdmins().catch((err) => {
          console.error("Error fetching admins count:", err)
          return { pagination: { total: 0 }, admins: [] }
        })

        const totalAdmins = adminsResponse.pagination?.total || adminsResponse.admins?.length || 0

        setState((prev) => ({
          ...prev,
          totalJobsCount: totalJobs,
          totalUsersCount: totalUsers,
          totalAdminsCount: totalAdmins,
          loading: false,
        }))
      } catch (err) {
        console.error("Error fetching totals:", err)
        setState((prev) => ({ ...prev, error: err.message, loading: false }))
      }
    }

    fetchAllTotals()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (state.activeTab === "jobs") {
          setState((prev) => ({ ...prev, loading: true, error: null }))

          const [scrapedResponse, externalResponse] = await Promise.all([
            adminService
              .getAllScrapedJobs({
                page: state.currentJobsPage,
                limit: 10,
                search: debouncedJobsSearch,
              })
              .catch((err) => {
                console.error("Error fetching scraped jobs:", err)
                return { data: { results: [] } }
              }),
            adminService
              .getAllExternalJobs({
                page: state.currentJobsPage,
                limit: 10,
                search: debouncedJobsSearch,
              })
              .catch((err) => {
                console.error("Error fetching external jobs:", err)
                return { data: { results: [] } }
              }),
          ])

          const scrapedJobs =
            scrapedResponse.results?.map(normalizeAdzunaJob) ||
            scrapedResponse.data?.results?.map(normalizeAdzunaJob) ||
            []

          const externalJobs =
            externalResponse.results?.map(normalizeLinkedInJob) ||
            externalResponse.data?.results?.map(normalizeLinkedInJob) ||
            []

          const combinedJobs = [...scrapedJobs, ...externalJobs]

          const totalScrapedJobs = scrapedResponse.count || scrapedResponse.data?.count || 0
          const totalExternalJobs = externalResponse.count || externalResponse.data?.count || 0
          const totalJobs = totalScrapedJobs + totalExternalJobs

          const totalScrapedPages =
            scrapedResponse.totalPages ||
            scrapedResponse.data?.totalPages ||
            Math.ceil((scrapedResponse.count || 0) / 10) ||
            1

          const totalExternalPages =
            externalResponse.totalPages ||
            externalResponse.data?.totalPages ||
            Math.ceil((externalResponse.count || 0) / 10) ||
            1

          setState((prev) => ({
            ...prev,
            jobs: combinedJobs,
            totalJobsCount: totalJobs,
            totalJobsPages: Math.max(totalScrapedPages, totalExternalPages),
            loading: false,
          }))
        }

        if (state.activeTab === "users") {
          setState((prev) => ({ ...prev, loading: true, error: null }))

          const usersResponse = await adminService.getAllUsers({
            page: state.currentUsersPage,
            limit: 10,
            search: debouncedUsersSearch,
          })

          setState((prev) => ({
            ...prev,
            users: usersResponse.data.users || [],
            totalUsersCount: usersResponse.data.pagination?.total || 0,
            totalUsersPages: usersResponse.data.pagination?.pages || 1,
            loading: false,
          }))
        }

        if (state.activeTab === "admins") {
          setState((prev) => ({ ...prev, loading: true, error: null }))

          try {
            const adminsResponse = await adminService.getAllAdmins({
              page: state.currentAdminsPage,
              limit: 10,
              search: debouncedAdminsSearch,
            })

            const adminsList = adminsResponse.admins || []
            const totalAdmins = adminsResponse.pagination?.total || adminsList.length || 0

            setState((prev) => ({
              ...prev,
              admins: adminsList,
              totalAdminsCount: totalAdmins,
              totalAdminsPages: Math.ceil(totalAdmins / 10) || 1,
              loading: false,
            }))
          } catch (err) {
            console.error("Error fetching admins:", err)
            setState((prev) => ({
              ...prev,
              error: err.message,
              loading: false,
            }))
          }
        }
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
  }, [
    state.activeTab,
    state.currentUsersPage,
    state.currentJobsPage,
    state.currentAdminsPage,
    debouncedUsersSearch,
    debouncedJobsSearch,
    debouncedAdminsSearch,
  ])

  const handleJobDeletion = async (jobId) => {
    try {
      await adminService.deleteJob(jobId)
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.filter((job) => job.id !== jobId),
        totalJobsCount: Math.max(0, prev.totalJobsCount - 1),
      }))
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const handleUserAction = async (action, userId) => {
    try {
      if (action === "delete") {
        const userToDelete = state.users.find((user) => user._id === userId)
        setState((prev) => ({
          ...prev,
          deleteConfirmOpen: true,
          userToDelete: userToDelete,
        }))
      }
      if (action === "toggle") {
        const userToToggle = state.users.find((user) => user._id === userId)
        setState((prev) => ({
          ...prev,
          statusChangeModalOpen: true,
          userToToggleStatus: userToToggle,
        }))
      }
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const confirmUserStatusChange = async () => {
    try {
      if (!state.userToToggleStatus) return

      await adminService.toggleUserStatus(state.userToToggleStatus._id)
      setState((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user._id === prev.userToToggleStatus._id ? { ...user, isActive: !user.isActive } : user,
        ),
        statusChangeModalOpen: false,
        userToToggleStatus: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message,
        statusChangeModalOpen: false,
        userToToggleStatus: null,
      }))
    }
  }

  const cancelUserStatusChange = () => {
    setState((prev) => ({
      ...prev,
      statusChangeModalOpen: false,
      userToToggleStatus: null,
    }))
  }

  const confirmUserDeletion = async () => {
    try {
      if (!state.userToDelete) return

      await adminService.deleteUser(state.userToDelete._id)
      setState((prev) => ({
        ...prev,
        users: prev.users.filter((user) => user._id !== prev.userToDelete._id),
        totalUsersCount: Math.max(0, prev.totalUsersCount - 1),
        deleteConfirmOpen: false,
        userToDelete: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message,
        deleteConfirmOpen: false,
        userToDelete: null,
      }))
    }
  }

  const cancelUserDeletion = () => {
    setState((prev) => ({
      ...prev,
      deleteConfirmOpen: false,
      userToDelete: null,
    }))
  }

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target
    setState((prev) => ({
      ...prev,
      adminFormData: {
        ...prev.adminFormData,
        [name]: value,
      },
    }))
  }

  const handleCreateAdmin = () => {
    setState((prev) => ({
      ...prev,
      adminFormData: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        age: "",
        role: "admin",
      },
      adminFormMode: "create",
      isAdminModalOpen: true,
    }))
  }

  const handleEditAdmin = (admin) => {
    setState((prev) => ({
      ...prev,
      adminFormData: {
        _id: admin._id,
        firstName: admin.firstName || "",
        lastName: admin.lastName || "",
        email: admin.email || "",
        password: "",
        age: admin.age || "",
        role: admin.role || "admin",
      },
      adminFormMode: "edit",
      isAdminModalOpen: true,
    }))
  }

  const handleDeleteAdmin = (admin) => {
    setState((prev) => ({
      ...prev,
      adminToDelete: admin,
      deleteConfirmOpen: true,
    }))
  }

  const confirmAdminDeletion = async () => {
    try {
      await adminService.deleteAdmin(state.adminToDelete._id)
      setState((prev) => ({
        ...prev,
        admins: prev.admins.filter((admin) => admin._id !== prev.adminToDelete._id),
        totalAdminsCount: Math.max(0, prev.totalAdminsCount - 1),
        deleteConfirmOpen: false,
        adminToDelete: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message,
        deleteConfirmOpen: false,
        adminToDelete: null,
      }))
    }
  }

  const handleAdminSubmit = async (e) => {
    e.preventDefault()
    try {
      if (state.adminFormMode === "create") {
        const response = await adminService.createAdmin(state.adminFormData)
        setState((prev) => ({
          ...prev,
          admins: [...prev.admins, response.data],
          totalAdminsCount: prev.totalAdminsCount + 1,
          isAdminModalOpen: false,
        }))
      } else {
        const { _id, ...updateData } = state.adminFormData
        if (!updateData.password) {
          delete updateData.password
        }
        await adminService.updateAdmin(_id, updateData)
        setState((prev) => ({
          ...prev,
          admins: prev.admins.map((admin) => (admin._id === _id ? { ...admin, ...updateData } : admin)),
          isAdminModalOpen: false,
        }))
      }
    } catch (err) {
      setState((prev) => ({ ...prev, error: err.message }))
    }
  }

  const handleJobsSearch = (e) => {
    setState((prev) => ({
      ...prev,
      jobsSearchQuery: e.target.value,
    }))
  }

  const handleUsersSearch = (e) => {
    setState((prev) => ({
      ...prev,
      usersSearchQuery: e.target.value,
    }))
  }

  const handleAdminsSearch = (e) => {
    setState((prev) => ({
      ...prev,
      adminsSearchQuery: e.target.value,
    }))
  }

  const handleTabChange = (tab) => {
    setState((prev) => ({
      ...prev,
      activeTab: tab,
      currentUsersPage: 1,
      currentJobsPage: 1,
      currentAdminsPage: 1,
      usersSearchQuery: "",
      jobsSearchQuery: "",
      adminsSearchQuery: "",
      error: null,
      success: null,
    }))
  }

  const handleAIConfigSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await adminService.updateAdminConfig(state.adminConfig)
      if (response) {
        setState((prev) => ({
          ...prev,
          adminConfig: response,
          error: null,
          success: "AI configuration saved successfully!",
        }))
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.response?.data?.message || "Failed to save AI configuration",
      }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIConfigChange = (e) => {
    const { name, value } = e.target
    setState((prev) => ({
      ...prev,
      adminConfig: {
        ...prev.adminConfig,
        [name]: value,
      },
    }))
  }

  const handleSourceToggle = (source) => {
    setState((prev) => {
      const currentSources = prev.adminConfig.allowedApiSources
      const newSources = currentSources.includes(source)
        ? currentSources.filter((s) => s !== source)
        : [...currentSources, source]

      return {
        ...prev,
        adminConfig: {
          ...prev.adminConfig,
          allowedApiSources: newSources,
        },
      }
    })
  }

  if (state.loading && !state.totalJobsCount && !state.totalUsersCount && !state.totalAdminsCount) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {state.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.success && (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        <StatsOverview
          jobsCount={state.totalJobsCount}
          usersCount={state.totalUsersCount}
          adminsCount={state.totalAdminsCount}
          aiModel={state.adminConfig?.llmModel}
        />

        <DetailedStats stats={state.stats} />

        <Tabs value={state.activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
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
                onPrev: () => {
                  setState((prev) => ({
                    ...prev,
                    currentJobsPage: Math.max(1, prev.currentJobsPage - 1),
                  }))
                },
                onNext: () => {
                  setState((prev) => ({
                    ...prev,
                    currentJobsPage: Math.min(prev.totalJobsPages, prev.currentJobsPage + 1),
                  }))
                },
              }}
            >
              {state.jobsSearchQuery && (
                <div className="mb-4 flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    Search results for: <span className="font-medium">{state.jobsSearchQuery}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState((prev) => ({ ...prev, jobsSearchQuery: "" }))}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
              <JobsTable jobs={state.jobs} />
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
                onPrev: () =>
                  setState((prev) => ({
                    ...prev,
                    currentUsersPage: Math.max(1, prev.currentUsersPage - 1),
                  })),
                onNext: () =>
                  setState((prev) => ({
                    ...prev,
                    currentUsersPage: Math.min(prev.totalUsersPages, prev.currentUsersPage + 1),
                  })),
              }}
            >
              <UsersTable users={state.users} onAction={handleUserAction} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="admins">
            <DashboardSection
              title="Admin Management"
              actionButton={
                <Button onClick={handleCreateAdmin}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              }
              searchValue={state.adminsSearchQuery}
              onSearch={handleAdminsSearch}
              pagination={{
                current: state.currentAdminsPage,
                total: state.totalAdminsPages,
                onPrev: () =>
                  setState((prev) => ({
                    ...prev,
                    currentAdminsPage: Math.max(1, prev.currentAdminsPage - 1),
                  })),
                onNext: () =>
                  setState((prev) => ({
                    ...prev,
                    currentAdminsPage: Math.min(prev.totalAdminsPages, prev.currentAdminsPage + 1),
                  })),
              }}
            >
              <AdminsTable admins={state.admins} onEdit={handleEditAdmin} onDelete={handleDeleteAdmin} />
            </DashboardSection>
          </TabsContent>

          <TabsContent value="ia">
            <DashboardSection title="AI Configuration">
              <AIConfigForm
                config={state.adminConfig}
                onChange={handleAIConfigChange}
                onSubmit={handleAIConfigSubmit}
                isSaving={isSaving}
              />
            </DashboardSection>
          </TabsContent>
        </Tabs>

        <Modal isOpen={state.statusChangeModalOpen && state.userToToggleStatus} onClose={cancelUserStatusChange}>
          <div className="space-y-4">
            <Alert variant={state.userToToggleStatus?.isActive ? "destructive" : "default"}>
              {state.userToToggleStatus?.isActive ? <Ban className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              <AlertTitle className="flex items-center gap-2 text-lg font-semibold">
                {state.userToToggleStatus?.isActive ? "Deactivate User Account" : "Activate User Account"}
              </AlertTitle>
              <AlertDescription>
                Are you sure you want to {state.userToToggleStatus?.isActive ? "deactivate" : "activate"} the account
                for{" "}
                <span className="font-semibold">
                  {state.userToToggleStatus
                    ? `${state.userToToggleStatus.firstName} ${state.userToToggleStatus.lastName}`
                    : ""}
                </span>
                ?
                <br />
                <br />
                {state.userToToggleStatus?.isActive
                  ? "This will prevent the user from logging in and accessing the platform."
                  : "This will allow the user to log in and accessing the platform."}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={cancelUserStatusChange}>
                Cancel
              </Button>
              <Button
                variant={state.userToToggleStatus?.isActive ? "destructive" : "default"}
                onClick={confirmUserStatusChange}
              >
                {state.userToToggleStatus?.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={state.deleteConfirmOpen && state.userToDelete} onClose={cancelUserDeletion}>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="flex items-center gap-2 text-lg font-semibold">Confirm User Deletion</AlertTitle>
              <AlertDescription>
                Are you sure you want to delete the user{" "}
                <span className="font-semibold">
                  {state.userToDelete ? `${state.userToDelete.firstName} ${state.userToDelete.lastName}` : ""}
                </span>
                ?
                <br />
                <br />
                This action cannot be undone. This will permanently delete the user account and remove all associated
                data from our servers.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={cancelUserDeletion}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmUserDeletion}>
                Delete User
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={state.deleteConfirmOpen && state.adminToDelete}
          onClose={() => setState((prev) => ({ ...prev, deleteConfirmOpen: false, adminToDelete: null }))}
        >
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="flex items-center gap-2 text-lg font-semibold">Confirm Admin Deletion</AlertTitle>
              <AlertDescription>
                Are you sure you want to delete the admin{" "}
                <span className="font-semibold">
                  {state.adminToDelete ? `${state.adminToDelete.firstName} ${state.adminToDelete.lastName}` : ""}
                </span>
                ?
                <br />
                <br />
                This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setState((prev) => ({ ...prev, deleteConfirmOpen: false, adminToDelete: null }))}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmAdminDeletion}>
                Delete Admin
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={state.isAdminModalOpen}
          onClose={() => setState((prev) => ({ ...prev, isAdminModalOpen: false }))}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              {state.adminFormMode === "create" ? "Add New Admin" : "Edit Admin"}
            </h3>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={state.adminFormData.firstName}
                  onChange={handleAdminInputChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={state.adminFormData.lastName}
                  onChange={handleAdminInputChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={state.adminFormData.email}
                  onChange={handleAdminInputChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                  {state.adminFormMode === "edit" && (
                    <span className="ml-2 text-gray-500 text-sm">(Leave blank to keep current password)</span>
                  )}
                </label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  onChange={handleAdminInputChange}
                  {...(state.adminFormMode === "create" ? { required: true } : {})}
                />
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <Input
                  type="number"
                  name="age"
                  id="age"
                  value={state.adminFormData.age}
                  onChange={handleAdminInputChange}
                />
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, isAdminModalOpen: false }))}>
                  Cancel
                </Button>
                <Button type="submit">{state.adminFormMode === "create" ? "Create Admin" : "Update Admin"}</Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  )
}
