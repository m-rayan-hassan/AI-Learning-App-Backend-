import Document from "../models/Document.model.js";
import Flashcard from "../models/Flashcard.model.js";
import Quiz from "../models/Quiz.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import VoiceOverview from "../models/VoiceOverview.model.js";
import PodcastOverview from "../models/PodcastOverview.model.js";
import VideoOverview from "../models/VideoOverview.model.js";
import * as aiFunctionalities from "../utils/aiFunctionalities.js";
import * as voiceFunctionalities from "../utils/voiceFunctionalities.js";
import { uploadMedia } from "../config/cloudinary.js";
import fs from "fs/promises";
import path from "path";
import { constructGammaPrompt, startGammaGeneration, getGammaUrl } from "../utils/gammaFunctionalities.js";
import { recordPresentation } from "../utils/recorder.js";
import { stitchAudioAndVideo } from "../utils/stitcher.js";

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

    const content = document.extractedText;

    const cards = await aiFunctionalities.generateFlashcards(
      content,
      parseInt(count),
    );

    console.log("Cards generated", cards);

    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      cards: cards.map((card) => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarted: false,
      })),
    });

    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: "Flashcards generated successfully",
    });
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

    if (!document) {
      return res.staus(404).json({
        success: false,
        error: "Document not found or not ready",
        statusCode: 404,
      });
    }

    console.log("number of questions: ", numQuestions);

    const content = document.extractedText;
    const questions = await aiFunctionalities.generateQuiz(
      content,
      parseInt(numQuestions),
    );

    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} - Quiz`,
      questions: questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0,
    });

    res.status(200).json({
      success: true,
      data: quiz,
      message: "Quiz generated successfully",
    });
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

    const content = document.extractedText;
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

    const content = document.extractedText;
    const answer = await aiFunctionalities.chatWithContext(
      question,
      content,
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

    const content = document.extractedText;

    const voiceScript =
      await aiFunctionalities.generateVoiceOverviewScript(content);

    voiceOverviewFilePath =
      await voiceFunctionalities.generateVoice(voiceScript, document._id);

    const voiceOverview = await uploadMedia(
      voiceOverviewFilePath,
      "ai-learning-app/voice-overview",
    );

    const voiceOverviewUrl = voiceOverview.secure_url;

    await VoiceOverview.create({
      documentId: document._id,
      userId: req.user._id, // Fixed typo req.user_id
      publicId: voiceOverview.public_id,
      secureUrl: voiceOverviewUrl 
    });

    res.status(200).json({
      success: true,
      message: "Voice overview generated successfully",
      voice_url: voiceOverviewUrl,
    });
  } catch (error) {
    next(error);
  } finally {
    if (voiceOverviewFilePath) {
      try {
        await fs.unlink(path.resolve(voiceOverviewFilePath));
      } catch (err) {
        console.error("Failed to delete temp voice file:", err);
      }
    }
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

    const content = document.extractedText;

    const voice_id1 = "JBFqnCBsd6RMkjVDRZzb",
      voice_id2 = "21m00Tcm4TlvDq8ikWAM";

    const podcastScript = await aiFunctionalities.generatePodcast(
      content,
      voice_id1,
      voice_id2,
    );

    podcastFilePath =
      await voiceFunctionalities.generatePodcast(podcastScript, document._id);

    const podcast = await uploadMedia(
      podcastFilePath,
      "ai-learning-app/podcast",
    );

    const podcastUrl = podcast.secure_url;

    await PodcastOverview.create({
      documentId: document._id,
      userId: req.user._id,
      publicId: podcast.public_id,
      secureUrl: podcastUrl
    });

    res.status(200).json({
      success: true,
      message: "Podcast generated successfully",
      podcast_url: podcastUrl,
    });
  } catch (error) {
    next(error);
  } finally {
    if (podcastFilePath) {
      try {
        await fs.unlink(path.resolve(podcastFilePath));
      } catch (err) {
        console.error("Failed to delete temp podcast file:", err);
      }
    }
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

    tempAudioDir = path.join(process.cwd(), "temp_audio", document._id.toString());
    tempVideoDir = path.join(process.cwd(), "temp_video", document._id.toString());

    const content = document.extractedText;
    const videoContent = await aiFunctionalities.generateVideoContent(content);
    console.log("Video content", videoContent);
    
    const slideCount = videoContent.slideCount;

    const gammaPrompt = constructGammaPrompt(videoContent);
    const gammaId = await startGammaGeneration(gammaPrompt, slideCount);

    console.log("Gamma ID: ", gammaId);
    
    const gammaUrl = await getGammaUrl(gammaId);
    console.log("Gamma Url: ", gammaUrl);
    
    const audioScript = await voiceFunctionalities.generateVideoScript(videoContent, document._id);
    const silentVidoPath = await recordPresentation(gammaUrl, audioScript, document._id);
    finalVideoPath = await stitchAudioAndVideo(silentVidoPath, audioScript, document._id);

    const video = await uploadMedia(finalVideoPath, "ai-learning-app/videos");

    const videoUrl = video.secure_url;
    console.log("Video Url: ", videoUrl);
    
    await VideoOverview.create({
      documentId: document._id,
      userId: req.user._id,
      publicId: video.public_id,
      secureUrl: videoUrl
    })

    return res.status(200).json({
      success: true,
      message: "Video generated successfully",
      data: videoUrl
    })
    
  } catch (error) {
    next(error);
  } finally {
    try {
      if (finalVideoPath && await fs.stat(path.resolve(finalVideoPath)).then(() => true).catch(() => false)) {
        await fs.unlink(path.resolve(finalVideoPath));
      }
    } catch (err) {
      console.error("Failed to clean up final video path:", err);
    }
    
    try {
      if (tempAudioDir && await fs.stat(tempAudioDir).then(() => true).catch(() => false)) {
        await fs.rm(tempAudioDir, { recursive: true, force: true });
      }
    } catch (err) {
       console.error("Failed to clean up temp audio dir:", err);
    }
    
    try {
      if (tempVideoDir && await fs.stat(tempVideoDir).then(() => true).catch(() => false)) {
        await fs.rm(tempVideoDir, { recursive: true, force: true });
      }
    } catch (err) {
       console.error("Failed to clean up temp video dir:", err);
    }
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

    const voiceOverview = await VoiceOverview.findOne({
      documentId: document._id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Voice Overview fetched successfully",
      data: voiceOverview?.secureUrl
    });


  } catch (error) {
    next(error);
  }
}

export const getPodcastUrl = async (req, res, next) => {
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
    
    const podcastOverview = await PodcastOverview.findOne({
      documentId: document._id,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "Voice Overview fetched successfully",
      data: podcastOverview?.secureUrl
    });
  } catch (error) {
    next(error);
  }
}

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
      userId: req.user._id
    });


    return res.status(200).json({
      success: true,
      message: "Video Overview fetched successfully",
      data: videoOverview?.secureUrl
    });
  } catch (error) {
    next(error);
  }
}