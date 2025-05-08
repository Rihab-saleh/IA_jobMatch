// models/adminConfig_model.js
const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
  llmModel: { type: String,enum:  ['mistral', 'llama2', 'mistral'],
     default: 'llama2' },
  allowedApiSources: { type: [String],
    enum: ['adzuna', 'reed', 'apijobs', 'jooble', 'findwork', 'remotive', 'scraped'],
    default: ['adzuna', 'reed', 'apijobs', 'jooble', 'findwork', 'remotive', 'scraped'] },
  dailyRunTime: { type: String , default: '00:00'}, 
}, { timestamps: true });

module.exports = mongoose.model('AdminConfig', adminConfigSchema);
