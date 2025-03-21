const mongoose = require('mongoose');

const preferencesRecommendationSchema = new mongoose.Schema({
    notificationsActive: { type: Boolean, required: true },
    sectors: { type: [String], required: true },
    contractType: { type: [String], required: true },
    expectedSalary: { type: Number, required: true },
    location: { type: String, required: true },
    searchRadius: { type: Number, required: true },
}, { timestamps: true });

const PreferencesRecommendation = mongoose.model('PreferencesRecommendation', preferencesRecommendationSchema);

module.exports = PreferencesRecommendation;
