// src/jobs/reengagementChecker.js
// Runs daily at 10 AM UTC — re-engages users inactive for 5+ days

const cron = require('node-cron');
const prisma = require('../config/database');
const { sendCustomNotification } = require('../services/notificationService');
const { generateReengagement } = require('../services/modules/module4_reengagement');
const logger = require('../utils/logger');

cron.schedule('0 10 * * *', async () => {
  logger.info('=== Re-engagement checker job started ===');

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const sixDaysAgo = new Date();
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const users = await prisma.user.findMany({
      where: {
        notification_enabled: true,
        last_active: {
          lte: fiveDaysAgo,
          gte: sixDaysAgo  // Only users in the 5-6 day inactive window
        },
        OR: [
          { reengagement_sent_at: null },
          { reengagement_sent_at: { lte: thirtyDaysAgo } }
        ],
        fcm_tokens: { isEmpty: false }
      }
    });

    logger.info(`Found ${users.length} users for re-engagement`);

    for (const user of users) {
      try {
        const daysInactive = Math.floor(
          (Date.now() - new Date(user.last_active).getTime()) / 86400000
        );

        const result = await generateReengagement(user, daysInactive);
        const notificationText = result.reengagement.push_notification;

        await sendCustomNotification(
          user.id,
          'Pulse',
          notificationText,
          'pulse://today',
          'reengagement'
        );

        await prisma.user.update({
          where: { id: user.id },
          data: { reengagement_sent_at: new Date() }
        });

        logger.info(`Re-engagement sent to user ${user.id}`);

      } catch (err) {
        logger.error(`Re-engagement failed for user ${user.id}:`, err.message);
      }
    }

    logger.info('=== Re-engagement checker job complete ===');

  } catch (error) {
    logger.error('Re-engagement checker job failed:', error.message);
  }
});

logger.info('Re-engagement checker scheduled (10 AM UTC daily)');
