const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    school: { type: String, required: true },
    degree: { type: String, required: true },
    location: { type: String, required: false },
    fieldOfStudy: { type: String, required: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    current: { type: Boolean, default: false },
    description: { type: String, required: true },
}, { timestamps: true });

const Formation = mongoose.model('Formation', formationSchema);

module.exports = Formation;
