import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  subscribe,
  getSubscription,
  cancelSubscription,
  previewUpgrade,
  confirmUpgrade,
} from "../controllers/payment.controller.js";

const router = express.Router();

// All payment routes require authentication
router.use(protect);

router.get("/subscription", getSubscription);
router.post("/subscribe", subscribe);
router.post("/preview-upgrade", previewUpgrade);
router.post("/confirm-upgrade", confirmUpgrade);
router.post("/cancel", cancelSubscription);

export default router;