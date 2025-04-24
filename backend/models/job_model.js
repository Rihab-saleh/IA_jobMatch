const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  company: {
    display_name: String
  },
  location: {
    display_name: String
  },
  created: { type: Date, default: Date.now },
  skillsRequired: [{
    name: String,
    level: String
  }],
  
  salary: Number,
  contractType: String,
  source: String,
  sourceId: String,
  sourceUrl: String,
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Job", jobSchema);