import { api } from "./api"

export const adminService = {
  // Authentification
  checkAdminAuth() {
    return api.get("/admin/check")
  },

  // Gestion utilisateurs
  getAccountStatusRequests() {
    return api.get("/admin/account-requests")
  },

  getUserAccountStatusRequests(userId) {
    return api.get(`/admin/account-requests/${userId}`)
  },

  deleteUser(userId) {
    return api.delete(`/admin/user/delete/${userId}`)
  },

  toggleUserStatus(userId) {
    return api.put(`/admin/users/toggle-status/${userId}`)
  },

  getAllUsers({ page = 1, limit = 10, search = "" } = {}) {
    const encodedSearch = encodeURIComponent(search)
    return api.get("/admin/users", {
      params: { page, limit, search: encodedSearch },
    })
  },

  // Gestion administrateurs
  createAdmin(adminData) {
    return api.post("/admin", adminData)
  },

  getAllAdmins(params = {}) {
    const { page = 1, limit = 10, search = "" } = params
    const encodedSearch = encodeURIComponent(search)
    console.log("Calling getAllAdmins with params:", { page, limit, search: encodedSearch })
    return api.get("/admin", {
      params: { page, limit, search: encodedSearch },
    })
  },

  getAdminById(id) {
    return api.get(`/admin/${id}`)
  },

  updateAdmin(adminId, adminData) {
    return api.put(`/admin/${adminId}`, adminData)
  },

  deleteAdmin(adminId) {
    return api.delete(`/admin/${adminId}`)
  },

  // Configuration IA
  configureAI(configData) {
    return api.post("/admin/ai/configure", configData)
  },

  getAllScrapedJobs(params = {}) {
    const { page = 1, limit = 10, search = "" } = params
    const encodedSearch = encodeURIComponent(search)
    return api.get("/jobs/scraped/all", {
      params: { page, limit, search: encodedSearch },
    })
  },

  getAllExternalJobs(params = {}) {
    const { page = 1, limit = 10, search = "" } = params
    const encodedSearch = encodeURIComponent(search)
    return api.get("/jobs/external/all", {
      params: { page, limit, search: encodedSearch },
    })
  },
}

