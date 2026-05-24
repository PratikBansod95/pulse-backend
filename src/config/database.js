// src/config/database.js

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn']
    : ['error']
});

// Test connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error.message);
    throw error;
  }
}

module.exports = prisma;
module.exports.connectDatabase = connectDatabase;
