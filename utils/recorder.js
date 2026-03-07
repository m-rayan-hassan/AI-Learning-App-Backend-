import { connect } from "puppeteer-real-browser";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Dispatch keyboard event safely via CDP (lowest memory overhead).
 * Doesn't require V8 JS execution context like page.evaluate does,
 * which prevents Runtime.callFunctionOn timeouts during OOM thrashing.
 */
const pressKeyCDP = async (page, keyName) => {
  try {
    await page.keyboard.press(keyName);
  } catch (e) {
    console.warn(`⚠️ Key press failed (${keyName}):`, e.message);
  }
};

export const recordPresentation = async (presentationUrl, audioData, docId) => {
  console.log(`🎥 Starting Recorder for: ${presentationUrl} (Low Memory Mode)`);

  let browser = null;

  try {
    const response = await connect({
      headless: false,
      turnstile: true,
      disableXvfb: false,
      protocolTimeout: 300000,
      args: [
        // Core stealth & isolation
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        // Maximize memory savings (Crucial for 1GB RAM limits like Railway)
        "--disable-site-isolation-trials",
        "--memory-pressure-off",
        "--js-flags=--expose-gc",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--use-gl=swiftshader",
        "--enable-webgl",
        // Disable unnecessary features
        "--disable-extensions",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-infobars",
        "--hide-scrollbars",
        // Set window to 720p + chrome allowance
        "--window-size=1280,800",
      ],
    });

    browser = response.browser;
    const cfPage = response.page;

    cfPage.setDefaultTimeout(120000);
    cfPage.setDefaultNavigationTimeout(120000);

    // ========== STEP 1: Solve Cloudflare (Memory Optimized) ==========
    console.log("🌐 Navigating to solve Cloudflare...");
    await cfPage.goto(presentationUrl, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    console.log("✅ DOM content loaded.");

    console.log("⏳ Waiting for Cloudflare verification...");
    let cloudflareCleared = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const hasTurnstile = await cfPage.evaluate(() => {
        const frame = document.querySelector('iframe[src*="challenges.cloudflare.com"]');
        const container = document.querySelector("#challenge-running, #challenge-stage, #challenge-form");
        const isChallengePage =
          document.title.toLowerCase().includes("just a moment") ||
          document.title.toLowerCase().includes("attention required");
        return !!(frame || container || isChallengePage);
      }).catch(() => false);

      if (!hasTurnstile) {
        cloudflareCleared = true;
        console.log("✅ Cloudflare verification passed!");
        break;
      }
      await sleep(3000);
    }

    if (!cloudflareCleared) throw new Error("Cloudflare timeout");

    // ========== STEP 2: Open a FRESH tab  ==========
    console.log("🔄 Opening fresh tab and killing CF page to free memory...");
    const page = await browser.newPage();

    // Kill CF page instantly
    await cfPage.close().catch(() => {});
    
    // Kill any background pages
    const allPages = await browser.pages();
    for (const p of allPages) {
      if (p !== page) await p.close().catch(() => {});
    }

    page.setDefaultTimeout(120000);
    page.setDefaultNavigationTimeout(120000);

    // Drop to 720p viewport — reduces memory for rendering and recording by ~50%
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, "devicePixelRatio", { get: () => 1 });
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`🔴 JS Error: ${msg.text()}`);
    });

    // Navigate to presentation
    console.log("🌐 Loading presentation on fresh page...");
    await page.goto(presentationUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // ========== STEP 3: Wait for Gamma content ==========
    console.log("⏳ Waiting for Gamma content...");
    await sleep(5000);

    let contentReady = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      const info = await page.evaluate(() => {
        if (!document.body) return { ready: false };
        const textLen = document.body.innerText.length;
        const divCount = document.querySelectorAll("div").length;
        const hasGamma = !!document.querySelector("[data-block-id], [class*='deck'], [class*='slide'], article");
        return { ready: (textLen > 100 && divCount > 15) && (hasGamma || textLen > 200), textLen, divCount, title: document.title };
      }).catch(() => ({ ready: false, textLen: 0, divCount: 0, title: 'Error' }));

      console.log(`   ...Loading (${attempt + 1}/12): text=${info.textLen}, divs=${info.divCount}, title="${info.title}"`);

      if (info.ready) {
        contentReady = true;
        console.log(`✅ Content detected! (text: ${info.textLen}, divs: ${info.divCount})`);
        break;
      }
      await sleep(5000);
    }

    if (!contentReady) {
      console.warn("⚠️ Content wait timeout, proceeding anyway...");
      try {
        const html = await page.content();
        console.log(`📄 HTML snippet (1000 chars):\n${html.substring(0, 1000)}`);
        const ssPath = path.join(process.cwd(), "temp_video", `debug_local_${Date.now()}.png`);
        await page.screenshot({ path: ssPath, fullPage: true });
        console.log(`📸 Saved screenshot to ${ssPath}`);
      } catch (e) {}
      await sleep(10000);
    }

    await sleep(3000);

    // ========== STEP 4: Enter Presentation Mode ==========
    console.log("🎬 Entering presentation mode...");
    try {
      await page.click("body").catch(() => {});
      await sleep(1000);

      const presentBtn = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button, a"));
        const btn = btns.find(b => 
          (b.getAttribute('aria-label') || '').toLowerCase().includes('resent') ||
          (b.textContent || '').toLowerCase().includes('present')
        );
        if (btn) { btn.click(); return true; }
        return false;
      }).catch(() => false);

      if (presentBtn) {
        console.log("✅ Clicked Present button.");
      } else {
        console.log("⚠️ Present button not found, using keyboard fallback...");
        await pressKeyCDP(page, "Enter");
      }
      await sleep(5000);
    } catch (e) {
      console.warn("⚠️ Present mode entry failed:", e.message);
    }

    // ========== STEP 5: Start recorder (720p Optimized) ==========
    console.log("🎬 Initializing recorder at 720p 24FPS to save memory...");
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 24, // Standard cinematic, uses less mem than 25/30
      ffmpeg_Path: "/usr/bin/ffmpeg",
      videoFrame: { width: 1280, height: 720 }, // Down from 1080p -> saves ~55% memory
      videoCrf: 28, // Lower quality, higher compression (saves RAM during encode)
      aspectRatio: "16:9",
      recordDurationLimit: 600 // 10 min hard limit
    });

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const tempDir = path.join(process.cwd(), "temp_video", docId.toString());
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const outputVideoPath = path.join(tempDir, `silent_${docId}_${Date.now()}_${uniqueId}.mp4`);

    await recorder.start(outputVideoPath);
    console.log("🔴 Recording started.");

    // ========== STEP 6: Slide Navigation ==========
    console.log("▶️ Starting slide navigation...");
    for (let i = 0; i < audioData.length; i++) {
      const slideAudio = audioData[i];
      console.log(`👉 Slide ${i + 1}: ${slideAudio.duration}s`);

      await sleep(slideAudio.duration * 1000);
      await sleep(500);

      if (i < audioData.length - 1) {
        console.log("   ➡️ Next Slide");
        await pressKeyCDP(page, "ArrowRight");
        await sleep(1500);
      }
    }

    await sleep(2000);

    await recorder.stop();
    console.log("✅ Recording complete.");

    return outputVideoPath;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("🧹 Browser closed, memory freed.");
      } catch (e) {
        console.error("Failed to close browser:", e.message);
      }
    }
  }
};
