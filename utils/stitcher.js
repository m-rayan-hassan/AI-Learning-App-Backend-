import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

/**
 * Merges audio and video, then cleans up all temporary files.
 */
export const stitchAudioAndVideo = async (silentVideoPath, audioData) => {
  console.log("🧵 Stitching Audio & Video...");

  const tempDir = path.dirname(silentVideoPath);
  const outputDir = path.join(process.cwd(), 'public', 'videos');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const finalOutputPath = path.join(outputDir, `course_${Date.now()}.mp4`);
  
  // Intermediate Temp Files
  const audioListPath = path.join(tempDir, `concat_list_${Date.now()}.txt`);
  const fullAudioPath = path.join(tempDir, `full_audio_${Date.now()}.mp3`);
  const silencePath = path.join(tempDir, 'silence_2s.mp3');

  try {
    // 1. Generate Silence Track (if not exists)
    if (!fs.existsSync(silencePath)) {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input('anullsrc')
          .inputFormat('lavfi')
          .audioChannels(1)
          .audioFrequency(44100)
          .duration(2.0) // Matches the Recorder wait time
          .save(silencePath)
          .on('end', resolve)
          .on('error', (err) => reject(new Error(`Silence Gen Failed: ${err.message}`)));
      });
    }

    // 2. Build FFmpeg Input List
    let listContent = '';
    audioData.forEach((slide) => {
      // Escape paths safely for FFmpeg
      const safeAudio = slide.filePath.replace(/'/g, "'\\''");
      const safeSilence = silencePath.replace(/'/g, "'\\''");
      
      listContent += `file '${safeAudio}'\n`;
      listContent += `file '${safeSilence}'\n`;
    });
    fs.writeFileSync(audioListPath, listContent);

    // 3. Concatenate Audio
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(audioListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions('-c copy')
        .save(fullAudioPath)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(`Audio Merge Failed: ${err.message}`)));
    });

    // 4. Merge Video + Audio
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(silentVideoPath)
        .input(fullAudioPath)
        .outputOptions([
          '-c:v copy',    // Copy video stream (Fast)
          '-c:a aac',     // Audio codec
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest'     // End when shortest stream ends
        ])
        .save(finalOutputPath)
        .on('end', resolve)
        .on('error', (err) => reject(new Error(`Final Merge Failed: ${err.message}`)));
    });

    console.log(`✅ Video Ready: ${finalOutputPath}`);

    // --- 5. CLEANUP ROUTINE ---
    console.log("🧹 Cleaning up temporary files...");
    
    // A. Delete Individual Slide Audios (The MP3s from ElevenLabs)
    audioData.forEach(slide => {
      if (fs.existsSync(slide.filePath)) {
        fs.unlinkSync(slide.filePath);
      }
    });

    // B. Delete Intermediate Files (Lists, Full Audio, Silence, Silent Video)
    const filesToDelete = [
      silentVideoPath, 
      fullAudioPath, 
      audioListPath, 
      silencePath // Remove this if you want to cache silence for next time
    ];

    filesToDelete.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    console.log("✨ Cleanup Complete.");

    return finalOutputPath;

  } catch (error) {
    console.error("❌ Stitching Error:", error);
    // Even if it fails, try to cleanup to prevent clutter
    try {
      if (fs.existsSync(silentVideoPath)) fs.unlinkSync(silentVideoPath);
    } catch (e) { /* ignore */ }
    
    throw error;
  }
};