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
      // Let puppeteer-real-browser manage its own Xvfb display.
      // Do NOT set disableXvfb: true — that caused display issues in Docker.
      disableXvfb: false,
      protocolTimeout: 180000,
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

    // Force exact viewport via CDP — ensures 1920x1080 even in headed mode
    // where browser chrome can shrink the viewport.
    try {
      const cdpSession = await page.target().createCDPSession();
      await cdpSession.send('Emulation.setDeviceMetricsOverride', {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        mobile: false,
      });
    } catch (cdpErr) {
      console.warn('⚠️ CDP viewport override failed (non-critical):', cdpErr.message);
    }

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
    // puppeteer-real-browser with turnstile: true handles the Turnstile checkbox.
    // We wait for the challenge page to disappear.
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
      // Take debug screenshot before throwing
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

    // ========== STEP 3: RELOAD after Cloudflare ==========
    // CRITICAL FIX: After Cloudflare clears via redirect, the page is in a
    // partially-loaded state. We MUST reload with networkidle2 to ensure
    // Gamma's React SPA fully renders — fetching API data, hydrating, etc.
    console.log("🔄 Reloading page with networkidle2 to ensure full SPA render...");
    await sleep(2000); // Brief settle after CF redirect

    try {
      await page.reload({
        waitUntil: "networkidle2",
        timeout: 60000,
      });
      console.log("✅ Page reloaded with networkidle2.");
    } catch (reloadErr) {
      console.warn("⚠️ Reload timeout, trying goto instead...");
      // Fallback: navigate directly (cookies are already set from CF pass)
      await page.goto(presentationUrl, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
      console.log("✅ Page navigated with networkidle2.");
    }

    // Log the page title for debugging
    const pageTitle = await page.title();
    console.log(`📄 Page title: "${pageTitle}"`);

    // ========== STEP 4: Wait for Gamma content to fully render ==========
    console.log("⏳ Waiting for Gamma presentation to render...");
    await sleep(3000); // Initial settle time

    let contentReady = false;
    for (let attempt = 0; attempt < 15; attempt++) {
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

        // Gamma presentations have substantial content when loaded
        const hasText = textLen > 100;
        const hasDivs = divCount > 15;
        // Check for common Gamma content indicators
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
        `   ...Content loading (attempt ${attempt + 1}/15): text=${contentInfo.textLen}, imgs=${contentInfo.imgCount}, divs=${contentInfo.divCount}, gamma=${contentInfo.hasGammaContent}, title="${contentInfo.title}"`,
      );

      // On attempt 5, try waiting for network idle (stricter)
      if (attempt === 4) {
        console.log("   ...Trying waitForNetworkIdle...");
        await page
          .waitForNetworkIdle({ idleTime: 2000, timeout: 15000 })
          .catch(() => {});
      }

      await sleep(3000);
    }

    if (!contentReady) {
      console.warn(
        "⚠️ Gamma content not fully detected after retries. Taking debug screenshot...",
      );
      try {
        const debugDir = path.join(process.cwd(), "temp_video");
        if (!fs.existsSync(debugDir))
          fs.mkdirSync(debugDir, { recursive: true });
        const ssPath = path.join(debugDir, `debug_content_${Date.now()}.png`);
        await page.screenshot({ path: ssPath, fullPage: true });
        console.log(`📸 Debug screenshot saved: ${ssPath}`);

        const html = await page.content();
        const htmlPath = path.join(
          debugDir,
          `debug_content_${Date.now()}.html`,
        );
        fs.writeFileSync(htmlPath, html);
        console.log(`📄 Debug HTML saved: ${htmlPath}`);
      } catch (ssErr) {
        console.warn("Could not take debug screenshot:", ssErr.message);
      }
      console.log("⏳ Proceeding with extra 10s buffer...");
      await sleep(10000);
    }

    // Extra render buffer — let animations, fonts, and images finish loading
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
