import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  subscribe,
  getSubscription,
  cancelSubscription,
  previewUpgrade,
  confirmUpgrade,
} from "../controllers/payment.controller.js";
import { checkout, lsWebhook } from "../controllers/lemonsqueezy.controller.js";

const router = express.Router();

router.post("/ls", lsWebhook)
// All payment routes require authentication
router.use(protect);

router.post("/ls/checkout", checkout);
router.get("/subscription", getSubscription);
router.post("/subscribe", subscribe);
router.post("/preview-upgrade", previewUpgrade);
router.post("/confirm-upgrade", confirmUpgrade);
router.post("/cancel", cancelSubscription);

export default router;