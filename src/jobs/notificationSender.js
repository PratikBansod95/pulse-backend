// src/jobs/notificationSender.js
// Runs every minute — sends notifications at users' preferred times

const cron = require('node-cron');
const prisma = require('../config/database');
const { sendMorningNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

  try {
    const users = await prisma.user.findMany({
      where: {
        notification_enabled: true,
        notification_preferred_time: currentTime
      },
      select: { id: true }
    });

    if (users.length === 0) return;

    logger.info(`Sending notifications to ${users.length} users at ${currentTime} UTC`);

    await Promise.allSettled(
      users.map(user => sendMorningNotification(user.id))
    );

  } catch (error) {
    logger.error('Notification sender job failed:', error.message);
  }
});

logger.info('Notification sender job scheduled (every minute)');
