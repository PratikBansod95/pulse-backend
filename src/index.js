// src/index.js
// Pulse Backend — Express Application Entry Point

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const usersRouter = require('./routes/users');
const contentRouter = require('./routes/content');
const reflectionsRouter = require('./routes/reflections');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://pulse-app.com'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' }
});
app.use('/api', limiter);

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────

app.get('/api/health', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const redisClient = require('./config/redis');

  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  } finally {
    await prisma.$disconnect();
  }

  try {
    await redisClient.client.ping();
    redisStatus = 'connected';
  } catch (e) {
    redisStatus = 'error';
  }

  res.json({
    status: dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    redis: redisStatus,
    version: '1.0.0'
  });
});

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.use('/api/users', usersRouter);
app.use('/api/content', contentRouter);
app.use('/api/reflections', reflectionsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use(errorHandler);

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start Express
    app.listen(PORT, () => {
      logger.info(`🚀 Pulse backend running on http://localhost:${PORT}`);
      logger.info(`   Health check: http://localhost:${PORT}/api/health`);
    });

    // Start scheduled jobs
    require('./jobs/contentGenerator');
    require('./jobs/notificationSender');
    require('./jobs/reengagementChecker');
    require('./jobs/weeklySignal');

    logger.info('✅ All scheduled jobs loaded');

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();

module.exports = app;
// force reload
