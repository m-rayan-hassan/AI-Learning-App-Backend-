import Document from "../models/Document.model.js";
import Flashcard from "../models/Flashcard.model.js";
import Quiz from "../models/Quiz.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import User from "../models/User.model.js";
import VoiceOverview from "../models/VoiceOverview.model.js";
import VideoOverview from "../models/VideoOverview.model.js";
import * as aiFunctionalities from "../utils/aiFunctionalities.js";
import * as voiceFunctionalities from "../utils/voiceFunctionalities.js";
import { uploadMedia } from "../config/cloudinary.js";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import {
  constructGammaPrompt,
  startGammaGeneration,
  getGammaUrl,
} from "../utils/gammaFunctionalities.js";
import { enqueueRecording } from "../utils/recordingQueue.js";
import { stitchAudioAndVideo } from "../utils/stitcher.js";
import { userPlans } from "../utils/planFeaturesAndLimit.js";
import { renderVideoRemotion } from "../utils/renderVideoRemotion.js";
import {
  getTestSlideData,
  getTestAudioDurations,
} from "../utils/aiFunctionalitiesRemotion.js";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { embeddings } from "../utils/aiFunctionalities.js";
import { generateSlideImages } from "../utils/imageGenerator.js";

export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }
    console.log("User ID: ", req.user._id);

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userFlashcardCount = user.quotas.flashcard.count;
    const userPlan = user.planType;

    if (
      userFlashcardCount >= userPlans[userPlan].flashcards &&
      new Date() < user.quotas.flashcard.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Flashcards generation limit reached uplaod. Upgrade to generate",
        statusCode: 400,
      });
    }

    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
    });

    if (flashcardCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Cannot generate more than 3 flashcard sets for a document",
        statusCode: 400,
      });
    }

    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      cards: [],
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Flashcards are being generated",
    });

    (async () => {
      try {
        const content = document.notes || document.extractedText;

        const cards = await aiFunctionalities.generateFlashcards(
          content,
          parseInt(count),
        );

        flashcardSet.cards = cards.map((card) => ({
          question: card.question,
          answer: card.answer,
          difficulty: card.difficulty,
          reviewCount: 0,
          isStarted: false,
        }));

        flashcardSet.isGenerated = true;
        flashcardSet.generationStatus = "completed";

        await flashcardSet.save();

        await user.incrementQuota("flashcard");
      } catch (error) {
        console.error("Error generating flashcards", error);
        try {
          flashcardSet.generationStatus = "failed";
          await flashcardSet.save();
        } catch (cleanupErr) {
          console.error(
            "Failed to mark flashcard generation as failed",
            cleanupErr,
          );
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    // Note: fixing your typo staus to status as well
    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userQuizCount = user.quotas.quiz.count;
    const userPlan = user.planType;

    if (
      userQuizCount >= userPlans[userPlan].quizzes &&
      new Date() < user.quotas.quiz.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Quiz generation limit reached. Upgrade to generate more.",
        statusCode: 400,
      });
    }

    const quizCount = await Quiz.countDocuments({ documentId: document._id });

    if (quizCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Cannot generate more than 3 quizzes for a document",
        statusCode: 400,
      });
    }

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} - Quiz`,
      questions: [],
      totalQuestions: parseInt(numQuestions) || 5, // Just setting the intended length or 0
      userAnswers: [],
      score: 0,
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Quiz is being generated",
    });

    (async () => {
      try {
        const content = document.notes || document.extractedText;
        const questions = await aiFunctionalities.generateQuiz(
          content,
          parseInt(numQuestions),
        );

        quiz.questions = questions;
        quiz.totalQuestions = questions.length;
        quiz.isGenerated = true;
        quiz.generationStatus = "completed";

        await quiz.save();

        await user.incrementQuota("quiz");
      } catch (error) {
        console.error("Error generating quiz", error);
        try {
          quiz.generationStatus = "failed";
          await quiz.save();
        } catch (cleanupErr) {
          console.error("Failed to mark quiz generation as failed", cleanupErr);
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.staus(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const content = document.notes || document.extractedText;
    const summary = await aiFunctionalities.generateSummary(content);

    document.summary = summary;

    await document.save();

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary,
      },
      message: "Summary generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const generateNotes = async (req, res, next) => {
  try {
    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const content = document.extractedText;
    const notes = await aiFunctionalities.generateNotes(content);

    document.notes = notes;
    await document.save();

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        notes,
      },
      message: "Notes generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId and question",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.staus(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id,
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: [],
      });
    }

    const chunkCollection =
      mongoose.connection.db.collection("document_chunks");

    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: chunkCollection,
      indexName: "vector_index",
      textKey: "text",
      embeddingKey: "embedding",
    });

    const searchResults = await vectorStore.similaritySearch(question, 3, {
      preFilter: { documentId: { $eq: documentId } }, // MongoDB query syntax to filter by doc ID
    });

    const content = document.extractedText;

    let retrievedContext;

    if (searchResults.length === 0) {
      retrievedContext = content;
    } else {
      retrievedContext = searchResults
        .map((doc) => doc.pageContent)
        .join("\n\n---\n\n");
    }

    const answer = await aiFunctionalities.chatWithContext(
      question,
      retrievedContext,
      chatHistory.messages,
    );

    chatHistory.messages.push(
      {
        role: "user",
        content: question,
        timestamp: new Date(),
      },
      {
        role: "assistant",
        content: answer,
        timestamp: new Date(),
      },
    );

    await chatHistory.save();

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        chatHistoryId: chatHistory._id,
      },
      message: "Response generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;
    if (!documentId || !concept) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId and concept",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.staus(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const content = document.extractedText;
    const explaination = await aiFunctionalities.explainConcept(
      concept,
      content,
    );

    res.status(200).json({
      success: true,
      data: {
        concept,
        explaination,
      },
      messages: "Explaination generated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const chatHistory = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: documentId,
    }).select("messages");

    if (!chatHistory) {
      res.status(200).json({
        success: true,
        data: [],
        message: "No chat history found for this document",
      });
    }

    res.status(200).json({
      success: true,
      data: chatHistory,
      message: "Chat history retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const generateVoiceOverview = async (req, res, next) => {
  let voiceOverviewFilePath = null;
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userVoiceCount = user.quotas.voiceOverview.count;
    const userPlan = user.planType;

    if (
      userVoiceCount >= userPlans[userPlan].voice &&
      new Date() < user.quotas.voiceOverview.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Voice generation limit reached. Upgrade to generate more.",
        statusCode: 400,
      });
    }

    const voiceDoc = await VoiceOverview.create({
      documentId: document._id,
      userId: req.user._id,
      type: "voice",
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Voice overview is being generated",
    });

    (async () => {
      try {
        const content = document.extractedText;

        const voiceScript =
          await aiFunctionalities.generateVoiceOverviewScript(content);

        voiceOverviewFilePath = await voiceFunctionalities.generateVoice(
          voiceScript,
          document._id,
        );

        const voiceOverview = await uploadMedia(
          voiceOverviewFilePath,
          "ai-learning-app/voice-overview",
        );

        const voiceOverviewUrl = voiceOverview.secure_url;

        voiceDoc.publicId = voiceOverview.public_id;
        voiceDoc.secureUrl = voiceOverviewUrl;
        voiceDoc.isGenerated = true;
        voiceDoc.generationStatus = "completed";

        await voiceDoc.save();

        await user.incrementQuota("voiceOverview");
      } catch (error) {
        console.error("Error generating voice overview", error);
        try {
          voiceDoc.generationStatus = "failed";
          await voiceDoc.save();
        } catch (cleanupErr) {
          console.error(
            "Failed to mark voice generation as failed",
            cleanupErr,
          );
        }
      } finally {
        if (voiceOverviewFilePath) {
          try {
            await fs.unlink(path.resolve(voiceOverviewFilePath));
          } catch (err) {
            console.error("Failed to delete temp voice file:", err);
          }
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const generatePodcast = async (req, res, next) => {
  let podcastFilePath = null;
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userVoiceCount = user.quotas.voiceOverview.count;
    const userPlan = user.planType;

    if (
      userVoiceCount >= userPlans[userPlan].voice &&
      new Date() < user.quotas.voiceOverview.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Podcast generation limit reached. Upgrade to generate more.",
        statusCode: 400,
      });
    }

    const podcastDoc = await VoiceOverview.create({
      documentId: document._id,
      userId: req.user._id,
      type: "podcast",
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Podcast is being generated",
    });

    (async () => {
      try {
        const content = document.extractedText;

        const voice_id1 = "bbGtsRRKUfYO634UxSjz",
          voice_id2 = "aUNOP2y8xEvi4nZebjIw";

        const podcastScript = await aiFunctionalities.generatePodcast(
          content,
          voice_id1,
          voice_id2,
        );

        podcastFilePath = await voiceFunctionalities.generatePodcast(
          podcastScript,
          document._id,
        );

        const podcast = await uploadMedia(
          podcastFilePath,
          "ai-learning-app/podcast",
        );

        const podcastUrl = podcast.secure_url;

        podcastDoc.publicId = podcast.public_id;
        podcastDoc.secureUrl = podcastUrl;
        podcastDoc.isGenerated = true;
        podcastDoc.generationStatus = "completed";

        await podcastDoc.save();

        await user.incrementQuota("voiceOverview");
      } catch (error) {
        console.error("Error generating podcast", error);
        try {
          podcastDoc.generationStatus = "failed";
          await podcastDoc.save();
        } catch (cleanupErr) {
          console.error(
            "Failed to mark podcast generation as failed",
            cleanupErr,
          );
        }
      } finally {
        if (podcastFilePath) {
          try {
            await fs.unlink(path.resolve(podcastFilePath));
          } catch (err) {
            console.error("Failed to delete temp podcast file:", err);
          }
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const generateVideo = async (req, res, next) => {
  let finalVideoPath = null;
  let tempAudioDir = null;
  let tempVideoDir = null;
  let document_id_var = null; // Storing to use in finally block

  try {
    const { documentId } = req.body;
    document_id_var = documentId;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userVideoCount = user.quotas.video.count;
    const userPlan = user.planType;

    if (
      userVideoCount >= userPlans[userPlan].video &&
      new Date() < user.quotas.video.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Video generation limit reached. Upgrade to generate more.",
        statusCode: 400,
      });
    }

    const videoDoc = await VideoOverview.create({
      documentId: document._id,
      userId: req.user._id,
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Video is being generated",
    });

    (async () => {
      try {
        tempAudioDir = path.join(
          process.cwd(),
          "temp_audio",
          document._id.toString(),
        );
        tempVideoDir = path.join(
          process.cwd(),
          "temp_video",
          document._id.toString(),
        );

        const content = document.extractedText;
        const videoContent =
          await aiFunctionalities.generateVideoContent(content);
        console.log("Video content", videoContent);

        const slideCount = videoContent.slideCount;

        const gammaPrompt = constructGammaPrompt(videoContent);
        const gammaId = await startGammaGeneration(gammaPrompt, slideCount);

        console.log("Gamma ID: ", gammaId);

        const gammaUrl = await getGammaUrl(gammaId);
        console.log("Gamma Url: ", gammaUrl);

        const audioScript = await voiceFunctionalities.generateVideoScript(
          videoContent,
          document._id,
        );
        const silentVidoPath = await enqueueRecording(
          gammaUrl,
          audioScript,
          document._id,
        );
        finalVideoPath = await stitchAudioAndVideo(
          silentVidoPath,
          audioScript,
          document._id,
        );

        const video = await uploadMedia(
          finalVideoPath,
          "ai-learning-app/videos",
        );

        const videoUrl = video.secure_url;
        console.log("Video Url: ", videoUrl);

        videoDoc.publicId = video.public_id;
        videoDoc.secureUrl = videoUrl;
        videoDoc.isGenerated = true;
        videoDoc.generationStatus = "completed";

        await videoDoc.save();

        await user.incrementQuota("video");
      } catch (error) {
        console.error("Error generating video", error);
        try {
          videoDoc.generationStatus = "failed";
          await videoDoc.save();
        } catch (cleanupErr) {
          console.error(
            "Failed to mark video generation as failed",
            cleanupErr,
          );
        }
      } finally {
        try {
          if (
            finalVideoPath &&
            (await fs
              .stat(path.resolve(finalVideoPath))
              .then(() => true)
              .catch(() => false))
          ) {
            await fs.unlink(path.resolve(finalVideoPath));
          }
        } catch (err) {
          console.error("Failed to clean up final video path:", err);
        }

        try {
          if (
            tempAudioDir &&
            (await fs
              .stat(tempAudioDir)
              .then(() => true)
              .catch(() => false))
          ) {
            await fs.rm(tempAudioDir, { recursive: true, force: true });
          }
        } catch (err) {
          console.error("Failed to clean up temp audio dir:", err);
        }

        try {
          if (
            tempVideoDir &&
            (await fs
              .stat(tempVideoDir)
              .then(() => true)
              .catch(() => false))
          ) {
            await fs.rm(tempVideoDir, { recursive: true, force: true });
          }
        } catch (err) {
          console.error("Failed to clean up temp video dir:", err);
        }
      }
    })();
  } catch (error) {
    next(error);
  }
};

export const getVoiceOverviewUrl = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const voiceOverviews = await VoiceOverview.find({
      documentId: document._id,
      userId: req.user._id,
    }).select("secureUrl type isGenerated generationStatus");

    return res.status(200).json({
      success: true,
      message: "Voice Overviews fetched successfully",
      data: voiceOverviews,
    });
  } catch (error) {
    next(error);
  }
};

export const getVideoUrl = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const videoOverview = await VideoOverview.findOne({
      documentId: document._id,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Video Overview fetched successfully",
      data: videoOverview,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVoiceOverview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voiceOverview = await VoiceOverview.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!voiceOverview) {
      return res.status(404).json({
        success: false,
        error: "Voice overview not found",
        statusCode: 404,
      });
    }

    await voiceOverview.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Voice overview deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVideoOverview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const videoOverview = await VideoOverview.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!videoOverview) {
      return res.status(404).json({
        success: false,
        error: "Video overview not found",
        statusCode: 404,
      });
    }

    await videoOverview.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Video overview deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── Test Recorder Endpoint ──
// Tests ONLY the Puppeteer recorder with a pre-existing Gamma URL + fake audio.
// Zero Gamma/ElevenLabs credits consumed. Remove after confirming production works.
export const testRecorder = async (req, res, next) => {
  let videoPath = "";
  try {
    const testUrl = "https://gamma.app/docs/gs4a3kzr07wicxv";
    const slideCount = 3;
    const slideDuration = 5;

    const fakeAudio = Array.from({ length: slideCount }, (_, i) => ({
      index: i + 1,
      duration: slideDuration,
      filePath: "",
    }));

    console.log("🧪 TEST RECORDER — Starting with URL:", testUrl);
    console.log(
      `🧪 TEST RECORDER — ${slideCount} slides, ${slideDuration}s each`,
    );

    videoPath = await enqueueRecording(testUrl, fakeAudio, "test_prod");
    console.log("🧪 TEST RECORDER — Success! Video at:", videoPath);

    const video = await uploadMedia(videoPath, "ai-learning-app/videos");

    const videoUrl = video.secure_url;
    console.log("Video Url: ", videoUrl);

    return res.status(200).json({
      success: true,
      message: "Recorder test passed — recording works in production!",
      videoPath,
    });
  } catch (error) {
    console.error("🧪 TEST RECORDER — Failed:", error.message);
    next(error);
  } finally {
    if (videoPath) {
      try {
        const videoDir = path.dirname(path.resolve(videoPath));
        await fs.unlink(path.resolve(videoPath));

        // Also remove the temp_video/<id> directory if it's empty
        const files = await fs.readdir(videoDir);
        if (files.length === 0) {
          await fs.rmdir(videoDir);
        }
      } catch (err) {
        console.error("Failed to clean up test recorder files:", err);
      }
    }
  }
};

// ── Test Remotion Pipeline ──
// Tests the Remotion video renderer with hardcoded slide data.
// Zero Gamma/ElevenLabs/LLM credits consumed. Fully self-contained.
export const testRemotionVideo = async (req, res, next) => {
  let videoPath = "";
  let tempVideoDir = null;

  try {
    // 1. Get hardcoded test data (no LLM, no Gamma)
    const testData = getTestSlideData();
    const fakeAudio = getTestAudioDurations(testData.slides);

    console.log("🧪 REMOTION TEST — Starting with hardcoded data");
    console.log(
      `🧪 REMOTION TEST — ${testData.slides.length} slides, layouts: ${testData.slides.map((s) => s.layout).join(", ")}`,
    );

    const docId = `remotion_test_${Date.now()}`;
    tempVideoDir = path.join(process.cwd(), "temp_video", docId);

    // 2. Render video with Remotion (replaces Puppeteer recorder)
    const startTime = Date.now();
    videoPath = await renderVideoRemotion(
      testData.slides,
      fakeAudio,
      docId,
      testData.theme || "default",
      {},
    );
    const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`🧪 REMOTION TEST — Render complete in ${renderTime}s`);
    console.log("🧪 REMOTION TEST — Video at:", videoPath);

    // 3. Upload to Cloudinary
    const video = await uploadMedia(videoPath, "ai-learning-app/videos");
    const videoUrl = video.secure_url;
    console.log("🧪 REMOTION TEST — Cloudinary URL:", videoUrl);

    return res.status(200).json({
      success: true,
      message: "Remotion test passed — video rendered and uploaded!",
      data: {
        videoUrl,
        renderTimeSeconds: parseFloat(renderTime),
        slideCount: testData.slides.length,
        layouts: testData.slides.map((s) => s.layout),
      },
    });
  } catch (error) {
    console.error("🧪 REMOTION TEST — Failed:", error.message);
    next(error);
  } finally {
    // Cleanup
    if (videoPath) {
      try {
        await fs.unlink(path.resolve(videoPath)).catch(() => {});
      } catch (err) {}
    }
    if (tempVideoDir) {
      try {
        await fs
          .rm(tempVideoDir, { recursive: true, force: true })
          .catch(() => {});
      } catch (err) {}
    }
  }
};

// ── Production Remotion Pipeline ──
export const generateRemotionVideo = async (req, res, next) => {
  let finalVideoPath = null;
  let tempAudioDir = null;
  let tempVideoDir = null;

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: "Please provide documentId",
        statusCode: 400,
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: "ready",
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    const user = await User.findOne({ _id: req.user._id });
    const userVideoCount = user.quotas.video.count;
    const userPlan = user.planType;

    if (
      userVideoCount >= userPlans[userPlan].video &&
      new Date() < user.quotas.video.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Video generation limit reached. Upgrade to generate more.",
        statusCode: 400,
      });
    }

    const videoDoc = await VideoOverview.create({
      documentId: document._id,
      userId: req.user._id,
      isGenerated: false,
      generationStatus: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Remotion video is being generated",
    });

    // Background job
    (async () => {
      try {
        const docIdStr = document._id.toString();
        tempAudioDir = path.join(process.cwd(), "temp_audio", docIdStr);
        tempVideoDir = path.join(process.cwd(), "temp_video", docIdStr);

        const content = document.extractedText;

        const userPlan = user.planType;

        // 1. Generate JSON from LLM
        const videoContent =
          await aiFunctionalities.generateRemotionVideoPrompt(
            content,
            userPlan,
          );

        console.log("Video content: ", videoContent);

        console.log("Remotion LLM Output slides:", videoContent.slides.length);

        // 2. Generate Images + Audio IN PARALLEL (independent tasks)
        console.log("🔄 Starting parallel image + audio generation...");
        const [imageMap, audioScript] = await Promise.all([
          // AI Image Generation (OpenAI DALL-E 3)
          generateSlideImages(videoContent.slides),
          // Audio Generation (ElevenLabs TTS)
          voiceFunctionalities.generateVideoScript(videoContent, document._id),
        ]);
        console.log(
          `✅ Parallel generation complete: ${Object.keys(imageMap).length} images, ${audioScript.length} audio clips`,
        );

        // Extract audio durations in the format Remotion expects
        const audioDurations = audioScript.map((ad) => ({
          index: ad.index,
          duration: ad.duration,
          filePath: ad.filePath,
        }));

        // 3. Render raw offline MP4 with Remotion (now with images!)
        const silentVideoPath = await renderVideoRemotion(
          videoContent.slides,
          audioDurations,
          docIdStr,
          videoContent.theme || "default",
          imageMap,
        );

        // 4. Stitch audio logic (FFmpeg)
        finalVideoPath = await stitchAudioAndVideo(
          silentVideoPath,
          audioScript,
          document._id,
        );

        // 5. Upload to Cloudinary
        const video = await uploadMedia(
          finalVideoPath,
          "ai-learning-app/videos",
        );
        const videoUrl = video.secure_url;
        console.log("Remotion Video Url:", videoUrl);

        videoDoc.publicId = video.public_id;
        videoDoc.secureUrl = videoUrl;
        videoDoc.isGenerated = true;
        videoDoc.generationStatus = "completed";

        await videoDoc.save();
        await user.incrementQuota("video");
      } catch (error) {
        console.error("Error generating remotion video", error);
        try {
          videoDoc.generationStatus = "failed";
          await videoDoc.save();
        } catch (cleanupErr) {
          console.error(
            "Failed to mark video generation as failed",
            cleanupErr,
          );
        }
      } finally {
        try {
          if (finalVideoPath)
            await fs.unlink(path.resolve(finalVideoPath)).catch(() => {});
        } catch (err) {}

        try {
          if (tempAudioDir)
            await fs
              .rm(tempAudioDir, { recursive: true, force: true })
              .catch(() => {});
        } catch (err) {}

        try {
          if (tempVideoDir)
            await fs
              .rm(tempVideoDir, { recursive: true, force: true })
              .catch(() => {});
        } catch (err) {}
      }
    })();
  } catch (error) {
    next(error);
  }
};
