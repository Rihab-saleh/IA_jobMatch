const AdminService = require("../services/adminService");

// Fonction utilitaire pour gérer les erreurs
const handleError = (res, error, defaultMessage) => {
  console.error(error);
  if (error.message === "User not found" || error.message === "Admin not found") {
    return res.status(404).json({ message: error.message });
  }
  res.status(500).json({ message: error.message || defaultMessage });
};

const validateId = (id, res) => {
  if (!id) {
      res.status(400).json({ message: 'ID is required' });
      return false;
  }
  return true;
};

// Create a new admin
const createAdmin = async (req, res) => {
  try {
      const adminData = req.body;
      const newAdmin = await AdminService.createAdmin(adminData);
      res.status(201).json(newAdmin);
  } catch (error) {
      handleError(res, error, 'An error occurred while creating the admin');
  }
};

// Get an admin by ID
const getAdminById = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Validate that ID is provided
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }
    
    // Validate ID format if using MongoDB ObjectId
    if (!validateId(adminId, res)) return;

    const admin = await AdminService.getAdminById(adminId);
    
    // Check if admin was found
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(admin);
  } catch (error) {
    console.error('Error in getAdminById controller:', error);
    handleError(res, error, 'An error occurred while retrieving the admin');
  }
};

// Get all admins controller correction
const getAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    const result = await AdminService.getAllAdmins(page, limit, search);
    res.json(result); // Return the complete result object with admins and pagination
  } catch (error) {
    handleError(res, error, 'An error occurred while retrieving admins');
  }
};

// Update an admin - Corrected version
const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Simple validation without sending response yet
    if (!adminId) {
      return res.status(400).json({ 
        success: false, 
        message: "Admin ID is required" 
      });
    }

    const updateData = req.body;
    
    // Call the AdminService method
    const updatedAdmin = await AdminService.updateAdmin(adminId, updateData);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    
    // Handle specific errors
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error updating admin",
      error: error.message
    });
  }
};

// Delete an admin - Corrected version
const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    
    // Simple validation without sending response yet
    if (!adminId) {
      return res.status(400).json({ 
        success: false, 
        message: "Admin ID is required" 
      });
    }

    // Call the AdminService method
    const result = await AdminService.deleteAdmin(adminId);

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    
    // Handle specific errors
    if (error.message.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes("last admin")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Error deleting admin",
      error: error.message
    });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!validateId(userId, res)) return;

    await AdminService.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    handleError(res, error, "An error occurred while deleting the user");
  }
};

// Changer le statut d'un utilisateur
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!validateId(userId, res)) return;

    const result = await AdminService.toggleUserStatus(userId);
    res.json(result);
  } catch (error) {
    handleError(res, error, "An error occurred while toggling user status");
  }
};

// Récupérer tous les utilisateurs
const getAllUsers = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const search = req.query.search || ""

    const result = await AdminService.getAllUsers(page, limit, search)

    // Wrap the response in a data property to match frontend expectations
    res.json({ data: result })
  } catch (error) {
    handleError(res, error, "An error occurred while retrieving all users")
  }
}

// Configurer l'IA (exemple)
const configureAI = async (req, res) => {
  try {
    const aiConfig = req.body;
    const result = await AdminService.configureAI(aiConfig);
    res.json(result);
  } catch (error) {
    handleError(res, error, "An error occurred while configuring AI");
  }
};

// Récupérer les demandes de changement de statut de compte
const getAccountStatusRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;

    const result = await AdminService.getAccountStatusRequests(status, page, limit);
    res.json(result);
  } catch (error) {
    handleError(res, error, "An error occurred while retrieving account status requests");
  }
};

// Traiter une demande de changement de statut de compte
const processAccountStatusRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    if (!validateId(requestId, res)) return;

    const action = req.body.action;
    await AdminService.processAccountStatusRequest(requestId, action);
    res.json({ message: `Account status request ${action}ed successfully` });
  } catch (error) {
    handleError(res, error, "An error occurred while processing the account status request");
  }
};

// Récupérer une demande de changement de statut de compte pour un utilisateur
const getUserAccountStatusRequest = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!validateId(userId, res)) return;

    const result = await AdminService.getUserAccountStatusRequest(userId);
    res.json(result);
  } catch (error) {
    if (error.message === "User not found" || error.message === "No account status change request found") {
      return res.status(404).json({ message: error.message });
    }
    handleError(res, error, "An error occurred while retrieving the account status request");
  }
};

// Récupérer toutes les demandes de changement de statut de compte pour un utilisateur
const getUserAccountStatusRequests = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!validateId(userId, res)) return;

    const result = await AdminService.getUserAccountStatusRequests(userId);
    res.json(result);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found" });
    }
    handleError(res, error, "An error occurred while retrieving account status requests");
  }
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  deleteUser,
  toggleUserStatus,
  getAllUsers,
  configureAI,
  getAccountStatusRequests,
  processAccountStatusRequest,
  getUserAccountStatusRequest,
  getUserAccountStatusRequests,
};