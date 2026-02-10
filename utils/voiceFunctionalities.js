import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import path from "path";
import fs from "fs";
import { pipeline } from "stream/promises"; // specific import for cleaner stream handling
import { getAudioDurationInSeconds } from "get-audio-duration";

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

export const generateVideoScript = async (scriptData) => {
  const audioAssets = [];
  const tempDir = path.join(process.cwd(), 'temp_audio'); // Create a temp folder

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log(`Starting audio generation for ${scriptData.slides.length} slides...`);

  try {
    for (const slide of scriptData.slides) {
      const fileName = `slide_${slide.index}_${Date.now()}.mp3`;
      const filePath = path.join(tempDir, fileName);

      const audioStream = await elevenlabs.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb",
        {
          text: slide.voiceover_script, 
          model_id: "eleven_turbo_v2_5", 
          output_format: "mp3_44100_128",
        }
      );

      const fileWriteStream = fs.createWriteStream(filePath);
      await pipeline(audioStream, fileWriteStream);

      const duration = await getAudioDurationInSeconds(filePath);

      console.log(`Generated Slide ${slide.index}: ${duration}s`);

      audioAssets.push({
        index: slide.index,
        filePath: filePath,
        duration: duration
      });
    }

    return audioAssets;

  } catch (error) {
    console.error("Error generating video audio assets:", error);
    throw error; 
  }
};