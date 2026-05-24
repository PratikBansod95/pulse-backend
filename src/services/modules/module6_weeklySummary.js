// src/services/modules/module6_weeklySummary.js

const { contentModel, callGemini } = require('../../utils/geminiClient');
const prisma = require('../../config/database');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');

const MODULE6_SYSTEM_PROMPT = `You generate a weekly growth summary for Pulse users.

TONE: Warm, honest, forward-looking. Like a mentor reflecting with you, not a dashboard reporting at you.

RULES:
- No scores, no ratings, no gamification language
- Acknowledge what they engaged with genuinely
- Surface one pattern you noticed (positive framing always)
- Give one thought for the week ahead
- Keep it short — 4-6 sentences total
- Never mention streaks, consecutive reads, or numbers of days
- Write like a thoughtful colleague, not a data report

OUTPUT RULES:
Return only valid JSON. No preamble. No markdown fences.`;

function buildModule6Prompt(user, weekData) {
  return `${MODULE6_SYSTEM_PROMPT}

USER CONTEXT:
  Name: ${user.name}
  Role: ${user.profession_sub}
  Goal: ${user.primary_goal}
  Experience: ${user.experience_label}

THIS WEEK'S ENGAGEMENT:
  Reads completed this week: ${weekData.readsThisWeek}
  Topics engaged with: ${weekData.topicsEngaged.join(', ') || 'none'}
  Pillars explored: ${weekData.pillarsEngaged.join(', ') || 'none'}
  Reflection signals (yes/no taps): ${weekData.reflectionCount}
  Topics that resonated (yes): ${weekData.resonatedTopics.join(', ') || 'none'}

GROWTH PROFILE CONTEXT:
  Resonance patterns: ${(user.growth_profile?.resonance_patterns || []).join(', ') || 'none yet'}
  Current growth thread: ${user.growth_profile?.current_growth_thread || 'none'}

Generate a warm, mentor-like weekly summary.
Return only this JSON structure:

{
  "weekly_summary": {
    "reads_this_week": ${weekData.readsThisWeek},
    "reflection_line": "Warm acknowledgment of what they engaged with this week (1-2 sentences)",
    "pattern_observed": "One positive pattern you noticed in their engagement (1 sentence)",
    "forward_thought": "One thought to carry into next week (1 sentence)",
    "next_week_preview": "Teaser for an upcoming insight direction — creates anticipation (1 sentence)"
  }
}`;
}

async function generateWeeklySummary(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new Error(`User ${userId} not found`);

    // Get this week's data
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const weekContent = await prisma.dailyContent.findMany({
      where: {
        user_id: userId,
        created_at: { gte: weekStart }
      },
      include: {
        content_read: true,
        reflections: true
      }
    });

    const reads = weekContent.filter(c => c.content_read);
    const reflections = weekContent.flatMap(c => c.reflections);
    const resonatedTopics = weekContent
      .filter(c => c.reflections.some(r => r.response === 'yes'))
      .map(c => c.topic);

    const weekData = {
      readsThisWeek: reads.length,
      topicsEngaged: reads.map(c => c.topic),
      pillarsEngaged: [...new Set(reads.map(c => c.pillar))],
      reflectionCount: reflections.length,
      resonatedTopics
    };

    const prompt = buildModule6Prompt(user, weekData);
    const result = await callGemini(contentModel, prompt, 'Module6');

    // Cache for 24 hours
    await redis.setex(`growth_summary:${userId}`, 86400, result.weekly_summary);

    logger.info(`Weekly summary generated for user ${userId}`);
    return result.weekly_summary;

  } catch (error) {
    logger.error(`Module 6 failed for user ${userId}:`, error.message);
    throw error;
  }
}

module.exports = { generateWeeklySummary };
