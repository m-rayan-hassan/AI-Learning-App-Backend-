import expresss from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiter.js"
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  chatHistory,
  generateVoiceOverview,
  generatePodcast,
  generateVideo,
  testRecorder,
  getVoiceOverviewUrl,
  getVideoUrl,
} from "../controllers/ai.controller.js";

const router = expresss.Router();

router.get("/test-recorder", testRecorder); // TEMP — remove after production testing

router.use(protect);

router.post("/generate-flashcards", generateFlashcards);
router.post("/generate-quiz", generateQuiz);
router.post("/generate-summary", generateSummary);
router.post("/chat", aiLimiter, chat);
router.post("/explain-concept", explainConcept);
router.get("/chat-history/:documentId", chatHistory);
router.post("/generate-voice-overview", generateVoiceOverview);
router.post("/generate-podcast", generatePodcast);
router.post("/generate-video", generateVideo);
router.get("/voice-overview-url/:documentId", getVoiceOverviewUrl);
router.get("/video-overview-url/:documentId", getVideoUrl);

export default router;
