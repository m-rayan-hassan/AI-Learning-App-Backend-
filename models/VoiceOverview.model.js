import mongoose from "mongoose";

const voiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["voice", "podcast"],
      default: "voice",
    },
    publicId: {
      type: String,
      required: false,
    },
    secureUrl: {
      type: String,
      required: false,
    },
    isGenerated: {
      type: Boolean,
      required: true,
      default: false,
    },
    generationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
    },
  },
  {
    timestamps: true,
  },
);

voiceSchema.index({ userId: 1, documentId: 1 });

const VoiceOverview = mongoose.model("VoiceOverview", voiceSchema);

export default VoiceOverview;
