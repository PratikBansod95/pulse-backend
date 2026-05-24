// src/utils/geminiClient.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Content generation model (creative)
const contentModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.85,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json'
  }
});

// Analytics model (analytical — lower temperature)
const analyticsModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.3,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json'
  }
});

// ─────────────────────────────────────────
// SAFE JSON CALL with retry logic
// ─────────────────────────────────────────

async function callGemini(model, prompt, moduleName) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`${moduleName} — attempt ${attempt}`);

      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }]
      });

      const responseText = result.response.text();
      const parsed = safeParseJSON(responseText, moduleName);
      logger.info(`${moduleName} — success`);
      return parsed;

    } catch (error) {
      lastError = error;
      logger.warn(`${moduleName} — attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        await sleep(attempt * 2000); // exponential backoff
      }
    }
  }

  logger.error(`${moduleName} — all ${maxRetries} attempts failed`);
  throw lastError;
}

function safeParseJSON(text, moduleName) {
  // Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // Clean markdown fences
    const cleaned = text
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      // Extract JSON object from text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error(`${moduleName}: Could not parse JSON response: ${text.substring(0, 200)}`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { contentModel, analyticsModel, callGemini };
