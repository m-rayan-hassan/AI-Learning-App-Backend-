import expresss from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js"
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  generateNotes,
  chat,
  explainConcept,
  chatHistory,
  generateVoiceOverview,
  generatePodcast,
  generateVideo,
  testRecorder,
  getVoiceOverviewUrl,
  getVideoUrl,
  deleteVoiceOverview,
  deleteVideoOverview,
  testRemotionVideo,
  generateRemotionVideo,
} from "../controllers/ai.controller.js";

const router = expresss.Router();

router.get("/test-recorder", testRecorder); // TEMP — remove after production testing
router.get("/test-remotion-video", testRemotionVideo); // TEMP — test Remotion pipeline

router.use(protect);

router.post("/generate-flashcards", generateFlashcards);
router.post("/generate-quiz", generateQuiz);
router.post("/generate-summary", generateSummary);
router.post("/generate-notes", generateNotes);
router.post("/chat", aiLimiter, chat);
router.post("/explain-concept", explainConcept);
router.get("/chat-history/:documentId", chatHistory);
router.post("/generate-voice-overview", generateVoiceOverview);
router.post("/generate-podcast", generatePodcast);
router.post("/generate-video", generateVideo);
router.post("/generate-remotion-video", generateRemotionVideo);
router.get("/voice-overview-url/:documentId", getVoiceOverviewUrl);
router.get("/video-overview-url/:documentId", getVideoUrl);
router.delete("/voice-overview/:id", deleteVoiceOverview);
router.delete("/video-overview/:id", deleteVideoOverview);

export default router;
