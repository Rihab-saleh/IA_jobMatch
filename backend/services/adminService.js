const bcrypt = require("bcrypt");
const User = require("../models/user_model");
const AccountStatusRequest = require("../models/accountstatus_request");
const Person = require("../models/person_model");
const Admin = require("../models/admin_model");
const IARecommendation = require("../models/recommendation_model");

class AdminService {
  async toggleUserStatus(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      user.isActive = !user.isActive;
      await user.save();
      return {
        message: user.isActive ? "User activated successfully" : "User deactivated successfully",
        userStatus: user.isActive,
      };
    } catch (err) {
      console.error("Error in toggleUserStatus:", err);
      throw new Error(err.message);
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

  async getAllAdmins(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      // Find all admin records and populate person data
      const adminRecords = await Admin.find()
        .skip(skip)
        .limit(limit)
        .populate({
          path: "person",
          select: "-password",
        })
        .lean();

      // Extract person data from admin records
      const admins = adminRecords
        .map((record) => {
          // Ensure we have person data
          if (!record.person) {
            return null;
          }
          return record.person;
        })
        .filter(Boolean); // Remove any null values

      const totalAdmins = await Admin.countDocuments();

      return {
        admins,
        pagination: {
          total: totalAdmins,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalAdmins / limit),
        },
      };
    } catch (err) {
      console.error("Error in getAllAdmins:", err);
      throw new Error(err.message);
    }
  }

  async getAdminById(adminId) {
    try {
      // Find admin record and populate person data
      const adminRecord = await Admin.findOne({ person: adminId })
        .populate({
          path: "person",
          select: "-password",
        })
        .lean();

      if (!adminRecord || !adminRecord.person) {
        return null;
      }

      return adminRecord.person;
    } catch (err) {
      console.error("Error in getAdminById:", err);
      throw new Error(err.message);
    }
  }

  async updateAdmin(adminId, adminData) {
    try {
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

      // Find admin record
      const adminRecord = await Admin.findOne({ person: adminId });
      if (!adminRecord) {
        throw new Error("Admin record not found");
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

      // Find and delete admin record
      const adminRecord = await Admin.findOneAndDelete({ person: adminId });
      if (!adminRecord) {
        throw new Error("Admin record not found");
      }

      // Delete person record
      const deletedPerson = await Person.findByIdAndDelete(adminId);
      if (!deletedPerson) {
        throw new Error("Admin not found");
      }

      return { message: "Admin deleted successfully" };
    } catch (err) {
      console.error("Error in deleteAdmin:", err);
      throw new Error(err.message);
    }
  }

  async getAccountStatusRequests(status = "pending", page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      // Construire la requête en fonction du statut
      const query = status === "all" ? {} : { status };

      // Récupérer les demandes avec pagination
      const requests = await AccountStatusRequest.find(query)
        .populate({
          path: "user",
          select: "firstName lastName email", // Sélectionner les champs nécessaires
        })
        .skip(skip)
        .limit(limit)
        .lean();

      // Compter le nombre total de demandes
      const totalCount = await AccountStatusRequest.countDocuments(query);

      return {
        requests,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (err) {
      console.error("Error in getAccountStatusRequests:", err);
      throw new Error(err.message);
    }
  }

  async getUserAccountStatusRequests(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      
      // Get requests with pagination
      const requests = await AccountStatusRequest.find({ user: userId })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();
        
      // Count total requests for this user
      const totalCount = await AccountStatusRequest.countDocuments({ user: userId });
      
      return {
        requests,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (err) {
      console.error("Error in getUserAccountStatusRequests:", err);
      throw new Error(err.message);
    }
  }

  async getUserAccountStatusRequest(userId) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) throw new Error("User not found");
      
      // Get the most recent request
      const request = await AccountStatusRequest.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
        
      if (!request) {
        throw new Error("No account status change request found");
      }
      
      return request;
    } catch (err) {
      console.error("Error in getUserAccountStatusRequest:", err);
      throw new Error(err.message);
    }
  }

  async processAccountStatusRequest(requestId, action) {
    try {
      const request = await AccountStatusRequest.findById(requestId);
      if (!request) throw new Error("Account status request not found");

      const user = await User.findById(request.user);
      if (!user) throw new Error("User not found");

      const person = await Person.findById(user.person);
      if (!person) throw new Error("Person data not found");

      // Mettre à jour le statut de la demande dans la collection AccountStatusRequest
      request.status = action === "approve" ? "approved" : "rejected";
      await request.save();

      // Mettre à jour le statut de l'utilisateur si la demande est approuvée
      if (action === "approve") {
        person.status = "inactive";
        await person.save();
      }

      return { message: `Account status request ${action}ed successfully` };
    } catch (err) {
      console.error("Error in processAccountStatusRequest:", err);
      throw new Error(err.message);
    }
  }
}

module.exports = new AdminService();
