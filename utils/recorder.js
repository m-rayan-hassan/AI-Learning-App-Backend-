import { connect } from "puppeteer-real-browser";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Helper: wait ms
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const recordPresentation = async (presentationUrl, audioData, docId) => {
  console.log(`🎥 Starting Recorder for: ${presentationUrl}`);

  let browser = null;

  try {
    const response = await connect({
      headless: false,
      turnstile: true,
      disableXvfb: true,
      protocolTimeout: 180000, // 3 min protocol timeout to prevent Input.dispatch timeouts
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1920,1080",
        "--force-device-scale-factor=1",
        "--hide-scrollbars",
        "--use-gl=swiftshader",
        "--enable-webgl",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-infobars",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--start-maximized",
      ],
    });

    browser = response.browser;
    const page = response.page;

    // Set protocol timeout on the page's CDP session as well
    page.setDefaultTimeout(120000);
    page.setDefaultNavigationTimeout(120000);

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, "devicePixelRatio", {
        get: () => 1,
      });
    });

    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "no-preference" },
    ]);

    // ========== STEP 1: Navigate ==========
    console.log("🌐 Navigating to presentation...");
    await page.goto(presentationUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    console.log("✅ DOM content loaded.");

    // ========== STEP 2: Handle Cloudflare FIRST ==========
    // Cloudflare Turnstile challenge appears BEFORE any Gamma content renders.
    // puppeteer-real-browser handles clicking the checkbox automatically when turnstile: true.
    // We must wait for it to resolve before looking for Gamma elements.
    console.log("⏳ Waiting for Cloudflare verification...");

    let cloudflareCleared = false;
    for (let attempt = 0; attempt < 24; attempt++) {
      // 24 * 5s = 120s max
      const hasTurnstile = await page.evaluate(() => {
        const frame = document.querySelector(
          'iframe[src*="challenges.cloudflare.com"]',
        );
        const container = document.querySelector(
          "#challenge-running, #challenge-stage, #challenge-form",
        );
        // Also check if the page title indicates a challenge
        const isChallengePage =
          document.title.toLowerCase().includes("just a moment") ||
          document.title.toLowerCase().includes("attention required");
        return !!(frame || container || isChallengePage);
      });

      if (!hasTurnstile) {
        cloudflareCleared = true;
        console.log("✅ Cloudflare verification passed!");
        break;
      }

      console.log(
        `   ...Cloudflare still active (attempt ${attempt + 1}/24), waiting 5s...`,
      );
      await sleep(5000);
    }

    if (!cloudflareCleared) {
      console.warn(
        "⚠️ Cloudflare did not clear after 120s. Taking screenshot for debug...",
      );
      try {
        const debugDir = path.join(process.cwd(), "temp_video");
        if (!fs.existsSync(debugDir))
          fs.mkdirSync(debugDir, { recursive: true });
        await page.screenshot({
          path: path.join(debugDir, `debug_cf_${Date.now()}.png`),
          fullPage: true,
        });
      } catch (ssErr) {
        console.warn("Could not take debug screenshot:", ssErr.message);
      }
      throw new Error(
        "Cloudflare verification did not complete within 120 seconds.",
      );
    }

    // ========== STEP 3: Wait for Gamma content to fully render ==========
    // After Cloudflare clears, Gamma redirects/renders the actual presentation.
    // Give it time to load and render.
    console.log("⏳ Waiting for Gamma presentation to render...");
    await sleep(5000); // Initial settle time after Cloudflare redirect

    // Wait for the page to have meaningful content (not a blank/loading page)
    let contentReady = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      // 12 * 5s = 60s max
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        if (!body) return false;
        // Check for substantial content - Gamma pages have lots of rendered elements
        const hasText = body.innerText.length > 200;
        const hasImages = document.querySelectorAll("img").length > 0;
        const hasDivs = document.querySelectorAll("div").length > 20;
        // Check page isn't showing a loading spinner or blank state
        const notLoading = !document.querySelector(
          '[class*="loading"], [class*="spinner"]',
        );
        return (hasText || hasImages) && hasDivs && notLoading;
      });

      if (hasContent) {
        contentReady = true;
        console.log("✅ Gamma presentation content detected!");
        break;
      }

      console.log(
        `   ...Content loading (attempt ${attempt + 1}/12), waiting 5s...`,
      );
      await sleep(5000);
    }

    if (!contentReady) {
      console.warn(
        "⚠️ Gamma content not fully detected, proceeding with extra wait...",
      );
      await sleep(10000);
    }

    // Extra render buffer — let animations, fonts, and images finish loading
    await sleep(3000);

    // Log the page title for debugging
    const pageTitle = await page.title();
    console.log(`📄 Page title: "${pageTitle}"`);

    // ========== STEP 4: Enter Presentation Mode ==========
    console.log("🎬 Entering presentation mode...");
    try {
      // Click on the page body to ensure Chrome has focus on the page
      await page.click("body");
      await sleep(2000);

      // Try to find and click Gamma's "Present" button directly — most reliable method
      const presentClicked = await page.evaluate(() => {
        // Gamma has a present/play button — try multiple selectors
        const selectors = [
          'button[aria-label*="resent"]',
          'button[aria-label*="Play"]',
          '[data-testid*="present"]',
          'button[class*="present"]',
          'a[href*="present"]',
        ];
        for (const sel of selectors) {
          const btn = document.querySelector(sel);
          if (btn) {
            btn.click();
            return true;
          }
        }
        // Also try finding by button text content
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
          if (btn.textContent.trim().toLowerCase().includes("present")) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (presentClicked) {
        console.log("✅ Clicked 'Present' button directly.");
        await sleep(5000);
      } else {
        // Fallback: use CDP keyboard shortcut (Ctrl+Shift+Enter)
        console.log("⚠️ Present button not found, using keyboard shortcut...");
        await page.keyboard.down("Control");
        await page.keyboard.down("Shift");
        await page.keyboard.press("Enter");
        await page.keyboard.up("Shift");
        await page.keyboard.up("Control");
        await sleep(5000);
        console.log("✅ Keyboard shortcut sent.");
      }
    } catch (e) {
      console.warn("⚠️ Presentation mode entry warning:", e.message);
      await sleep(3000);
    }

    // ========== STEP 5: Record ==========
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 60,
      ffmpeg_Path: "/usr/bin/ffmpeg",
      videoFrame: { width: 1920, height: 1080 },
      videoCrf: 18,
      aspectRatio: "16:9",
    });

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const tempDir = path.join(process.cwd(), "temp_video", docId.toString());
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const outputVideoPath = path.join(
      tempDir,
      `silent_${docId}_${Date.now()}_${uniqueId}.mp4`,
    );

    await recorder.start(outputVideoPath);
    console.log("🔴 Recording Started (60 FPS)...");

    // ========== STEP 6: Slide Navigation Loop ==========
    for (let i = 0; i < audioData.length; i++) {
      const slideAudio = audioData[i];
      console.log(`👉 Slide ${i + 1}: ${slideAudio.duration}s`);

      // Wait for voiceover duration
      await sleep(slideAudio.duration * 1000);

      // Breath gap (matches stitcher silence)
      await sleep(500);

      // Navigate to next slide (except on the last one)
      if (i < audioData.length - 1) {
        console.log("   ➡️ Next Slide");
        await page.keyboard.press("ArrowRight");
        // Wait for slide transition animation
        await sleep(1500);
      }
    }

    // End buffer
    await sleep(2000);

    await recorder.stop();
    console.log("✅ Recording complete:", outputVideoPath);

    return outputVideoPath;
  } finally {
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
