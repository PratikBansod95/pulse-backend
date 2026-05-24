// src/services/notificationService.js

const admin = require('../config/firebase');
const prisma = require('../config/database');
const logger = require('../utils/logger');

// ─────────────────────────────────────────
// SEND MORNING NOTIFICATION TO USER
// ─────────────────────────────────────────

async function sendMorningNotification(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.notification_enabled) return;
    if (!user.fcm_tokens || user.fcm_tokens.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const content = await prisma.dailyContent.findUnique({
      where: { user_id_content_date: { user_id: userId, content_date: today } }
    });

    if (!content || content.notification_sent) return;

    await sendFCM(user.fcm_tokens, {
      title: 'Pulse',
      body: content.notification_text,
      data: {
        deep_link: 'pulse://today',
        hook_line: content.hook_line,
        sub_line: content.sub_line || '',
        pillar: content.pillar,
        read_minutes: String(content.estimated_read_minutes),
        content_date: content.content_date,
        notification_type: 'morning_insight'
      }
    }, userId);

    await prisma.dailyContent.update({
      where: { id: content.id },
      data: { notification_sent: true, notification_sent_at: new Date() }
    });

    logger.info(`Morning notification sent to user ${userId}`);

  } catch (error) {
    logger.error(`Failed to send morning notification to ${userId}:`, error.message);
  }
}

// ─────────────────────────────────────────
// SEND CUSTOM NOTIFICATION
// ─────────────────────────────────────────

async function sendCustomNotification(userId, title, body, deepLink, notificationType) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.fcm_tokens || user.fcm_tokens.length === 0) return;

  await sendFCM(user.fcm_tokens, {
    title,
    body,
    data: {
      deep_link: deepLink,
      notification_type: notificationType
    }
  }, userId);
}

// ─────────────────────────────────────────
// SEND FCM — handles token cleanup
// ─────────────────────────────────────────

async function sendFCM(tokens, { title, body, data }, userId) {
  const message = {
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'pulse_daily_insight',
        color: '#F5A623',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      }
    },
    tokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // Remove invalid tokens
  const invalidTokens = [];
  response.responses.forEach((resp, index) => {
    if (!resp.success) {
      const code = resp.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalidTokens.push(tokens[index]);
      }
    }
  });

  if (invalidTokens.length > 0 && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          fcm_tokens: { set: user.fcm_tokens.filter(t => !invalidTokens.includes(t)) }
        }
      });
    }
  }

  return response;
}

module.exports = { sendMorningNotification, sendCustomNotification };
