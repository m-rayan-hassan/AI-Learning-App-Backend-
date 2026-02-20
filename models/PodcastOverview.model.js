import mongoose from "mongoose";

const podcastSchema = new mongoose.Schema({
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
    required: true,
  },
  secureUrl : {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
}, {
    timestamps: true
});

podcastSchema.index({ userId: 1, documentId: 1 });

const PodcastOverview = mongoose.model("PodcastOverview", podcastSchema);

export default PodcastOverview;