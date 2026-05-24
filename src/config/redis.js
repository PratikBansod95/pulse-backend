// src/config/redis.js

const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err.message);
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

async function connectRedis() {
  await redisClient.connect();
}

// Convenience wrappers that match the spec's redis.setex / redis.del pattern
const redis = {
  async setex(key, seconds, value) {
    await redisClient.setEx(key, seconds, typeof value === 'string' ? value : JSON.stringify(value));
  },
  async get(key) {
    const val = await redisClient.get(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  },
  async del(key) {
    await redisClient.del(key);
  },
  async set(key, value, options = {}) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    if (options.EX) {
      await redisClient.setEx(key, options.EX, strVal);
    } else {
      await redisClient.set(key, strVal);
    }
  },
  async exists(key) {
    return await redisClient.exists(key);
  },
  client: redisClient
};

module.exports = redis;
module.exports.connectRedis = connectRedis;
