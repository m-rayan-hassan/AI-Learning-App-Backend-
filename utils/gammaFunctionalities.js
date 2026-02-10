import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;

export const constructGammaPrompt = (llmResponse) => {
  let finalPrompt = `Create a presentation about ${llmResponse.presentation_title}. \n`;
  finalPrompt += `Style: ${llmResponse.gamma_global_prompt} \n\n`;
  finalPrompt += `Here is the detailed outline to follow strictly:\n`;

  llmResponse.slides.forEach((slide) => {
    finalPrompt += `- Card ${slide.index}: ${slide.gamma_card_content}\n`;
  });

  return finalPrompt;
};

// Helper function to pause execution (for polling)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 1. Start the Generation Job
 */
export const startGammaGeneration = async (outlineText, cardCount) => {
  const options = {
    method: "POST",
    url: "https://public-api.gamma.app/v1.0/generations", // Verify this URL in your docs
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": GAMMA_API_KEY, // Check if Gamma uses 'Bearer' or 'x-api-key'
    },
    data: {
      inputText: outlineText, // This is the structured text from your LLM
      textMode: "generate",
      format: "presentation",
      // We assume standard aspect ratio, but you can force 16:9
      cardSplit: "auto",
      numCards: cardCount,
      cardOptions: {
        dimensions: "16x9",
      },
      // We don't need PDF, but if the API forces a field, leave it.
      // We are interested in the 'gammaUrl' response.
      sharingOptions: {
        workspaceAccess: "view",
        externalAccess: "view",
      },
    },
  };

  try {
    const response = await axios.request(options);
    return response.data.generationId;
  } catch (error) {
    console.error(
      "Gamma Start Error:",
      error.response ? error.response.data : error.message,
    );
    throw new Error("Failed to start Gamma generation");
  }
};

/**
 * 2. Poll until the URL is ready
 */
export const getGammaUrl = async (generationId) => {
  const url = `https://public-api.gamma.app/v1.0/generations/${generationId}`;

  let status = "processing";
  let attempts = 0;
  const maxAttempts = 60; // Wait up to 5 minutes (60 * 5s)

  console.log(`⏳ Polling Gamma for Job: ${generationId}`);

  while (status !== "completed" && status !== "failed") {
    if (attempts >= maxAttempts) throw new Error("Gamma generation timed out");

    // Wait 5 seconds between checks
    await sleep(5000);

    try {
      const response = await axios.get(url, {
        headers: {
          accept: "application/json",
          'X-API-KEY': GAMMA_API_KEY,
        },
      });

      status = response.data.status;

      if (status === "completed") {
        console.log("✅ Gamma Generation Complete!");
        return response.data.gammaUrl;
      } else if (status === "failed") {
        throw new Error("Gamma generation failed on server side.");
      }

      console.log(`...Status: ${status}`);
      attempts++;
    } catch (error) {
      console.error("Polling Error:", error.message);
      throw error;
    }
  }
};
