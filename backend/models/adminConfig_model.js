// models/adminConfig_model.js
const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
  llmModel: { type: String, default: 'mistral' },
  allowedApiSources: { type: [String],
    enum: ['adzuna', 'reed', 'apijobs', 'jooble', 'findwork', 'remotive', 'scraped'],
    default: ['adzuna', 'reed', 'apijobs', 'jooble', 'findwork', 'remotive', 'scraped'] },
  dailyRunTime: { type: String ||'00:00' }, 
}, { timestamps: true });

module.exports = mongoose.model('AdminConfig', adminConfigSchema);
