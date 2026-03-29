/**
 * Remotion Video Renderer
 * 
 * Replaces recorder.js + recordingQueue.js for the new pipeline.
 * Bundles the Remotion project and renders React slides directly to MP4.
 * 
 * No Chromium window, no Cloudflare, no Gamma — fully self-contained.
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FPS = 30;
const GAP_SECONDS = 2; // Silence gap between slides (matches stitcher.js)

// Cache the bundle location so we don't re-bundle on every render
let cachedBundleLocation = null;

/**
 * Bundle the Remotion project. Cached after first call for performance.
 */
const getBundle = async () => {
  if (cachedBundleLocation) {
    // Verify cache is still valid (directory exists)
    try {
      await fs.promises.access(cachedBundleLocation);
      return cachedBundleLocation;
    } catch {
      cachedBundleLocation = null;
    }
  }

  console.log('📦 Bundling Remotion project (first time — subsequent renders will use cache)...');
  const entryPoint = path.join(__dirname, '..', 'remotion', 'index.tsx');

  cachedBundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log('✅ Remotion bundle ready.');
  return cachedBundleLocation;
};

/**
 * Render a video from slide data + audio durations.
 * 
 * @param {Array} slides       - Array of slide objects from LLM (layout, title, bullets, etc.)
 * @param {Array} audioDurations - Array of { index, duration, filePath } from ElevenLabs
 * @param {string} docId       - Document ID for unique file paths
 * @param {string} themeName   - Theme palette name (e.g. 'tech', 'science', 'default')
 * @returns {string}           - Path to the rendered silent MP4 file
 */
export const renderVideoRemotion = async (slides, audioDurations, docId, themeName = 'default') => {
  console.log(`🎬 Remotion: Starting render for ${slides.length} slides (doc: ${docId}, theme: ${themeName})`);

  // 1. Get (or create) the bundle
  const bundleLocation = await getBundle();

  // 2. Calculate total duration from audio
  const totalDurationSec = audioDurations.reduce(
    (sum, ad) => sum + ad.duration + GAP_SECONDS,
    0
  );
  const totalFrames = Math.ceil(totalDurationSec * FPS);

  console.log(`⏱️  Total duration: ${totalDurationSec.toFixed(1)}s (${totalFrames} frames at ${FPS}fps)`);

  // 3. Select the composition
  const inputProps = {
    slides,
    audioDurations: audioDurations.map((ad) => ({
      index: ad.index,
      duration: ad.duration,
    })),
    theme: themeName,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'CourseVideo',
    inputProps,
  });

  // 4. Prepare output path
  const tempDir = path.join(process.cwd(), 'temp_video', docId.toString());
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const outputPath = path.join(tempDir, `silent_${docId}_${Date.now()}.mp4`);

  // 5. Render!
  console.log('🔴 Remotion: Rendering video...');
  const startTime = Date.now();

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
      fps: FPS,
      width: 1280,
      height: 720,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    // Performance tuning
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
      gl: 'angle', // Hardware acceleration fallback
    },
    // Quality settings (match current pipeline: 720p, CRF 28)
    crf: 28,
    pixelFormat: 'yuv420p',
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Remotion: Render complete in ${elapsed}s → ${outputPath}`);

  return outputPath;
};
