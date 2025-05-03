const VisitorLog = require('../models/visitor_model');
const logVisitor = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Check if the same IP has visited in the last minute
  const recentVisit = await VisitorLog.findOne({
    ip: ip,
    timestamp: { $gte: new Date(Date.now() - 60 * 1000) } // within the last minute
  });

  if (recentVisit) {
    // If the visitor logged recently, don't create a new log
    return next(); // Proceed to the next middleware or route handler
  }

  // If it's a new visit or it's been more than a minute, log it
  const log = new VisitorLog({
    ip: ip,
    userAgent: req.headers['user-agent'],
    route: req.originalUrl,
    method: req.method,
  });

  try {
    await log.save();
  } catch (err) {
    console.error('Erreur enregistrement visiteur :', err);
  }

  next(); // Proceed to the next middleware or route handler
};
module.exports = logVisitor;