#!/usr/bin/env node

// One-time script to generate marketing page images via Gemini API
// Usage: GEMINI_API_KEY=your-key node scripts/generate-images.js
//
// Generates 4 images and saves them to assets/images/

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: Set GEMINI_API_KEY environment variable');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;

const IMAGES = [
  {
    filename: 'hero-bg.webp',
    prompt: 'Create a subtle dark abstract background image with topographic map-style flowing lines. Deep navy blue color palette (#0F172A base) with slight cyan and indigo glow effects. Professional tech feel, minimal, elegant. No text, no logos. 16:9 aspect ratio. Suitable as a website hero background with text overlay.',
  },
  {
    filename: 'problem-section.webp',
    prompt: 'Photograph of a Latin American woman in her 30s standing outside a small local storefront (like a bakery or salon), looking frustrated at her smartphone screen. Warm natural lighting, daytime. The storefront is modest but clean. She looks confused or disappointed, as if she cannot find something online. Realistic, candid style. 4:3 aspect ratio.',
  },
  {
    filename: 'case-study.webp',
    prompt: 'Photograph of a happy Latina woman in her late 20s, nail salon owner, smiling warmly while looking at a tablet that shows an appointment booking interface. She is inside a bright, modern nail salon with clean white and pink decor. Natural light, professional but warm atmosphere. Realistic, authentic, positive. 4:3 aspect ratio.',
  },
  {
    filename: 'cta-bg.webp',
    prompt: 'Aerial nighttime photograph of a Latin American city (like Bogota or Mexico City) with glowing city lights stretching to the horizon. Dark moody atmosphere, cinematic color grading with warm amber city lights against deep blue-black sky. No text. 16:9 aspect ratio. Suitable as a website background with text overlay.',
  },
];

async function generateImage(imageConfig) {
  console.log(`Generating: ${imageConfig.filename}...`);

  const body = {
    contents: [
      {
        parts: [
          { text: imageConfig.prompt }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      const outputPath = path.join(OUTPUT_DIR, imageConfig.filename);
      fs.writeFileSync(outputPath, buffer);
      console.log(`  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return;
    }
  }

  console.warn(`  Warning: No image data returned for ${imageConfig.filename}`);
  console.warn('  Response parts:', parts.map(p => p.text || '[image]').join(', '));
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Generating marketing images via Gemini API...\n');

  for (const img of IMAGES) {
    try {
      await generateImage(img);
    } catch (err) {
      console.error(`  Error generating ${img.filename}:`, err.message);
    }
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\nDone! Check assets/images/ for generated files.');
}

main();
