import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
  },
  eventName: {
    type: String,
    required: true,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

const WebhookEventLS = mongoose.model("WebhookEventLS", webhookEventSchema);
export default WebhookEventLS;
