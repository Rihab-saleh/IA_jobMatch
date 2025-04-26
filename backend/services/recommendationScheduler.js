const cron = require('node-cron');
const AdminConfig = require('../models/adminConfig_model');
const { getAllUsers } = require('../services/adminService'); 
const { getRecommendationsForUser, saveRecommendedJobs } = require('../services/userService');

let scheduledTask = null;

async function startScheduledRecommendations() {
  if (scheduledTask) {
    scheduledTask.stop();
  }

  const config = await AdminConfig.findOne().sort({ updatedAt: -1 });
  const dailyTime = config?.dailyRunTime || '00:00';
  const [hour, minute] = dailyTime.split(':').map(Number);
  const cronExpr = `${minute} ${hour} * * *`;

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log(`[CRON] Running recommendations at ${dailyTime}`);
    const users = await getAllUsers();
    for (const user of users) {
      try {
        const jobs = await getRecommendationsForUser(user._id);
        await saveRecommendedJobs(user._id, jobs);
      } catch (err) {
        console.error(`[ERROR] Recommendation failed for user ${user._id}:`, err.message);
      }
    }
  });
}

module.exports = { startScheduledRecommendations };
