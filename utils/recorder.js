import { connect } from 'puppeteer-real-browser';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import fs from 'fs';

export const recordPresentation = async (presentationUrl, audioData) => {
  console.log(`🎥 Starting Cinematic Recorder for: ${presentationUrl}`);
  
  // Use puppeteer-real-browser to bypass Cloudflare Turnstile
  const { browser, page } = await connect({
    headless: false,        // Required for best anti-detection
    turnstile: true,        // Auto-solve Cloudflare Turnstile challenges
    disableXvfb: false,     // Use Xvfb for virtual display on Linux
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-fullscreen',
      '--window-size=1920,1080',
      '--enable-gpu',
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--hide-scrollbars',
      '--disable-dev-shm-usage',
    ],
  });

  // Set viewport to 1920x1080 for consistent recording
  await page.setViewport({ width: 1920, height: 1080 });

  // Tell the browser to NOT reduce motion — needed for Gamma animations
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' }
  ]);

  // Navigate to the Gamma presentation
  console.log('🌐 Navigating to presentation...');
  await page.goto(presentationUrl, { waitUntil: 'networkidle2', timeout: 90000 });

  // Wait for Turnstile to be solved (puppeteer-real-browser handles this automatically)
  // Then wait for the actual presentation content to load
  console.log('⏳ Waiting for Cloudflare verification to complete...');
  
  // Wait until the Turnstile challenge is gone and real content appears
  // Gamma pages have a specific structure — wait for either the document body
  // or cards to appear, indicating we're past Cloudflare
  try {
    await page.waitForFunction(() => {
      // Check that Cloudflare challenge iframe is gone
      const turnstileFrame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
      const turnstileContainer = document.querySelector('#challenge-running, #challenge-stage');
      // If neither turnstile element exists, we're past the challenge
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

  const tempDir = path.join(process.cwd(), 'temp_video');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const outputVideoPath = path.join(tempDir, `silent_${Date.now()}.mp4`);
  
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
      // Gamma animations take about 1.0 - 1.2 seconds.
      await new Promise(r => setTimeout(r, 1500)); 
    }
  }

  // End Buffer
  await new Promise(r => setTimeout(r, 2000)); 
  
  await recorder.stop();
  await browser.close();
  
  return outputVideoPath;
};