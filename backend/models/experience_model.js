const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
    company: { type: String, required: true },
    position: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: true },
}, { timestamps: true });

const Experience = mongoose.model('Experience', experienceSchema);

module.exports = Experience;
