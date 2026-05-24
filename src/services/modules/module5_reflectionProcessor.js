// src/services/modules/module5_reflectionProcessor.js

const { analyticsModel, callGemini } = require('../../utils/geminiClient');
const prisma = require('../../config/database');
const logger = require('../../utils/logger');

const MODULE5_SYSTEM_PROMPT = `You process user reflection signals for the Pulse app to update their growth profile.

A reflection signal is a simple yes/no tap from the user after reading their daily insight:
  "yes" = this resonated with me today
  "no"  = this didn't connect today

YOUR JOB:
Analyze the signal in context of the user's history and update their growth profile intelligently.

PROCESSING RULES:
yes signal = insight resonated
  → Add topic to resonance_patterns if not already there
  → Consider for growth thread if 3+ consecutive yes signals
  → Note the pillar as engaging

no signal = didn't connect
  → Note topic as low resonance
  → Consider pillar adjustment in future content
  → Not a failure — just signal

After 3 consecutive yes signals on related topics:
  → Set narrative_continuity_active = true
  → Set current_growth_thread to the connecting theme

After 7+ reads total:
  → Begin blindspot detection
  → Identify pillars consistently avoided or low-resonance

TONE OF ANALYSIS:
All updates should be constructive. No signals are negative — they are all learning.
Do not label user negatively in any field.

OUTPUT RULES:
Return only valid JSON. No preamble. No markdown fences.
Only update fields that actually change based on the signal.`;

function buildModule5Prompt(signal, topic, pillar, growthProfile, recentReflections) {
  return `${MODULE5_SYSTEM_PROMPT}

REFLECTION SIGNAL:
  Response: ${signal} (yes = resonated, no = didn't connect)
  Insight topic: ${topic}
  Insight pillar: ${pillar}

CURRENT GROWTH PROFILE:
${JSON.stringify(growthProfile, null, 2)}

RECENT REFLECTION HISTORY (last 10):
${JSON.stringify(recentReflections, null, 2)}

Based on this signal and history, return the updated growth profile.
Only include fields that should change.
Keep arrays concise — maximum 10 items each.

Return only this JSON structure:

{
  "profile_update": {
    "resonance_patterns": ["updated array — topics that consistently resonate"],
    "blindspots_detected": ["updated array — topics consistently avoided or low-resonance"],
    "current_growth_thread": "string describing active theme OR null if none",
    "narrative_continuity_active": true,
    "notification_preferred_style": "curiosity | trend | identity | reflection | problem",
    "insight": "One sentence: what this signal reveals about the user's growth needs"
  }
}`;
}

async function processReflection(userId, contentId, signal) {
  try {
    const content = await prisma.dailyContent.findUnique({
      where: { id: contentId },
      select: { topic: true, pillar: true }
    });

    if (!content) throw new Error(`Content ${contentId} not found`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { growth_profile: true }
    });

    const recentReflections = await prisma.reflection.findMany({
      where: { user_id: userId },
      orderBy: { responded_at: 'desc' },
      take: 10,
      include: {
        content: { select: { topic: true, pillar: true } }
      }
    });

    const formattedReflections = recentReflections.map(r => ({
      topic: r.content.topic,
      pillar: r.content.pillar,
      response: r.response,
      date: r.responded_at
    }));

    const growthProfile = user.growth_profile || {};

    const prompt = buildModule5Prompt(
      signal,
      content.topic,
      content.pillar,
      growthProfile,
      formattedReflections
    );

    const result = await callGemini(analyticsModel, prompt, 'Module5');

    // Merge updated fields into existing growth profile
    const updatedProfile = {
      ...growthProfile,
      ...result.profile_update
    };

    // Remove the insight field (internal note, don't store permanently)
    delete updatedProfile.insight;

    // Update user's growth profile
    await prisma.user.update({
      where: { id: userId },
      data: { growth_profile: updatedProfile }
    });

    logger.info(`Growth profile updated for user ${userId}`);
    return updatedProfile;

  } catch (error) {
    logger.error(`Module 5 failed for user ${userId}:`, error.message);
    // Non-critical — don't throw, just log
    return null;
  }
}

module.exports = { processReflection };
