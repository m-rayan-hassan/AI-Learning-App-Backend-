/**
 * AI Image Generator for Remotion Video Pipeline
 *
 * Uses Gemini Imagen 3 to generate content-specific visuals for each slide.
 * Returns images as base64 data URIs — the most reliable format for
 * Remotion's server-side Chromium rendering (no file serving needed).
 */

import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ITERATIONS = 1;

const IMAGE_MODEL = "gpt-image-1-mini";

const PARALLEL_BATCH_SIZE = 3; // Respect API rate limits

/**
 * Generate a single image from a descriptive prompt.
 * Returns a base64 data URI string, or null on failure.
 *
 * @param {string} prompt - Descriptive image generation prompt
 * @returns {Promise<string|null>} - Data URI (data:image/png;base64,...) or null
 */
const generateSingleImage = async (prompt, size = "1024x1024") => {
  try {
    const response = await openai.images.generate({
      model: IMAGE_MODEL,
      prompt: prompt,
      n: 1,
      size: size, // 1536x1024 for landscape, 1024x1536 for portrait, 1024x1024 for square
    });

    if (response.data && response.data.length > 0) {
      if (response.data[0].b64_json) {
        return `data:image/png;base64,${response.data[0].b64_json}`;
      } else if (response.data[0].url) {
        // Fallback: If it returns a URL, we fetch it and convert to base64 memory buffer
        const imgRes = await fetch(response.data[0].url);
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        return `data:image/png;base64,${base64}`;
      }
    }

    console.warn(
      "⚠️ OpenAI returned no images for prompt:",
      prompt.slice(0, 80),
    );
    return null;
  } catch (error) {
    console.error(
      "❌ Image generation failed:",
      error.message,
      "| Prompt:",
      prompt.slice(0, 80),
    );
    return null;
  }
};

/**
 * Generate images for all slides that have an `imagePrompt` field.
 * Also handles `imagegrid` layout where each sub-image has its own prompt.
 * Processes in parallel batches to balance speed and rate limits.
 *
 * @param {Array} slides - Array of slide objects from LLM output
 * @returns {Promise<Record<number, string>>} - Map of slide index → image data URI
 *   For imagegrid sub-images: key = slideIndex * 100 + subIndex
 */
export const generateSlideImages = async (
  slides,
  orientation = "landscape",
) => {
  // Translate orientation to model's supported size
  // Landscape (16:9): 1536x1024
  // Portrait (9:16): 1024x1536
  const imageSize = orientation === "portrait" ? "1024x1536" : "1536x1024";

  // Collect all image tasks — main slides + imagegrid sub-images
  const imageTasks = [];

  for (const slide of slides) {
    // Main slide image prompt
    if (slide.imagePrompt && slide.imagePrompt.trim()) {
      imageTasks.push({
        key: slide.index,
        prompt: slide.imagePrompt,
      });
    }

    // ImageGrid sub-images
    if (slide.layout === "imagegrid" && Array.isArray(slide.images)) {
      slide.images.forEach((img, subIdx) => {
        if (img.imagePrompt && img.imagePrompt.trim()) {
          imageTasks.push({
            key: slide.index * 100 + subIdx,
            prompt: img.imagePrompt,
          });
        }
      });
    }
  }

  if (imageTasks.length === 0) {
    console.log(
      "📸 No image prompts found in slides — skipping image generation.",
    );
    return {};
  }

  console.log(`📸 Generating ${imageTasks.length} images for video slides...`);
  const startTime = Date.now();

  const imageMap = {};

  // Process in parallel batches
  for (let i = 0; i < imageTasks.length; i += PARALLEL_BATCH_SIZE) {
    const batch = imageTasks.slice(i, i + PARALLEL_BATCH_SIZE);
    const batchNum = Math.floor(i / PARALLEL_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(imageTasks.length / PARALLEL_BATCH_SIZE);

    console.log(
      `📸 Batch ${batchNum}/${totalBatches}: Generating ${batch.length} images...`,
    );

    const results = await Promise.allSettled(
      batch.map((task) => generateSingleImage(task.prompt, imageSize)),
    );

    results.forEach((result, idx) => {
      const task = batch[idx];
      if (result.status === "fulfilled" && result.value) {
        imageMap[task.key] = result.value;
        console.log(`  ✅ Key ${task.key}: Image generated`);
      } else {
        console.warn(
          `  ⚠️ Key ${task.key}: Image generation failed, slide will use fallback visuals`,
        );
      }
    });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = Object.keys(imageMap).length;
  console.log(
    `📸 Image generation complete: ${successCount}/${imageTasks.length} successful in ${elapsed}s`,
  );

  return imageMap;
};
