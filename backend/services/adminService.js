const mongoose = require('mongoose');

const bcrypt = require("bcrypt");
const User = require("../models/user_model");
const VisitorLog = require("../models/visitor_model"); 
const Person = require("../models/person_model");
const Admin = require("../models/admin_model");
class AdminService {
  async toggleUserStatus(userId) {
    try {
      // Vérifier la connexion MongoDB
      if (mongoose.connection.readyState !== 1) {
        throw new Error("La connexion à la base de données n'est pas active");
      }
  
      // Validation de l'ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("ID utilisateur invalide");
      }
  
      // Trouver l'utilisateur avec jointure
      const user = await User.findById(userId)
        .populate('person')
        .orFail(() => new Error("Utilisateur introuvable"));
  
      // Basculer le statut
      user.person.isActive = !user.person.isActive;
      user.person.updatedAt = new Date();
      
      // Sauvegarder les modifications
      await user.person.save();
  
      return {
        success: true,
        message: `Compte ${user.person.isActive ? 'activé' : 'désactivé'} avec succès`,
        isActive: user.person.isActive
      };
  
    } catch (err) {
      console.error("Erreur toggleUserStatus:", err);
      throw new Error(`Échec de la mise à jour: ${err.message}`);
    }
  }
  async deleteUser(userId) {
    try {
      // Find the user
      const user = await User.findById(userId)
      if (!user) throw new Error("User not found")

      // Find and delete person record if it exists
      if (user.person) {
        await Person.findByIdAndDelete(user.person)
      }

      // Delete any account status requests for this user
      await AccountStatusRequest.deleteMany({ user: userId })

      // Delete the user
      await User.findByIdAndDelete(userId)

      return { message: "User deleted successfully" }
    } catch (err) {
      console.error("Error in deleteUser:", err)
      throw new Error(err.message)
    }
  }
  
  async getAllUsers(page = 1, limit = 10, search = "") {
    try {
      const skip = (page - 1) * limit;
      
      // Build search query if search parameter is provided
      let query = {};
      if (search) {
        // Search in person's firstName, lastName, or email
        query = {
          $or: [
            { 'person.firstName': { $regex: search, $options: 'i' } },
            { 'person.lastName': { $regex: search, $options: 'i' } },
            { 'person.email': { $regex: search, $options: 'i' } }
          ]
        };
      }

      // Use aggregation to properly filter with search
      const users = await User.aggregate([
        {
          $lookup: {
            from: 'people', // Assuming your Person collection is named 'people'
            localField: 'person',
            foreignField: '_id',
            as: 'personData'
          }
        },
        {
          $unwind: {
            path: '$personData',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: search ? {
            $or: [
              { 'personData.firstName': { $regex: search, $options: 'i' } },
              { 'personData.lastName': { $regex: search, $options: 'i' } },
              { 'personData.email': { $regex: search, $options: 'i' } }
            ]
          } : {}
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          $project: {
            _id: 1,
            firstName: '$personData.firstName',
            lastName: '$personData.lastName',
            email: '$personData.email',
            phoneNumber: '$personData.phoneNumber',
            isActive: 1,
            createdAt: 1
          }
        }
      ]);

      // Count total users matching the search criteria
      const totalUsersQuery = search ? {
        $or: [
          { 'personData.firstName': { $regex: search, $options: 'i' } },
          { 'personData.lastName': { $regex: search, $options: 'i' } },
          { 'personData.email': { $regex: search, $options: 'i' } }
        ]
      } : {};
      
      const totalUsers = await User.aggregate([
        {
          $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'personData'
          }
        },
        {
          $unwind: {
            path: '$personData',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: totalUsersQuery
        },
        {
          $count: 'total'
        }
      ]);

      const total = totalUsers.length > 0 ? totalUsers[0].total : 0;

      // Return in the format expected by the frontend
      return {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (err) {
      console.error("Error in getAllUsers:", err);
      throw new Error(err.message);
    }
  }

  // AI configuration
  async configureAI(aiConfig) {
    try {
      let aiRecommendation = await IARecommendation.findOne();
      if (!aiRecommendation) {
        aiRecommendation = new IARecommendation(aiConfig);
      } else {
        aiRecommendation.set(aiConfig);
      }
      await aiRecommendation.save();
      return aiRecommendation;
    } catch (err) {
      console.error("Error in configureAI:", err);
      throw new Error(err.message);
    }
  }

  // Admin CRUD operations
  async createAdmin(adminData) {
    try {
      // Check if email already exists in Person collection
      const existingPerson = await Person.findOne({ email: adminData.email });
      if (existingPerson) {
        throw new Error("Email already exists");
      }

      // Hash password
      if (adminData.password) {
        adminData.password = await bcrypt.hash(adminData.password, 10);
      } else {
        throw new Error("Password is required");
      }

      // Ensure role is admin
      adminData.role = "admin";

      // Create person record
      const person = new Person(adminData);
      await person.save();

      // Create admin record linked to person
      const admin = new Admin({
        person: person._id,
      });
      await admin.save();

      // Return person data without password
      const adminResponse = person.toObject();
      delete adminResponse.password;

      return adminResponse;
    } catch (err) {
      console.error("Error in createAdmin:", err);
      throw new Error(err.message);
    }
  }

// In adminService.js - replace the current getAllAdmins method with this:
async getAllAdmins(page = 1, limit = 10, search = "") {
  try {
    const skip = (page - 1) * limit;
    
    // Use aggregation to properly filter with search
    const admins = await Admin.aggregate([
      {
        $lookup: {
          from: 'people', // Assuming your Person collection is named 'people'
          localField: 'person',
          foreignField: '_id',
          as: 'personData'
        }
      },
      {
        $unwind: {
          path: '$personData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: search ? {
          $or: [
            { 'personData.firstName': { $regex: search, $options: 'i' } },
            { 'personData.lastName': { $regex: search, $options: 'i' } },
            { 'personData.email': { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          firstName: '$personData.firstName',
          lastName: '$personData.lastName',
          email: '$personData.email',
          phoneNumber: '$personData.phoneNumber',
          role: '$personData.role',
          isActive: '$personData.isActive',
          createdAt: 1
        }
      }
    ]);

    // Count total admins matching the search criteria
    const totalAdmins = await Admin.aggregate([
      {
        $lookup: {
          from: 'people',
          localField: 'person',
          foreignField: '_id',
          as: 'personData'
        }
      },
      {
        $unwind: {
          path: '$personData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: search ? {
          $or: [
            { 'personData.firstName': { $regex: search, $options: 'i' } },
            { 'personData.lastName': { $regex: search, $options: 'i' } },
            { 'personData.email': { $regex: search, $options: 'i' } }
          ]
        } : {}
      },
      {
        $count: 'total'
      }
    ]);

    const total = totalAdmins.length > 0 ? totalAdmins[0].total : 0;

    return {
      admins,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    console.error("Error in getAllAdmins:", err);
    throw new Error(err.message);
  }
}

  async getAdminById(adminId) {
    try {
      // First try to find by person ID
      let adminRecord = await Admin.findOne({ person: adminId })
        .populate({
          path: "person",
          select: "-password",
        })
        .lean();

      // If not found, try to find by admin ID
      if (!adminRecord) {
        adminRecord = await Admin.findById(adminId)
          .populate({
            path: "person",
            select: "-password",
          })
          .lean();
      }

      if (!adminRecord || !adminRecord.person) {
        throw new Error("Admin not found");
      }

      // Return person data with admin ID
      return {
        ...adminRecord.person,
        adminId: adminRecord._id
      };
    } catch (err) {
      console.error("Error in getAdminById:", err);
      throw new Error(err.message);
    }
  }

  async updateAdmin(adminId, adminData) {
    try {
      // Find the admin record first
      const adminRecord = await Admin.findOne({ person: adminId });
      
      // If not found by person ID, try by admin ID
      if (!adminRecord) {
        const adminByAdminId = await Admin.findById(adminId);
        if (adminByAdminId) {
          adminId = adminByAdminId.person; // Use the person ID for the update
        } else {
          throw new Error("Admin not found");
        }
      }

      // Prevent changing role from admin
      if (adminData.role && adminData.role !== "admin") {
        throw new Error("Cannot change admin role");
      }

      // Hash password if provided
      if (adminData.password) {
        adminData.password = await bcrypt.hash(adminData.password, 10);
      } else {
        // If no password provided, remove it from update data
        delete adminData.password;
      }

      // Update person record
      const updatedPerson = await Person.findByIdAndUpdate(adminId, adminData, { new: true }).select("-password");

      if (!updatedPerson) {
        throw new Error("Admin not found");
      }

      return updatedPerson;
    } catch (err) {
      console.error("Error in updateAdmin:", err);
      throw new Error(err.message);
    }
  }

  async deleteAdmin(adminId) {
    try {
      // Check if this is the last admin
      const adminCount = await Admin.countDocuments();
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last admin");
      }

      // Find admin record by person ID first
      let adminRecord = await Admin.findOne({ person: adminId });
      
      // If not found, try by admin ID
      if (!adminRecord) {
        adminRecord = await Admin.findById(adminId);
        if (adminRecord) {
          adminId = adminRecord.person; // Use the person ID for deletion
        } else {
          throw new Error("Admin not found");
        }
      }

      // Delete admin record
      await Admin.findOneAndDelete({ person: adminId });

      // Delete person record
      const deletedPerson = await Person.findByIdAndDelete(adminId);
      if (!deletedPerson) {
        throw new Error("Admin person record not found");
      }

      return { message: "Admin deleted successfully" };
    } catch (err) {
      console.error("Error in deleteAdmin:", err);
      throw new Error(err.message);
    }
  }

  async getAccountStatusRequests(filters = {}, page = 1, limit = 10) {
    try {
      const { userId, status, requestType } = filters;
      const skip = (page - 1) * limit;
      const query = {};

      if (userId) {
        const userExists = await User.exists({ _id: userId });
        if (!userExists) throw new Error("Utilisateur introuvable");
        query.user = userId;
      }
      if (status) query.status = status;
      if (requestType) query.requestType = requestType;

      const [requests, totalCount] = await Promise.all([
        AccountStatusRequest.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 })
          .populate('user', 'email firstName lastName')
          .lean(),
        AccountStatusRequest.countDocuments(query)
      ]);

      return {
        requests: requests.map(req => ({
          ...req,
          user: {
            _id: req.user._id,
            email: req.user.email,
            fullName: `${req.user.firstName} ${req.user.lastName}`
          }
        })),
        pagination: {
          total: totalCount,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (err) {
      console.error("Erreur getAccountStatusRequests:", err);
      throw new Error(err.message);
    }
  }

  
  async processAccountStatusRequest(requestId, action) {
    try {
      const request = await AccountStatusRequest.findById(requestId);
      if (!request) throw new Error("Demande introuvable");

      const user = await User.findById(request.user);
      if (!user) throw new Error("Utilisateur introuvable");

      const person = await Person.findById(user.person);
      if (!person) throw new Error("Profil utilisateur introuvable");

      // Mettre à jour le statut de la demande
      request.status = action === "approve" ? "approved" : "rejected";
      request.processedAt = new Date();
      await request.save();

      // Mettre à jour le statut utilisateur si approuvé
      if (action === "approve") {
        person.isActive = request.requestType === "deactivate" ? false : true;
        await person.save();
      }

      return {
        success: true,
        message: `Demande ${request.requestType} ${request.status}`,
        newStatus: person.isActive
      };

    } catch (err) {
      console.error("Erreur processAccountStatusRequest:", err);
      throw new Error(`Échec du traitement: ${err.message}`);
    }
  }
  async getStats()
  {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
  
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)
  
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1) // Start of current month
  
      // Execute all queries in parallel with Promise.all for better performance
      const [
        activeUsers,
        inactiveUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        totalAdmins,
        totalVisitors,
        visitorsToday,
        visitorsThisWeek,
        visitorsThisMonth,
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: startOfWeek } }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Admin.countDocuments(),
        VisitorLog.countDocuments(),
        VisitorLog.countDocuments({ timestamp: { $gte: today } }),
        VisitorLog.countDocuments({ timestamp: { $gte: startOfWeek } }),
        VisitorLog.countDocuments({ timestamp: { $gte: startOfMonth } }),
      ])
  
      // Return formatted statistics
      return {
        users: {
          total: activeUsers + inactiveUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          today: newUsersToday,
          thisWeek: newUsersThisWeek,
          thisMonth: newUsersThisMonth
        },
        visitors: {
          total: totalVisitors,
          today: visitorsToday,
          thisWeek: visitorsThisWeek,
          thisMonth: visitorsThisMonth
        },
        admins: {
          total: totalAdmins
        }
      };
    } catch (err) {
      console.error("Error in getStats:", err)
      throw new Error("Failed to fetch statistics")
    }
  }
  
  
}


module.exports = new AdminService();

