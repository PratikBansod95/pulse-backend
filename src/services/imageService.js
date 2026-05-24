// src/services/imageService.js
// Image generation pipeline using Gemini Imagen + Firebase Storage

const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('../config/firebase');
const sharp = require('sharp');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─────────────────────────────────────────
// GENERATE IMAGE WITH GEMINI IMAGEN
// ─────────────────────────────────────────

async function generateWithGemini(imagePromptJSON) {
  try {
    const imageModel = genAI.getGenerativeModel({
      model: process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001'
    });

    const primaryPrompt = imagePromptJSON?.image_generation?.primary_prompt ||
      'Warm minimal illustration, dark background, amber accent colors, professional workplace scene, flat design, Headspace aesthetic';

    const result = await imageModel.generateImages({
      prompt: primaryPrompt,
      number_of_images: 1,
      aspect_ratio: '16:9',
      safety_filter_level: 'BLOCK_LOW_AND_ABOVE'
    });

    if (result.generatedImages && result.generatedImages.length > 0) {
      const imageData = result.generatedImages[0].image.imageBytes;
      return Buffer.from(imageData, 'base64');
    }

    return null;
  } catch (error) {
    logger.warn('Gemini Imagen generation failed, using fallback:', error.message);
    return null;
  }
}

// ─────────────────────────────────────────
// PROCESS IMAGE — resize and optimize
// ─────────────────────────────────────────

async function processImage(imageBuffer, width = 1200, height = 675) {
  return await sharp(imageBuffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

async function generateThumbnail(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(120, 120, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// ─────────────────────────────────────────
// GENERATE FALLBACK GRADIENT IMAGE
// per pillar — used when Imagen fails
// ─────────────────────────────────────────

const PILLAR_GRADIENTS = {
  workplace_intelligence: { from: '#0F1117', to: '#1A2A3A', accent: '#7B9EC7' },
  execution_productivity: { from: '#0F1117', to: '#1A2A1F', accent: '#8DB87B' },
  industry_signals:       { from: '#0F1117', to: '#2A2010', accent: '#C4A97B' },
  career_growth:          { from: '#0F1117', to: '#1F1028', accent: '#B07BC4' },
  mental_clarity:         { from: '#0F1117', to: '#102828', accent: '#7BC4B8' },
  role_masterclass:       { from: '#0F1117', to: '#281018', accent: '#C47B8D' }
};

async function generateFallbackImage(pillar, width = 1200, height = 675) {
  const gradient = PILLAR_GRADIENTS[pillar] || PILLAR_GRADIENTS['career_growth'];

  // Create SVG gradient image
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradient.from}"/>
        <stop offset="100%" style="stop-color:${gradient.to}"/>
      </linearGradient>
      <linearGradient id="glow" x1="50%" y1="50%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${gradient.accent};stop-opacity:0.15"/>
        <stop offset="100%" style="stop-color:${gradient.accent};stop-opacity:0"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <circle cx="${width * 0.75}" cy="${height * 0.3}" r="${height * 0.4}"
      fill="${gradient.accent}" opacity="0.06"/>
    <circle cx="${width * 0.2}" cy="${height * 0.7}" r="${height * 0.25}"
      fill="${gradient.accent}" opacity="0.04"/>
  </svg>`;

  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 85 })
    .toBuffer();
}

// ─────────────────────────────────────────
// UPLOAD TO FIREBASE STORAGE
// ─────────────────────────────────────────

async function uploadToStorage(imageBuffer, userId, date, type = 'card') {
  try {
    const bucket = admin.storage().bucket();
    const fileName = `insights/${userId}/${date}/${type}.jpg`;
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      },
      public: true
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    logger.info(`Image uploaded: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    logger.error('Firebase Storage upload failed:', error.message);
    return null;
  }
}

// ─────────────────────────────────────────
// MAIN — Generate and Upload
// ─────────────────────────────────────────

async function generateAndUpload(imagePromptJSON, userId, date, pillar = 'career_growth') {
  try {
    // Try Gemini Imagen first
    let imageBuffer = await generateWithGemini(imagePromptJSON);

    // Fall back to gradient if generation failed
    if (!imageBuffer) {
      logger.info(`Using fallback gradient for pillar: ${pillar}`);
      imageBuffer = await generateFallbackImage(pillar);
    }

    // Process to correct dimensions
    const processedBuffer = await processImage(imageBuffer);

    // Upload to Firebase Storage
    const url = await uploadToStorage(processedBuffer, userId, date, 'card');

    // Also generate and upload thumbnail
    if (url) {
      const thumbnail = await generateThumbnail(processedBuffer);
      await uploadToStorage(thumbnail, userId, date, 'thumb');
    }

    return url;

  } catch (error) {
    logger.error('generateAndUpload failed:', error.message);
    return null;
  }
}

module.exports = {
  generateAndUpload,
  generateFallbackImage,
  generateWithGemini,
  processImage,
  generateThumbnail,
  uploadToStorage
};
