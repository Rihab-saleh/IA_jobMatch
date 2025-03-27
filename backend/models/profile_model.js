const mongoose = require('mongoose');
const experienceSchema = require('./experience_model').schema;
const formationSchema = require('./formation_model').schema;
const languageSchema = require('./language_model').schema;
const skillSchema = require('./skill_model').schema;

const profileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // One profile per user
  },
  experiences: [experienceSchema],
  formations: [formationSchema],
  languages: [languageSchema],
  certifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification'
  }],// Fixed typo from 'cerfications'
  skills: [skillSchema],
  location: { 
    type: String, 
    required: true, 
    minlength: 2, 
    maxlength: 100 
  },
  position: {  // Changed from jobTitle to match frontend
    type: String, 
    required: false, 
    minlength: 2, 
    maxlength: 50 
  },
  bio: {  // Added for frontend compatibility
    type: String,
    maxlength: 1000,
    default: ''
  },
  profileCompleteness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true } 
});

// Indexes for better query performance
profileSchema.index({ location: 1 });
profileSchema.index({ position: 1 });
profileSchema.index({ 'skills.name': 1 });

// Virtual to populate user data
profileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;