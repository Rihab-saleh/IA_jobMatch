const mongoose = require('mongoose');
const experienceSchema = require('./experience_model').schema;
const formationSchema = require('./formation_model').schema;
const skillSchema = require('./skill_model').schema;

const profileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    experiences: [experienceSchema],
    formations: [formationSchema],
    skills: [skillSchema],
    location: { type: String, required: true, minlength: 2, maxlength: 100 },
    jobTitle: { type: String, required: true, minlength: 2, maxlength: 50 }
}, { timestamps: true });

profileSchema.index({ location: 1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
