const mongoose = require('mongoose');
const userSchema = require('./user_model').schema;
const jobSchema = require('./job_model').schema;

const recommendationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    matchingScore: { type: Number, required: true },
    dateGenerated: { type: Date, required: true },
    status: { type: String, enum: ['Accepted', 'Rejected', 'Pending'], required: true },
}, { timestamps: true });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = Recommendation;
