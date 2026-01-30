import expresss from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  chatHistory,
  generateVoiceOverview,
  generatePodcast,
} from "../controllers/ai.controller.js";
const router = expresss.Router();

router.use(protect);

router.post("/generate-flashcards", generateFlashcards);
router.post("/generate-quiz", generateQuiz);
router.post("/generate-summary", generateSummary);
router.post("/chat", chat);
router.post("/explain-concept", explainConcept);
router.get("/chat-history/:documentId", chatHistory);
router.post("/generate-voice-overview", generateVoiceOverview);
router.post("/generate-podcast", generatePodcast);
export default router;
