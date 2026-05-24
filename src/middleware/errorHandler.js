// src/middleware/errorHandler.js

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} — ${err.message}`, err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Record already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = errorHandler;
