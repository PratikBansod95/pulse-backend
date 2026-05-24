// src/services/modules/module3_notificationGenerator.js

const { contentModel, callGemini } = require('../../utils/geminiClient');

const MODULE3_SYSTEM_PROMPT = `You generate high-signal professional notifications for the Pulse app.
These notifications appear on a user's phone and must earn their tap.

NOTIFICATION PHILOSOPHY:
These must feel like a relevant tip from a smart colleague — not a reminder from an app.
The user should feel: "this is relevant to me right now"
NOT: "another app notification"

TONE RULES — NON NEGOTIABLE:
Never: guilt, urgency, streak mechanics, generic motivation
Always: specific, role-relevant, curiosity-triggering
The user should feel pulled in, not pushed

NOTIFICATION STYLES:
curiosity:    Poses an intriguing incomplete thought
trend:        Signals something shifting in their professional world
identity:     Speaks to who they are or want to become
reflection:   References something they likely experienced recently
problem:      Names a pain point they definitely recognize

HARD LIMITS:
- Maximum 20 words per notification
- Must reference user's specific role or goal
- Never mention the app name ("Open Pulse to...")
- Never use exclamation marks
- Never use emojis

OUTPUT RULES:
Return only valid JSON. No preamble. No markdown fences.`;

function buildModule3Prompt(dailyContent, userIntelligence) {
  const ui = userIntelligence.user_intelligence;
  const content = dailyContent.daily_read;

  return `${MODULE3_SYSTEM_PROMPT}

USER CONTEXT:
  Role: ${ui.identity.profession_sub}
  Goal: ${ui.identity.primary_goal}
  Experience: ${ui.identity.experience_label}
  Preferred style: ${ui.notification_profile?.preferred_style || 'curiosity'}

TODAY'S INSIGHT CONTEXT:
  Topic: ${content.metadata.topic}
  Pillar: ${content.metadata.pillar}
  Hook line: ${content.lock_screen.hook_line}
  Insight headline: ${content.content.insight.headline}

Generate 5 notification variants — one per style.
Return only this JSON structure:

{
  "notifications": {
    "morning_variants": {
      "curiosity": "Maximum 20 words. Curiosity style.",
      "trend": "Maximum 20 words. Trend style.",
      "identity": "Maximum 20 words. Identity style.",
      "reflection": "Maximum 20 words. Reflection style.",
      "problem": "Maximum 20 words. Problem style."
    },
    "recommended_style": "curiosity | trend | identity | reflection | problem",
    "recommended_text": "The text of the recommended variant",
    "ab_test_pair": {
      "variant_a": "First option for A/B test",
      "variant_b": "Second option for A/B test"
    }
  }
}`;
}

async function generateNotifications(dailyContent, userIntelligence) {
  const prompt = buildModule3Prompt(dailyContent, userIntelligence);
  return await callGemini(contentModel, prompt, 'Module3');
}

module.exports = { generateNotifications };
