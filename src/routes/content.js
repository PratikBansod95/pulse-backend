// src/routes/content.js

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const redis = require('../config/redis');
const { authMiddleware, requireUser } = require('../middleware/auth');
const contentService = require('../services/contentService');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// GET /api/content/today
// ─────────────────────────────────────────

router.get('/today', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = contentService.getTodayDate();

    // Update last_active
    await prisma.user.update({
      where: { id: userId },
      data: { last_active: new Date() }
    });

    // Try Redis cache first
    const cached = await redis.get(`content:${userId}:${today}`);
    if (cached && cached.image_generated !== false) {
      // Check if read
      const read = await prisma.contentRead.findUnique({
        where: { content_id: cached.id }
      }).catch(() => null);

      return res.json({
        success: true,
        content: formatContent(cached, read)
      });
    }

    // Check if generating
    const isGenerating = await redis.exists(`generating:${userId}:${today}`);
    if (isGenerating) {
      return res.status(202).json({
        success: true,
        status: 'generating',
        message: 'Your insight is being prepared.',
        retry_after_seconds: 10
      });
    }

    // Check database
    const content = await prisma.dailyContent.findUnique({
      where: { user_id_content_date: { user_id: userId, content_date: today } },
      include: { content_read: true }
    });

    if (content) {
      // Cache it
      await redis.setex(`content:${userId}:${today}`, 86400, content);
      return res.json({
        success: true,
        content: formatContent(content, content.content_read)
      });
    }

    // Trigger generation
    await redis.set(`generating:${userId}:${today}`, 'true', { EX: 120 });
    contentService.generateForUser(userId)
      .catch(err => logger.error('On-demand generation failed:', err.message));

    res.status(202).json({
      success: true,
      status: 'generating',
      message: 'Your insight is being prepared.',
      retry_after_seconds: 10
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// GET /api/content/archive
// ─────────────────────────────────────────

router.get('/archive', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const pillarFilter = req.query.pillar;

    const skip = (page - 1) * limit;

    const where = {
      user_id: userId,
      ...(pillarFilter ? { pillar: pillarFilter } : {})
    };

    const [contents, total] = await Promise.all([
      prisma.dailyContent.findMany({
        where,
        orderBy: { content_date: 'desc' },
        skip,
        take: limit,
        include: { content_read: true }
      }),
      prisma.dailyContent.count({ where })
    ]);

    res.json({
      success: true,
      archive: contents.map(c => ({
        id: c.id,
        content_date: c.content_date,
        pillar: c.pillar,
        topic: c.topic,
        hook_line: c.hook_line,
        image_url: c.image_url,
        is_read: !!c.content_read,
        read_at: c.content_read?.read_at || null,
        estimated_read_minutes: c.estimated_read_minutes
      })),
      pagination: {
        page,
        limit,
        total,
        has_more: skip + limit < total
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// GET /api/content/:contentId
// ─────────────────────────────────────────

router.get('/:contentId', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    const content = await prisma.dailyContent.findUnique({
      where: { id: contentId },
      include: { content_read: true }
    });

    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    if (content.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({
      success: true,
      content: formatContent(content, content.content_read)
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// POST /api/content/read
// ─────────────────────────────────────────

router.post('/read', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const { content_id, read_duration_seconds } = req.body;
    const userId = req.user.id;

    if (!content_id) {
      return res.status(400).json({ success: false, error: 'content_id required' });
    }

    // Verify content belongs to user
    const content = await prisma.dailyContent.findUnique({
      where: { id: content_id }
    });

    if (!content || content.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }

    // Check if already read
    const existingRead = await prisma.contentRead.findUnique({
      where: { content_id }
    });

    if (!existingRead) {
      // Create read record
      await prisma.contentRead.create({
        data: {
          user_id: userId,
          content_id,
          content_date: content.content_date,
          read_duration_seconds: read_duration_seconds || null
        }
      });

      // Increment total reads
      await prisma.user.update({
        where: { id: userId },
        data: {
          total_reads: { increment: 1 },
          last_active: new Date()
        }
      });
    }

    // Invalidate cache
    await redis.del(`content:${userId}:${content.content_date}`);

    res.json({ success: true, message: 'Marked as read.' });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// POST /api/content/generate
// ─────────────────────────────────────────

router.post('/generate', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = contentService.getTodayDate();

    // Set generating flag
    await redis.set(`generating:${userId}:${today}`, 'true', { EX: 120 });

    // Trigger async
    contentService.generateForUser(userId)
      .catch(err => logger.error('On-demand generation failed:', err.message));

    res.json({
      success: true,
      status: 'generating',
      estimated_seconds: 15
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// HELPER — Format content response
// ─────────────────────────────────────────

function formatContent(content, read) {
  return {
    id: content.id,
    content_date: content.content_date,
    pillar: content.pillar,
    topic: content.topic,
    estimated_read_minutes: content.estimated_read_minutes,
    lock_screen: {
      hook_line: content.hook_line,
      sub_line: content.sub_line
    },
    content: content.content,
    image_url: content.image_url,
    is_read: !!read,
    read_at: read?.read_at || null
  };
}

module.exports = router;
