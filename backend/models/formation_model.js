const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    school: { type: String, required: true },
    degree: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, required: true },
}, { timestamps: true });

const Formation = mongoose.model('Formation', formationSchema);

module.exports = Formation;
