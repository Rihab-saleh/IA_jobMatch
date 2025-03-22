// src/services/admin-service.js
import { api } from "./api";

export const adminService = {
  // Authentification
  checkAdminAuth() {
    return api.get("/admin/check");
  },

  // Gestion utilisateurs
  getAccountStatusRequests() {
    return api.get("/admin/account-requests");
  },

  getUserAccountStatusRequests(userId) {
    return api.get(`/admin/account-requests/${userId}`);
  },

  deleteUser(userId) {
    return api.delete(`/admin/user/delete/${userId}`);
  },

  toggleUserStatus(userId) {
    return api.put(`/admin/user/toggleStatus/${userId}`);
  },

  getAllUsers() {
    return api.get("/admin/users");
  },

  // Gestion administrateurs
  createAdmin(adminData) {
    return api.post("/admin", adminData);
  },

  getAllAdmins() {
    return api.get("/admin");
  },

  getAdminById(adminId) {
    return api.get(`/admin/${adminId}`);
  },

  updateAdmin(adminId, adminData) {
    return api.put(`/admin/${adminId}`, adminData);
  },

  deleteAdmin(adminId) {
    return api.delete(`/admin/${adminId}`);
  },

  // Configuration IA
  configureAI(configData) {
    return api.post("/admin/ai/configure", configData);
  },

  // Gestion des jobs
  getAllScrapedJobs() {
    return api.get("/jobs/scraped/all");
  },

  getAllExternalJobs() {
    return api.get("/jobs/external/all");
  }
};