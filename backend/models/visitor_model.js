const mongoose = require('mongoose');

const VisitorLogSchema = new mongoose.Schema({ 
    ip: String, 
    userAgent: String, 
    route: String, 
    method: String, 
    timestamp: { type: Date, default: Date.now } });

module.exports = mongoose.model('VisitorLog', VisitorLogSchema);