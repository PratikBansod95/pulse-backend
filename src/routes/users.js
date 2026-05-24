// src/routes/users.js

const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const redis = require('../config/redis');
const { authMiddleware, requireUser } = require('../middleware/auth');
const contentService = require('../services/contentService');
const { generateWeeklySummary } = require('../services/modules/module6_weeklySummary');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// POST /api/users/register
// ─────────────────────────────────────────

router.post('/register', authMiddleware, async (req, res, next) => {
  try {
    const {
      email, name,
      profession_primary, profession_sub,
      experience_years, experience_label,
      primary_goal, background_note,
      notification_preferred_time, notification_enabled
    } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { firebase_uid: req.firebaseUid }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already registered'
      });
    }

    const user = await prisma.user.create({
      data: {
        firebase_uid: req.firebaseUid,
        email: email || req.firebaseEmail,
        name,
        profession_primary,
        profession_sub,
        experience_years,
        experience_label,
        primary_goal,
        background_note: background_note || null,
        notification_preferred_time: notification_preferred_time || '07:00',
        notification_enabled: notification_enabled !== false,
        growth_profile: {
          blindspots_detected: [],
          strengths_observed: [],
          current_growth_thread: null,
          narrative_continuity_active: false,
          last_3_insight_topics: [],
          resonance_patterns: [],
          notification_preferred_style: 'curiosity'
        }
      }
    });

    // Trigger first content generation async
    const today = contentService.getTodayDate();
    redis.set(`generating:${user.id}:${today}`, 'true', { EX: 120 });
    contentService.generateForUser(user.id)
      .catch(err => logger.error('First content generation failed:', err.message));

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        profession_sub: user.profession_sub,
        experience_label: user.experience_label,
        primary_goal: user.primary_goal
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// GET /api/users/profile
// ─────────────────────────────────────────

router.get('/profile', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profession_primary: user.profession_primary,
        profession_sub: user.profession_sub,
        experience_label: user.experience_label,
        experience_years: user.experience_years,
        primary_goal: user.primary_goal,
        background_note: user.background_note,
        notification_enabled: user.notification_enabled,
        notification_preferred_time: user.notification_preferred_time,
        weekly_signal_enabled: user.weekly_signal_enabled,
        total_reads: user.total_reads,
        joined_at: user.joined_at,
        last_active: user.last_active,
        growth_profile: {
          resonance_patterns: user.growth_profile?.resonance_patterns || [],
          blindspots_detected: user.growth_profile?.blindspots_detected || [],
          current_growth_thread: user.growth_profile?.current_growth_thread || null,
          last_3_insight_topics: user.growth_profile?.last_3_insight_topics || [],
          notification_preferred_style: user.growth_profile?.notification_preferred_style || 'curiosity'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// PATCH /api/users/profile
// ─────────────────────────────────────────

router.patch('/profile', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const allowedFields = [
      'profession_primary', 'profession_sub',
      'experience_years', 'experience_label',
      'primary_goal', 'background_note'
    ];

    const updates = {};
    const updatedFields = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        updatedFields.push(field);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: updates
    });

    res.json({
      success: true,
      message: 'Profile updated. Your next insight will reflect this.',
      updated_fields: updatedFields
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// PATCH /api/users/notification-preferences
// ─────────────────────────────────────────

router.patch('/notification-preferences', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const { notification_enabled, notification_preferred_time, weekly_signal_enabled } = req.body;

    const updates = {};
    if (notification_enabled !== undefined) updates.notification_enabled = notification_enabled;
    if (notification_preferred_time !== undefined) updates.notification_preferred_time = notification_preferred_time;
    if (weekly_signal_enabled !== undefined) updates.weekly_signal_enabled = weekly_signal_enabled;

    await prisma.user.update({ where: { id: req.user.id }, data: updates });

    res.json({ success: true, message: 'Notification preferences updated.' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// POST /api/users/fcm-token
// ─────────────────────────────────────────

router.post('/fcm-token', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ success: false, error: 'fcm_token required' });
    }

    const user = req.user;
    let tokens = user.fcm_tokens || [];

    // Add if not already present
    if (!tokens.includes(fcm_token)) {
      tokens.push(fcm_token);
    }

    // Keep max 5 tokens (oldest removed)
    if (tokens.length > 5) {
      tokens = tokens.slice(-5);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { fcm_tokens: { set: tokens } }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────
// GET /api/users/growth-summary
// ─────────────────────────────────────────

router.get('/growth-summary', authMiddleware, requireUser, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Try cache first
    const cached = await redis.get(`growth_summary:${userId}`);
    if (cached) {
      return res.json({ success: true, summary: cached });
    }

    // Generate fresh summary
    const summary = await generateWeeklySummary(userId);
    res.json({ success: true, summary: { ...summary, generated_at: new Date().toISOString() } });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
