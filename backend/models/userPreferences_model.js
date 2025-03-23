const mongoose = require('mongoose');

const UserPreferencesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    notificationsActive: { type: Boolean, default: true },
    sectors: { type: [String], required: true, validate: v => v.length > 0 },
    contractTypes: { type: [String], required: true, validate: v => v.length > 0 },
    expectedSalary: {
      amount: { type: Number, min: 0, required: false },
      currency: { type: String, default: 'USD' },
    },
    location: {
      city: { type: String },
      country: { type: String },
  
    },

    preferredJobTypes: { type: [String], default: [] },
    experienceLevel: { type: [String], default: [] }, // Example: ["Junior", "Mid", "Senior"]
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
);

const UserPreferences = mongoose.model('UserPreferences', UserPreferencesSchema);

module.exports = UserPreferences;
