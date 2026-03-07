import mongoose from "mongoose";

const voiceSchema = new mongoose.Schema({
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
    default: "voice"
  },
  publicId: {
    type: String,
    required: true,
  },
  secureUrl : {
    type: String,
    required: true
  },
}, {
    timestamps: true
});

voiceSchema.index({ userId: 1, documentId: 1 });

const VoiceOverview = mongoose.model("VoiceOverview", voiceSchema);

export default VoiceOverview;