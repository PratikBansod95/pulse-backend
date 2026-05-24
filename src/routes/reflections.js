// src/routes/reflections.js

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authMiddleware, requireUser } = require('../middleware/auth');
const { processReflection } = require('../services/modules/module5_reflectionProcessor');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// POST /api/reflections
// ─────────────────────────────────────────

router.post('/', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const { content_id, response } = req.body;
    const userId = req.user.id;

    if (!content_id || !response) {
      return res.status(400).json({ success: false, error: 'content_id and response required' });
    }

    if (!['yes', 'no'].includes(response)) {
      return res.status(400).json({ success: false, error: 'response must be "yes" or "no"' });
    }

    // Verify content belongs to user
    const content = await prisma.dailyContent.findUnique({
      where: { id: content_id }
    });

    if (!content || content.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Check for duplicate reflection
    const existing = await prisma.reflection.findUnique({
      where: { user_id_content_id: { user_id: userId, content_id } }
    });

    if (!existing) {
      await prisma.reflection.create({
        data: {
          user_id: userId,
          content_id,
          content_date: content.content_date,
          response
        }
      });
    }

    // Process reflection async — fire and forget
    processReflection(userId, content_id, response)
      .catch(err => logger.error('Module 5 async processing failed:', err.message));

    res.json({ success: true });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
