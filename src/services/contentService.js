// src/services/contentService.js
// Main content generation pipeline — wires all 6 modules

const prisma = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const { generateDailyContent } = require('./modules/module1_contentGenerator');
const { generateImagePrompt } = require('./modules/module2_imagePrompt');
const { generateNotifications } = require('./modules/module3_notificationGenerator');
const imageService = require('./imageService');

// ─────────────────────────────────────────
// GENERATE DAILY CONTENT FOR ONE USER
// ─────────────────────────────────────────

async function generateForUser(userId) {
  const today = getTodayDate();

  try {
    // Get user with full profile
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new Error(`User ${userId} not found`);

    // Check if content already exists
    const existing = await prisma.dailyContent.findUnique({
      where: {
        user_id_content_date: { user_id: userId, content_date: today }
      }
    });

    if (existing) {
      logger.info(`Content already exists for user ${userId} on ${today}`);
      return existing;
    }

    // Build user intelligence object
    const userIntelligence = buildUserIntelligence(user);

    // Get recent content to avoid repetition
    const recentContent = await prisma.dailyContent.findMany({
      where: { user_id: userId },
      orderBy: { content_date: 'desc' },
      take: 3,
      select: { topic: true, pillar: true }
    });

    // Module 1 — Generate daily content
    const contentJSON = await generateDailyContent(userIntelligence, recentContent, today);

    // Module 2 — Generate image prompt
    const imagePromptJSON = await generateImagePrompt(
      contentJSON.daily_read.image_brief
    );

    // Module 3 — Generate notification variants
    const notificationsJSON = await generateNotifications(
      contentJSON,
      userIntelligence
    );

    // Pick the best notification for this user
    const preferredStyle = user.growth_profile?.notification_preferred_style || 'curiosity';
    const notificationText =
      notificationsJSON.notifications?.morning_variants?.[preferredStyle] ||
      contentJSON.daily_read.notification.morning_push;

    // Save content to database first
    const savedContent = await prisma.dailyContent.upsert({
      where: {
        user_id_content_date: { user_id: userId, content_date: today }
      },
      create: {
        user_id: userId,
        content_date: today,
        pillar: contentJSON.daily_read.metadata.pillar,
        topic: contentJSON.daily_read.metadata.topic,
        estimated_read_minutes: contentJSON.daily_read.metadata.estimated_read_minutes || 2,
        personalization_used: contentJSON.daily_read.metadata.personalization_elements_used || [],
        hook_line: contentJSON.daily_read.lock_screen.hook_line,
        sub_line: contentJSON.daily_read.lock_screen.subline || '',
        notification_text: notificationText,
        notification_style: preferredStyle,
        content: contentJSON.daily_read.content,
        image_prompt: JSON.stringify(imagePromptJSON),
        image_url: null,
        image_generated: false
      },
      update: {
        pillar: contentJSON.daily_read.metadata.pillar,
        topic: contentJSON.daily_read.metadata.topic,
        hook_line: contentJSON.daily_read.lock_screen.hook_line,
        content: contentJSON.daily_read.content,
        notification_text: notificationText,
        generation_attempts: { increment: 1 }
      }
    });

    // Update last 3 topics in growth profile
    const growthProfile = user.growth_profile || {};
    const last3 = [
      contentJSON.daily_read.metadata.topic,
      ...(growthProfile.last_3_insight_topics || []).slice(0, 2)
    ];
    await prisma.user.update({
      where: { id: userId },
      data: {
        growth_profile: {
          ...growthProfile,
          last_3_insight_topics: last3
        }
      }
    });

    // Generate image async (don't block)
    const contentId = savedContent.id;
    imageService.generateAndUpload(imagePromptJSON, userId, today)
      .then(async (url) => {
        if (url) {
          await prisma.dailyContent.update({
            where: { id: contentId },
            data: { image_url: url, image_generated: true }
          });
          logger.info(`Image uploaded for content ${contentId}`);
        }
      })
      .catch(err => logger.error('Async image generation failed:', err.message));

    // Cache in Redis
    await redis.setex(`content:${userId}:${today}`, 86400, savedContent);

    // Clear generating flag
    await redis.del(`generating:${userId}:${today}`);

    logger.info(`Content generated successfully for user ${userId}`);
    return savedContent;

  } catch (error) {
    logger.error(`Content generation failed for user ${userId}:`, error.message);
    await redis.del(`generating:${userId}:${today}`);
    return await serveBackupContent(userId, today);
  }
}

// ─────────────────────────────────────────
// BUILD USER INTELLIGENCE OBJECT
// ─────────────────────────────────────────

function buildUserIntelligence(user) {
  const growthProfile = user.growth_profile || {};

  return {
    user_intelligence: {
      identity: {
        user_id: user.id,
        name: user.name,
        profession_primary: user.profession_primary,
        profession_sub: user.profession_sub,
        experience_years: user.experience_years,
        experience_label: user.experience_label,
        primary_goal: user.primary_goal,
        background_note: user.background_note || ''
      },
      behavioral: {
        total_reads_completed: user.total_reads,
        last_active: user.last_active.toISOString(),
        days_since_last_open: Math.floor(
          (Date.now() - new Date(user.last_active).getTime()) / 86400000
        )
      },
      growth_profile: {
        blindspots_detected: growthProfile.blindspots_detected || [],
        strengths_observed: growthProfile.strengths_observed || [],
        current_growth_thread: growthProfile.current_growth_thread || null,
        narrative_continuity_active: growthProfile.narrative_continuity_active || false,
        last_3_insight_topics: growthProfile.last_3_insight_topics || [],
        resonance_patterns: growthProfile.resonance_patterns || []
      },
      notification_profile: {
        preferred_style: growthProfile.notification_preferred_style || 'curiosity',
        best_open_time: user.notification_preferred_time
      }
    }
  };
}

// ─────────────────────────────────────────
// BACKUP CONTENT — served when AI fails
// ─────────────────────────────────────────

async function serveBackupContent(userId, date) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const recentTopics = await prisma.dailyContent.findMany({
      where: { user_id: userId },
      orderBy: { content_date: 'desc' },
      take: 10,
      select: { topic: true }
    });

    const recentTopicList = recentTopics.map(c => c.topic);

    let backup = await prisma.backupContent.findFirst({
      where: {
        profession_primary: user.profession_primary,
        is_active: true,
        topic: { notIn: recentTopicList }
      },
      orderBy: { times_served: 'asc' }
    });

    if (!backup) {
      logger.warn(`No specific backup content found for profession '${user.profession_primary}'. Falling back to general backup content.`);
      backup = await prisma.backupContent.findFirst({
        where: {
          is_active: true,
          topic: { notIn: recentTopicList }
        },
        orderBy: { times_served: 'asc' }
      });
    }

    if (!backup) {
      throw new Error('No backup content available at all');
    }

    const saved = await prisma.dailyContent.create({
      data: {
        user_id: userId,
        content_date: date,
        pillar: backup.pillar,
        topic: backup.topic,
        estimated_read_minutes: 2,
        hook_line: backup.hook_line,
        sub_line: '',
        notification_text: 'Your insight for today is ready.',
        notification_style: 'curiosity',
        content: backup.content,
        image_url: backup.image_url,
        image_generated: !!backup.image_url,
        used_backup: true
      }
    });

    await prisma.backupContent.update({
      where: { id: backup.id },
      data: { times_served: { increment: 1 }, last_served_at: new Date() }
    });

    logger.info(`Backup content served for user ${userId}`);
    return saved;

  } catch (error) {
    logger.error(`Backup content failed for user ${userId}:`, error.message);
    throw error;
  }
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

module.exports = {
  generateForUser,
  buildUserIntelligence,
  getTodayDate
};
