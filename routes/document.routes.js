import express from "express";
import {
  uploadDocument,
  getDocumentContent,
  getDocuments,
  getDocumentById,
  deleteDocument,
  updateDocument,
} from "../controllers/document.controller.js";
import upload from "../utils/multer.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/content", getDocumentContent);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;
