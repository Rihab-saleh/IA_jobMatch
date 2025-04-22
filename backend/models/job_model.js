// models/Job_model.js
const mongoose = require('mongoose');
const validator = require('validator');

const jobMetaSchema = new mongoose.Schema({
  language: {
    type: String,
    default: 'english'
  },
  domain: {
    type: String,
    index: true
  }
});

const jobSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  salary: {
    type: String,
    default: 'Non spécifié'
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: v => validator.isURL(v),
      message: props => `${props.value} n'est pas une URL valide!`
    }
  },
  datePosted: {
    type: String,
    required: true,
    match: [/^\d{2}\/\d{2}\/\d{4}$/, 'Format de date invalide (DD/MM/YYYY)']
  },
  jobType: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    default: 'Non spécifié'
  },
  skills: [{
    type: String,
    trim: true
  }],
  meta: jobMetaSchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

// Virtuals
jobSchema.virtual('experienceLevel').get(function() {
  const levels = {
    'Non spécifié': 0,
    'Entry Level': 1,
    'Mid Level': 2,
    'Senior Level': 3
  };
  return levels[this.experience] || 0;
});

module.exports = mongoose.model('Job', jobSchema);