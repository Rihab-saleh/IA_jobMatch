// services/jobAlertService.js
const Notification = require('../models/notification_model');
const { getRecommendationsForUser } = require('./recommendationService');

const JOB_ALERT_CONFIG = {
  MAX_RESULTS: 5,
  DESCRIPTION_TRUNCATE: 120,
  SKILLS_LIMIT: 3
};

// Helper functions
const truncateText = (text) => {
  if (!text) return 'No description available';
  return text.length > JOB_ALERT_CONFIG.DESCRIPTION_TRUNCATE
    ? text.substring(0, JOB_ALERT_CONFIG.DESCRIPTION_TRUNCATE) + '...'
    : text;
};

const formatJobAlertContent = (job) => {
  const skills = job.skills?.slice(0, JOB_ALERT_CONFIG.SKILLS_LIMIT) || [];
  
  return [
    `🚨 New Job Match: ${job.title}`,
    `🏢 Company: ${job.company || 'Confidential'}`,
    `📍 Location: ${job.location || 'Not specified'}`,
    `📈 Match: ${job.matchPercentage}%`,
    `🔗 Source: ${job.source || 'Various job boards'}`,
    `📝 Description: ${truncateText(job.description)}`,
    `🛠️ Required Skills: ${skills.join(', ') || 'Not specified'}`,
    `💡 Match Reason: ${job.matchReason || 'Strong profile alignment'}`
  ].join('\n');
};

// Main service function
async function generateJobAlerts(userId) {
  try {
    // Get recommendations from existing service
    const recommendations = await getRecommendationsForUser(userId);
    
    // Filter and limit results
    const topJobs = recommendations
      .filter(job => job.matchPercentage >= 65)
      .slice(0, JOB_ALERT_CONFIG.MAX_RESULTS);

    // Create notifications
    const notifications = topJobs.map(job => ({
      userId,
      notificationType: 'jobAlert',
      content: formatJobAlertContent(job),
      read: false,
      metadata: {
        jobId: job.id,
        source: job.source,
        matchPercentage: job.matchPercentage,
        timestamp: new Date()
      }
    }));

    // Save to database
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return {
      success: true,
      count: notifications.length,
      message: `${notifications.length} job alerts generated`
    };

  } catch (error) {
    console.error(`Job alert error for user ${userId}:`, error.message);
    return {
      success: false,
      message: 'Failed to generate job alerts',
      error: error.message
    };
  }
}

module.exports = {
  generateJobAlerts
};