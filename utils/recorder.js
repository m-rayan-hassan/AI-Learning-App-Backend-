import { connect } from 'puppeteer-real-browser';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const recordPresentation = async (presentationUrl, audioData, docId) => {
  console.log(`🎥 Starting Recorder for: ${presentationUrl}`);

  let browser = null;

  try {
    // puppeteer-real-browser with headless: false + Xvfb = "effectively headless"
    // Chrome runs in headed mode on a VIRTUAL display (no physical monitor needed).
    // This is the ONLY reliable way to bypass Cloudflare Turnstile — true headless 
    // Chrome (headless: true or 'new') is always detected, regardless of stealth plugins.
    const response = await connect({
      headless: false,
      turnstile: true,
      disableXvfb: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
        '--hide-scrollbars',
        '--use-gl=swiftshader',
        '--enable-webgl',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-infobars',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    browser = response.browser;
    const page = response.page;

    // Force viewport to exactly 1920x1080 with 1x scale factor
    // This prevents the "zoomed-in" issue caused by high-DPI default scaling
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Override any CSS that might come from device pixel detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, 'devicePixelRatio', {
        get: () => 1,
      });
    });

    // Tell the browser to NOT reduce motion — needed for Gamma animations
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' }
    ]);

    // Navigate to the Gamma presentation
    console.log('🌐 Navigating to presentation...');
    await page.goto(presentationUrl, { waitUntil: 'networkidle2', timeout: 90000 });

    // Wait for Turnstile to be solved (puppeteer-real-browser handles this automatically)
    console.log('⏳ Waiting for Cloudflare verification to complete...');

    try {
      await page.waitForFunction(() => {
        const turnstileFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
        const turnstileContainer = document.querySelector('#challenge-running, #challenge-stage');
        return !turnstileFrame && !turnstileContainer;
      }, { timeout: 60000 });
      console.log('✅ Cloudflare verification passed!');
    } catch (e) {
      console.warn('⚠️ Cloudflare check timed out, proceeding anyway...', e.message);
    }

    // Give the page extra time to fully render after passing Cloudflare
    await new Promise(r => setTimeout(r, 5000));

    // Enter Present Mode
    try {
      await page.click('body');
      await new Promise(r => setTimeout(r, 1000));

      // Ctrl+Shift+Enter to enter presentation mode
      await page.keyboard.down('Control');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await page.keyboard.up('Control');

      // Wait for the fullscreen transition to settle
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.warn("⚠️ Mode switch warning:", e);
    }

    // Setup Recorder - Use 60 FPS for smooth motion
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 60,
      ffmpeg_Path: '/usr/bin/ffmpeg',
      videoFrame: { width: 1920, height: 1080 },
      videoCrf: 18,
      aspectRatio: '16:9',
    });

    // Use docId + timestamp + random UUID for concurrency-safe unique filenames
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const tempDir = path.join(process.cwd(), "temp_video", docId.toString());
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const outputVideoPath = path.join(tempDir, `silent_${docId}_${Date.now()}_${uniqueId}.mp4`);

    await recorder.start(outputVideoPath);
    console.log("🔴 Recording Started (60 FPS)...");

    // --- ANIMATION SYNC LOOP ---
    for (let i = 0; i < audioData.length; i++) {
      const slideAudio = audioData[i];
      console.log(`👉 Slide ${i + 1}: ${slideAudio.duration}s`);

      // 1. Wait for Voiceover
      await new Promise(r => setTimeout(r, slideAudio.duration * 1000));

      // 2. Wait for Breath (matches Stitcher silence)
      await new Promise(r => setTimeout(r, 500));

      // 3. Trigger Transition
      if (i < audioData.length - 1) {
        console.log("   ➡️ Animate Next Slide");
        await page.keyboard.press('ArrowRight');

        // 4. CAPTURE THE ANIMATION
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // End Buffer
    await new Promise(r => setTimeout(r, 2000));

    await recorder.stop();
    console.log("✅ Recording complete:", outputVideoPath);

    return outputVideoPath;
  } finally {
    // Always close browser to free memory — critical for production
    if (browser) {
      try {
        await browser.close();
        console.log("🧹 Browser closed, memory freed.");
      } catch (closeErr) {
        console.error("Failed to close browser:", closeErr);
      }
    }
  }
};