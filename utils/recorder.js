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
      disableXvfb: false,
      protocolTimeout: 180000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--window-size=1920,1200",
        "--force-device-scale-factor=1",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-infobars",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-gpu",
        "--start-maximized",
      ],
    });

    browser = response.browser;
    const page = response.page;

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

    // ========== STEP 2: Handle Cloudflare ==========
    console.log("⏳ Waiting for Cloudflare verification...");

    let cloudflareCleared = false;
    for (let attempt = 0; attempt < 24; attempt++) {
      const hasTurnstile = await page.evaluate(() => {
        const frame = document.querySelector(
          'iframe[src*="challenges.cloudflare.com"]',
        );
        const container = document.querySelector(
          "#challenge-running, #challenge-stage, #challenge-form",
        );
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

    // ========== STEP 3: Wait for page to load after Cloudflare ==========
    // After Cloudflare clears, it redirects to the actual Gamma page.
    // DO NOT reload — that kills the in-flight page load.
    // Instead, wait for any pending navigation (CF redirect) to complete.
    const currentUrl = page.url();
    console.log(`📍 Current URL after CF: ${currentUrl}`);

    // Wait for the post-CF redirect navigation to settle
    console.log("⏳ Waiting for post-CF navigation to complete...");
    try {
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });
      console.log("✅ Post-CF navigation completed (networkidle2).");
    } catch (navErr) {
      // Navigation might have already completed — that's fine
      console.log("ℹ️ No pending navigation (page may already be loaded).");
    }

    const postCfUrl = page.url();
    const pageTitle = await page.title();
    console.log(`� URL now: ${postCfUrl}`);
    console.log(`�📄 Page title: "${pageTitle}"`);

    // ========== STEP 4: Wait for Gamma content to render ==========
    console.log("⏳ Waiting for Gamma presentation to render...");
    await sleep(5000); // Let SPA hydrate

    let contentReady = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const contentInfo = await page.evaluate(() => {
        const body = document.body;
        if (!body)
          return {
            ready: false,
            textLen: 0,
            imgCount: 0,
            divCount: 0,
            title: document.title,
          };

        const textLen = body.innerText.length;
        const imgCount = document.querySelectorAll("img").length;
        const divCount = document.querySelectorAll("div").length;

        const hasText = textLen > 100;
        const hasDivs = divCount > 15;
        const hasGammaContent =
          !!document.querySelector('[class*="deck"]') ||
          !!document.querySelector('[class*="slide"]') ||
          !!document.querySelector('[class*="card"]') ||
          !!document.querySelector('[data-block-id]') ||
          !!document.querySelector('[class*="Block"]') ||
          !!document.querySelector("article") ||
          !!document.querySelector('[role="presentation"]');

        return {
          ready:
            (hasText || imgCount > 0) &&
            hasDivs &&
            (hasGammaContent || textLen > 200),
          textLen,
          imgCount,
          divCount,
          title: document.title,
          hasGammaContent,
        };
      });

      if (contentInfo.ready) {
        contentReady = true;
        console.log(
          `✅ Gamma presentation content detected! (text: ${contentInfo.textLen} chars, images: ${contentInfo.imgCount}, divs: ${contentInfo.divCount})`,
        );
        break;
      }

      console.log(
        `   ...Content loading (attempt ${attempt + 1}/20): text=${contentInfo.textLen}, imgs=${contentInfo.imgCount}, divs=${contentInfo.divCount}, gamma=${contentInfo.hasGammaContent}, title="${contentInfo.title}"`,
      );

      // After 5 failed attempts (25s), try navigating to the URL as fallback
      if (attempt === 4) {
        console.log("   ...Content still empty. Trying page.goto() as fallback...");
        try {
          await page.goto(presentationUrl, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });
          console.log("   ✅ Fallback navigation completed.");
          const fbTitle = await page.title();
          console.log(`   📄 Title after fallback: "${fbTitle}"`);
        } catch (gotoErr) {
          console.warn("   ⚠️ Fallback goto failed:", gotoErr.message);
        }
        await sleep(5000);
        continue;
      }

      // After 10 failed attempts (50s), try one more hard navigation
      if (attempt === 9) {
        console.log("   ...Still empty. Trying final goto with networkidle0...");
        try {
          await page.goto(presentationUrl, {
            waitUntil: "networkidle0",
            timeout: 30000,
          });
          console.log("   ✅ Final navigation completed.");
        } catch (gotoErr) {
          console.warn("   ⚠️ Final goto failed:", gotoErr.message);
        }
        await sleep(5000);
        continue;
      }

      await sleep(5000);
    }

    if (!contentReady) {
      console.warn(
        "⚠️ Gamma content not fully detected. Taking diagnostics...",
      );
      try {
        const debugDir = path.join(process.cwd(), "temp_video");
        if (!fs.existsSync(debugDir))
          fs.mkdirSync(debugDir, { recursive: true });
        const ssPath = path.join(debugDir, `debug_content_${Date.now()}.png`);
        await page.screenshot({ path: ssPath, fullPage: true });
        console.log(`📸 Debug screenshot saved: ${ssPath}`);

        // Log first 1000 chars of HTML for remote debugging
        const html = await page.content();
        console.log(`📄 Page HTML (first 1000 chars):\n${html.substring(0, 1000)}`);

        const htmlPath = path.join(
          debugDir,
          `debug_content_${Date.now()}.html`,
        );
        fs.writeFileSync(htmlPath, html);
        console.log(`📄 Full debug HTML saved: ${htmlPath}`);
      } catch (ssErr) {
        console.warn("Could not take diagnostics:", ssErr.message);
      }
      console.log("⏳ Proceeding with extra 10s buffer...");
      await sleep(10000);
    }

    // Extra render buffer
    await sleep(3000);

    // ========== STEP 5: Enter Presentation Mode ==========
    console.log("🎬 Entering presentation mode...");
    try {
      await page.click("body").catch(() => {});
      await sleep(2000);

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
          if (btn) {
            btn.click();
            return sel;
          }
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
        console.log(
          `✅ Clicked 'Present' button (selector: ${presentClicked}).`,
        );
        await sleep(5000);
      } else {
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

    // ========== STEP 6: Record ==========
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

    // ========== STEP 7: Slide Navigation Loop ==========
    for (let i = 0; i < audioData.length; i++) {
      const slideAudio = audioData[i];
      console.log(`👉 Slide ${i + 1}: ${slideAudio.duration}s`);

      await sleep(slideAudio.duration * 1000);
      await sleep(500);

      if (i < audioData.length - 1) {
        console.log("   ➡️ Next Slide");
        await page.keyboard.press("ArrowRight");
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
        console.log("🧹 Browser closed, memory freed.");
      } catch (closeErr) {
        console.error("Failed to close browser:", closeErr);
      }
    }
  }
};
