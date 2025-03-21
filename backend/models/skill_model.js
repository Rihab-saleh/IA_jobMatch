// models/skill.model.js

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: { type: String, required: true },
    level: { type: String, required: true },
    category: { type: String, required: false },
});

module.exports = mongoose.model('Skill', skillSchema);
