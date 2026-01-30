import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises"; // specific import for cleaner stream handling

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

export const generateVoice = async (text) => {
  try {
    const audioBuffer = await elevenlabs.textToSpeech.convert(
      "JBFqnCBsd6RMkjVDRZzb",
      {
        text: text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      },
    );

    const outputPath = path.join("uploads", `test${Date.now()}.mp3`);

    // Write the buffer directly to file
    await fs.promises.writeFile(outputPath, audioBuffer);

    console.log("Audio saved with voice:", outputPath);

    return outputPath;
  } catch (error) {
    console.error("Error generateing voice overview", error);
  }
};

export const generatePodcast = async (script) => {
  try {
    const dialogue = JSON.parse(script);

    const audioStream = await elevenlabs.textToDialogue.convert({
      voiceId: "JBFqnCBsd6RMkjVDRZzb", // Optional: Provide a default/fallback Voice ID
      inputs: dialogue,
    });

    const outputPath = path.join("uploads", `podcast${Date.now()}.mp3`);
    const fileWriteStream = fs.createWriteStream(outputPath);

    // 2. Pipe the stream to the file
    await pipeline(audioStream, fileWriteStream);

    console.log("Podcast saved:", outputPath);

    return outputPath;
  } catch (error) {
    console.error("Error generating podcast:", error);
  }
};
