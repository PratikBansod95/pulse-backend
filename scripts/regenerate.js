// scripts/regenerate.js
// Clears today's daily content from DB and Redis to trigger a fresh AI content generation.
// Run: node scripts/regenerate.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const redis = require('../src/config/redis');

async function main() {
  await redis.connectRedis();
  
  const today = new Date().toISOString().split('T')[0];
  console.log(`🧹 Clearing daily content for date: ${today}`);

  // Delete from PostgreSQL
  const deleteReads = await prisma.contentRead.deleteMany({
    where: { content_date: today }
  });
  
  const deleteContent = await prisma.dailyContent.deleteMany({
    where: { content_date: today }
  });

  console.log(`  - Deleted ${deleteReads.count} read records`);
  console.log(`  - Deleted ${deleteContent.count} daily content records`);

  // Clear Redis keys
  const keys = await redis.client.keys(`*:${today}`);
  for (const key of keys) {
    await redis.client.del(key);
    console.log(`  - Deleted Redis key: ${key}`);
  }

  console.log('✅ Done! Reopen the Pulse app on your phone to trigger a fresh AI content generation.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    if (redis.client.isOpen) {
      await redis.client.disconnect();
    }
  });
