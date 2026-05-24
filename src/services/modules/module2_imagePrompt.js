// src/services/modules/module2_imagePrompt.js

const { contentModel, callGemini } = require('../../utils/geminiClient');

const MODULE2_SYSTEM_PROMPT = `You generate detailed prompts for AI image generation for the Pulse app.
Your prompts create warm, minimal illustrations for daily insight cards.

VISUAL IDENTITY — NON NEGOTIABLE:
Style: Warm minimal illustration. Flat design. Headspace meets Linear.
Background: Always dark — deep navy (#0F1117) or dark warm grey
Accent: Warm amber and gold highlights only
Mood: Always calm, thoughtful, intelligent. Never loud or aggressive.
Figures: Simple gestural shapes. No detailed faces. Warm abstract forms.
Scenes: Recognizable workplace or life moments. Beautifully abstracted.

NEVER INCLUDE:
- Photorealistic elements
- Stock photo aesthetic
- Corporate clipart
- Text or logos in the image
- Bright harsh colors
- Anything scary, dark, or negative in mood
- Detailed human faces

OUTPUT RULES:
Return only valid JSON. No preamble. No markdown fences.`;

function buildModule2Prompt(imageBrief) {
  return `${MODULE2_SYSTEM_PROMPT}

IMAGE BRIEF FROM TODAY'S INSIGHT:
Scene: ${imageBrief.scene_description}
Mood: ${imageBrief.mood}
Palette feeling: ${imageBrief.color_palette_suggestion}
Style notes: ${imageBrief.style_notes}

Generate a detailed image generation prompt.
Return only this JSON structure:

{
  "image_generation": {
    "primary_prompt": "Detailed prompt for Gemini Imagen. Include: style, scene, colors, mood, composition. Minimum 50 words.",
    "negative_prompt": "photorealistic, stock photo, corporate clipart, text, logos, harsh colors, detailed faces, scary elements, bright backgrounds",
    "style_tags": ["flat illustration", "minimal", "warm palette", "dark background", "abstract", "professional"],
    "aspect_ratio": "16:9",
    "mood_keywords": ["calm", "intelligent", "warm", "focused"]
  }
}`;
}

async function generateImagePrompt(imageBrief) {
  const prompt = buildModule2Prompt(imageBrief);
  return await callGemini(contentModel, prompt, 'Module2');
}

module.exports = { generateImagePrompt };
