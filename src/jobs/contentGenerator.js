// src/jobs/contentGenerator.js
// Daily 2 AM content generation job

const cron = require('node-cron');
const prisma = require('../config/database');
const contentService = require('../services/contentService');
const logger = require('../utils/logger');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run at 2:00 AM UTC every day
cron.schedule('0 2 * * *', async () => {
  logger.info('=== Daily content generation job started ===');

  try {
    const users = await prisma.user.findMany({
      where: { notification_enabled: true },
      select: { id: true }
    });

    logger.info(`Generating content for ${users.length} users`);

    // Process in batches of 10 (Gemini rate limit)
    const batchSize = 10;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(user => contentService.generateForUser(user.id))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') success++;
        else failed++;
      });

      // Wait 2s between batches (Gemini rate limit safety)
      if (i + batchSize < users.length) {
        await sleep(2000);
      }
    }

    logger.info(`=== Content job complete — ${success} success, ${failed} failed ===`);

  } catch (error) {
    logger.error('Content generation job failed:', error.message);
  }
});

logger.info('Content generator job scheduled (2 AM UTC daily)');
