import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
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

videoSchema.index({ userId: 1, documentId: 1 });

const VideoOverview = mongoose.model("VideoOverview", videoSchema);

export default VideoOverview;
