// src/jobs/weeklySignal.js
// Runs every Friday at 9 AM UTC

const cron = require('node-cron');
const prisma = require('../config/database');
const { generateWeeklySummary } = require('../services/modules/module6_weeklySummary');
const { sendCustomNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

// Every Friday at 9 AM UTC
cron.schedule('0 9 * * 5', async () => {
  logger.info('=== Weekly signal job started ===');

  try {
    const users = await prisma.user.findMany({
      where: { weekly_signal_enabled: true },
      select: { id: true }
    });

    logger.info(`Generating weekly summaries for ${users.length} users`);

    for (const user of users) {
      try {
        const summary = await generateWeeklySummary(user.id);

        // Send notification about weekly summary
        if (summary.reads_this_week > 0) {
          await sendCustomNotification(
            user.id,
            'Your week in review',
            summary.forward_thought,
            'pulse://profile',
            'weekly_signal'
          );
        }

        // Small delay between users
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        logger.error(`Weekly signal failed for user ${user.id}:`, err.message);
      }
    }

    logger.info('=== Weekly signal job complete ===');

  } catch (error) {
    logger.error('Weekly signal job failed:', error.message);
  }
});

logger.info('Weekly signal job scheduled (9 AM UTC every Friday)');
