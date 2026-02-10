import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import path from 'path';
import fs from 'fs';

puppeteer.use(StealthPlugin());

export const recordPresentation = async (presentationUrl, audioData) => {
  console.log(`🎥 Starting Cinematic Recorder for: ${presentationUrl}`);
  
  const browser = await puppeteer.launch({
    // FIX 1: Use new headless mode (renders closer to real chrome)
    headless: "new", 
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--start-fullscreen',
      '--window-size=1920,1080',
      // FIX 2: Force GPU and WebGL (Critical for animations)
      '--enable-gpu',
      '--use-gl=swiftshader',     // Use software GPU if real one missing
      '--enable-webgl',
      '--hide-scrollbars',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas=false',
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // FIX 3: TELL GAMMA TO PLAY ANIMATIONS
  // This is the most important line. It overrides the default "reduce motion" setting.
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' }
  ]);

  // Set User Agent to a rich desktop to ensure high-quality assets load
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

  // Navigate
  await page.goto(presentationUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  // Enter Present Mode
  try {
    await page.click('body');
    await new Promise(r => setTimeout(r, 1000));
    
    // Ctrl+Shift+Enter
    await page.keyboard.down('Control'); 
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');

    // Wait 5s for the Fullscreen transition to settle
    await new Promise(r => setTimeout(r, 5000)); 
  } catch (e) {
    console.warn("⚠️ Mode switch warning:", e);
  }

  // Setup Recorder - Use 60 FPS for smooth motion
  const recorder = new PuppeteerScreenRecorder(page, {
    followNewTab: false,
    fps: 60,                // 60fps is required to capture smooth CSS transitions
    ffmpeg_Path: '/usr/bin/ffmpeg', 
    videoFrame: { width: 1920, height: 1080 },
    videoCrf: 18,           // High Quality
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
      // We must record this "Movement" phase before the next audio theoretically starts.
      await new Promise(r => setTimeout(r, 1500)); 
    }
  }

  // End Buffer
  await new Promise(r => setTimeout(r, 2000)); 
  
  await recorder.stop();
  await browser.close();
  
  return outputVideoPath;
};