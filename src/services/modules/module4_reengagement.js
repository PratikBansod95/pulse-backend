// src/services/modules/module4_reengagement.js

const { contentModel, callGemini } = require('../../utils/geminiClient');

const MODULE4_SYSTEM_PROMPT = `You generate re-engagement messages for Pulse users who haven't opened the app in 5+ days.

CRITICAL RULES — NEVER VIOLATE:
NEVER mention days missed
NEVER use guilt, shame, or streak language
NEVER say "we miss you" or "come back"
NEVER say "you haven't opened in X days"
NEVER say "don't fall behind"
NEVER use urgency or anxiety
NEVER use these words: miss, missed, back, return, streak, days, forgot, behind, lost

ALWAYS make it about something relevant in their professional world
ALWAYS make them feel: "this matters to me" not "I failed at a habit"
The message should create genuine curiosity about their insight
Not guilt about missing previous ones

The user should feel pulled back by relevance, not pushed back by obligation.

OUTPUT RULES:
Return only valid JSON. No preamble. No markdown fences.
Maximum 25 words for push notification.`;

function buildModule4Prompt(user, daysInactive) {
  return `${MODULE4_SYSTEM_PROMPT}

USER CONTEXT:
  Role: ${user.profession_sub}
  Primary goal: ${user.primary_goal}
  Experience: ${user.experience_label}
  Background: ${user.background_note || 'Not provided'}

Generate a re-engagement message that makes this specific ${user.profession_sub} feel like something genuinely relevant is waiting for them today.
Reference their role and goal naturally.
Do not mention the app. Do not mention they were away.
Just make today's insight feel unmissable for someone like them.

Return only this JSON structure:

{
  "reengagement": {
    "push_notification": "Maximum 25 words. Pure relevance. Zero guilt. Role-specific.",
    "in_app_banner": {
      "headline": "Maximum 8 words",
      "subline": "Maximum 12 words"
    },
    "rationale": "One sentence: why this angle was chosen for this user"
  }
}`;
}

async function generateReengagement(user, daysInactive) {
  const prompt = buildModule4Prompt(user, daysInactive);
  return await callGemini(contentModel, prompt, 'Module4');
}

module.exports = { generateReengagement };
