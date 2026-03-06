/**
 * Recording Queue — Limits concurrent Puppeteer recordings to prevent memory exhaustion.
 * 
 * Each Chromium instance uses ~200-500MB RAM. Without a queue, 5 concurrent users
 * would use 1-2.5GB just for browsers, potentially crashing the server.
 * 
 * Usage:
 *   import { enqueueRecording } from './recordingQueue.js';
 *   const videoPath = await enqueueRecording(url, audioData, docId);
 */

import { recordPresentation } from './recorder.js';

// Maximum number of recordings that can run simultaneously
// Adjust based on server RAM: ~500MB per recording
// 1GB server → MAX_CONCURRENT = 1
// 2GB server → MAX_CONCURRENT = 2
// 4GB server → MAX_CONCURRENT = 3
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_RECORDINGS) || 1;

let activeCount = 0;
const queue = [];

/**
 * Enqueue a recording job. If under the concurrency limit, it starts immediately.
 * Otherwise it waits in a FIFO queue until a slot opens up.
 * 
 * @param {string} presentationUrl  - The Gamma presentation URL
 * @param {Array}  audioData        - Array of { index, duration, filePath } per slide
 * @param {string} docId            - Document ID for unique file paths
 * @returns {Promise<string>}       - Path to the recorded video file
 */
export const enqueueRecording = (presentationUrl, audioData, docId) => {
  return new Promise((resolve, reject) => {
    const job = { presentationUrl, audioData, docId, resolve, reject };

    if (activeCount < MAX_CONCURRENT) {
      runJob(job);
    } else {
      console.log(`📋 Recording queued (position ${queue.length + 1}). Active: ${activeCount}/${MAX_CONCURRENT}`);
      queue.push(job);
    }
  });
};

/**
 * Execute a recording job and process the next queued job when done.
 */
async function runJob(job) {
  activeCount++;
  console.log(`🎬 Starting recording job. Active: ${activeCount}/${MAX_CONCURRENT}, Queued: ${queue.length}`);

  try {
    const result = await recordPresentation(job.presentationUrl, job.audioData, job.docId);
    job.resolve(result);
  } catch (error) {
    job.reject(error);
  } finally {
    activeCount--;
    console.log(`✅ Recording slot freed. Active: ${activeCount}/${MAX_CONCURRENT}, Queued: ${queue.length}`);

    // Process next job in the queue
    if (queue.length > 0) {
      const nextJob = queue.shift();
      runJob(nextJob);
    }
  }
}
