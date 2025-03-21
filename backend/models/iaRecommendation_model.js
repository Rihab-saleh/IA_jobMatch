const mongoose = require('mongoose');

const iaRecommendationSchema = new mongoose.Schema({
    algorithm: { type: String, required: true },
    parameters: { type: Map, of: String },
    threshold: { type: Number, required: true },
}, { timestamps: true });

const IARecommendation = mongoose.model('IARecommendation', iaRecommendationSchema);

module.exports = IARecommendation;
