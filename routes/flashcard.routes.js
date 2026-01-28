import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  getFlashcards,
  getAllFlashcardSets,
  reviewFlashcard,
  toggleFlashcard,
  deleteFlashcardSet,
} from "../controllers/flashcard.controller.js";

const router = express.Router();

router.use(protect);

router.get("/:documentId", getFlashcards);
router.get("/", getAllFlashcardSets);
router.post("/:cardId/review", reviewFlashcard);
router.put("/:cardId/star", toggleFlashcard);
router.delete("/:id", deleteFlashcardSet);

export default router;
