// src/middleware/auth.js
// Firebase token verification middleware

const admin = require('../config/firebase');
const prisma = require('../config/database');
const logger = require('../utils/logger');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No authorization token provided'
    });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    req.firebaseEmail = decodedToken.email;

    // Attach user from database
    const user = await prisma.user.findUnique({
      where: { firebase_uid: decodedToken.uid }
    });

    if (user) {
      req.user = user;
    }
    // Note: user may not exist yet during registration — that's OK

    next();
  } catch (error) {
    logger.warn('Auth token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

// Middleware that requires user to exist in DB (use after authMiddleware)
function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(404).json({
      success: false,
      error: 'User profile not found. Please complete registration.'
    });
  }
  next();
}

module.exports = { authMiddleware, requireUser };
