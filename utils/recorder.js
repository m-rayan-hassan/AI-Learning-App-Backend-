import { connect } from "puppeteer-real-browser";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Dispatch a keyboard event via JS (bypasses CDP protocol).
 */
const pressKey = async (page, key, code, keyCode) => {
  await page.evaluate(
    ({ key, code, keyCode }) => {
      const opts = { key, code, keyCode, which: keyCode, bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent("keydown", opts));
      document.dispatchEvent(new KeyboardEvent("keypress", opts));
      document.dispatchEvent(new KeyboardEvent("keyup", opts));
    },
    { key, code, keyCode },
  );
};

export const recordPresentation = async (presentationUrl, audioData, docId) => {
  console.log(`🎥 Starting Recorder for: ${presentationUrl}`);

  let browser = null;

  try {
    const response = await connect({
      headless: false,
      turnstile: true,
      disableXvfb: false,
      protocolTimeout: 300000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1920,1200",
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
        "--disable-gpu",
        "--disable-extensions",
        "--disable-default-apps",
        "--start-maximized",
      ],
    });

    browser = response.browser;
    const cfPage = response.page;

    cfPage.setDefaultTimeout(120000);
    cfPage.setDefaultNavigationTimeout(120000);

    // ========== STEP 1: Solve Cloudflare on the initial page ==========
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
      });

      if (!hasTurnstile) {
        cloudflareCleared = true;
        console.log("✅ Cloudflare verification passed!");
        break;
      }

      console.log(`   ...Cloudflare still active (attempt ${attempt + 1}/30), waiting 3s...`);
      await sleep(3000);
    }

    if (!cloudflareCleared) {
      throw new Error("Cloudflare verification did not complete within 90 seconds.");
    }

    // ========== STEP 2: Open a FRESH tab and navigate ==========
    // The CF page has contaminated DOM/JS state (Turnstile scripts, challenge
    // remnants) that prevents Gamma's React SPA from properly mounting.
    // A new tab inherits the cf_clearance cookie but starts with a clean context.
    console.log("� Opening fresh tab with clean JS context...");
    const page = await browser.newPage();

    // Close the CF page — free memory
    await cfPage.close().catch(() => {});
    console.log("✅ CF page closed, memory freed.");

    // Close any other extra pages
    const allPages = await browser.pages();
    for (const p of allPages) {
      if (p !== page) await p.close().catch(() => {});
    }

    // Configure the fresh page
    page.setDefaultTimeout(120000);
    page.setDefaultNavigationTimeout(120000);

    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, "devicePixelRatio", { get: () => 1 });
    });

    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "no-preference" },
    ]);

    // Log JS errors for debugging
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`🔴 JS Console Error: ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      console.log(`🔴 Page Error: ${err.message}`);
    });

    // Navigate to the presentation on the clean page
    console.log("🌐 Loading presentation on fresh page...");
    await page.goto(presentationUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log(`📄 Page title: "${pageTitle}"`);
    console.log(`📍 URL: ${pageUrl}`);

    // ========== STEP 3: Wait for Gamma content ==========
    console.log("⏳ Waiting for Gamma content...");
    await sleep(5000); // Let SPA hydrate

    let contentReady = false;
    for (let attempt = 0; attempt < 12; attempt++) {
      const info = await page.evaluate(() => {
        const body = document.body;
        if (!body) return { ready: false, textLen: 0, divCount: 0 };
        const textLen = body.innerText.length;
        const divCount = document.querySelectorAll("div").length;
        const hasGamma =
          !!document.querySelector("[data-block-id]") ||
          !!document.querySelector('[class*="deck"]') ||
          !!document.querySelector('[class*="slide"]') ||
          !!document.querySelector('[class*="card"]') ||
          !!document.querySelector("article");
        return {
          ready: (textLen > 100 && divCount > 15) && (hasGamma || textLen > 200),
          textLen,
          divCount,
          hasGamma,
        };
      });

      if (info.ready) {
        contentReady = true;
        console.log(`✅ Content detected! (text: ${info.textLen}, divs: ${info.divCount})`);
        break;
      }

      console.log(`   ...Loading (${attempt + 1}/12): text=${info.textLen}, divs=${info.divCount}, gamma=${info.hasGamma}`);
      await sleep(5000);
    }

    if (!contentReady) {
      console.warn("⚠️ Content not detected, proceeding with extra wait...");
      // Log a snippet of the HTML for remote debugging
      const html = await page.content();
      console.log(`📄 HTML snippet (first 500 chars):\n${html.substring(0, 500)}`);
      await sleep(10000);
    }

    await sleep(3000); // Final render buffer

    // ========== STEP 4: Enter Presentation Mode ==========
    console.log("🎬 Entering presentation mode...");
    try {
      await page.click("body").catch(() => {});
      await sleep(1000);

      const presentClicked = await page.evaluate(() => {
        const selectors = [
          'button[aria-label*="resent"]',
          'button[aria-label*="Play"]',
          '[data-testid*="present"]',
          'button[class*="present"]',
          'a[href*="present"]',
        ];
        for (const sel of selectors) {
          const btn = document.querySelector(sel);
          if (btn) { btn.click(); return sel; }
        }
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
          if (btn.textContent.trim().toLowerCase().includes("present")) {
            btn.click();
            return "text:present";
          }
        }
        return null;
      });

      if (presentClicked) {
        console.log(`✅ Clicked Present (${presentClicked}).`);
      } else {
        console.log("⚠️ Present button not found, trying keyboard shortcut...");
        await pressKey(page, "Enter", "Enter", 13);
      }
      await sleep(5000);
    } catch (e) {
      console.warn("⚠️ Presentation mode warning:", e.message);
      await sleep(3000);
    }

    // ========== STEP 5: Start recorder AFTER presentation mode ==========
    console.log("🎬 Initializing recorder...");
    const recorder = new PuppeteerScreenRecorder(page, {
      followNewTab: false,
      fps: 25,
      ffmpeg_Path: "/usr/bin/ffmpeg",
      videoFrame: { width: 1920, height: 1080 },
      videoCrf: 23,
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
    console.log("🔴 Recording started (25 FPS).");

    // ========== STEP 6: Slide Navigation ==========
    console.log("▶️ Starting slide navigation...");
    for (let i = 0; i < audioData.length; i++) {
      const slideAudio = audioData[i];
      console.log(`👉 Slide ${i + 1}: ${slideAudio.duration}s`);

      await sleep(slideAudio.duration * 1000);
      await sleep(500);

      if (i < audioData.length - 1) {
        console.log("   ➡️ Next Slide");
        await pressKey(page, "ArrowRight", "ArrowRight", 39);
        await sleep(1500);
      }
    }

    await sleep(2000);

    await recorder.stop();
    console.log("✅ Recording complete:", outputVideoPath);

    return outputVideoPath;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("🧹 Browser closed.");
      } catch (closeErr) {
        console.error("Failed to close browser:", closeErr);
      }
    }
  }
};
