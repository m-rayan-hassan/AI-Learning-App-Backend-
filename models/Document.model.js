import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a document title"],
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    originalUrl: {
      type: String,
    },
    pdfUrl: {
      type: String,
    },
    originalFilePublicId: {
      type: String,
      required: true,
    },
    pdfFilePublicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    extractedText: {
      type: String,
      required: true,
      default: "",
    },
    voiceOverviewUrl: {
      type: String,
    },
    podcastUrl: {
      type: String,
    },
    videoUrl: {
      type: String
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({ userId: 1, uploadDate: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;
