import Document from "../models/Document.model.js";
import Flashcard from "../models/Flashcard.model.js";
import Quiz from "../models/Quiz.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import {
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../config/cloudinary.js";
import { convertToPdf } from "../utils/converter.js";
import fs from "fs";
import mongoose from "mongoose";
import { deleteMedia } from "../config/cloudinary.js";
import { getFileInfo } from "../utils/getFileInfo.js";
import * as aiFunctionalities from "../utils/aiFunctionalities.js";
import VoiceOverview from "../models/VoiceOverview.model.js";
import VideoOverview from "../models/VideoOverview.model.js";
import User from "../models/User.model.js";
import { userPlans } from "../utils/planFeaturesAndLimit.js";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { textSplitter, embeddings } from "../utils/aiFunctionalities.js";
import { client } from "../config/llamaConfig.js";

// Upload Document Controller
export const uploadDocument = async (req, res) => {
  const startTime = Date.now();
  console.log("--- Document Upload Started ---");
  try {
    if (!req.file) {
      console.log("Upload failed: No file provided");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title } = req.body;
    const userId = req.user._id; // Assumes auth middleware populates req.user
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    let pdfPath = filePath;
    let isConverted = false;

    if (!title) {
      console.log("Upload failed: Title missing");
      return res.status(400).json({
        success: false,
        message: "Document title is required",
        statusCode: 400,
      });
    }

    const user = await User.findOne({ _id: userId });
    const userDocumentCount = user.quotas.document.count;
    const userPlan = user.planType;

    console.log("user: ", user);
    console.log("user document count: ", userDocumentCount);
    console.log("userPlan: ", userPlan);

    if (
      userDocumentCount >= userPlans[userPlan].docs &&
      new Date() < user.quotas.document.resetDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Document uplaod limit reatched. Upgrade to upload",
        statusCode: 400,
      });
    }
    console.log(`Processing file: ${originalName}, Title: ${title}`);

    // Check if conversion is needed
    if (mimeType !== "application/pdf") {
      try {
        console.log(`Converting ${originalName} to PDF...`);
        pdfPath = await convertToPdf(filePath);
        isConverted = true;
      } catch (error) {
        console.error("Conversion error:", error);
        // Clean up original file if conversion fails
        fs.unlinkSync(filePath);
        return res
          .status(500)
          .json({ message: "File conversion failed", error: error.message });
      }
    }

    const filePages = await getFileInfo(pdfPath);
    console.log(`File info retrieved: ${filePages} pages`);

    if (filePages > 500) {
      console.log("Upload failed: File too large (>500 pages)");
      return res.status(400).json({
        success: false,
        message: "Document with pages greater than 500 can not be uploaded",
        statusCode: 400,
      });
    }

    // Upload Original File to Cloudinary
    console.log(`Uploading original file to Cloudinary...`);
    const originalUpload = await uploadMedia(
      filePath,
      "ai-learning-app/documents/original",
    );

    // Upload PDF to Cloudinary (if converted, or if it was already PDF)
    // If it was already PDF, originalUpload is the PDF upload.
    let pdfUrl = originalUpload.secure_url;
    let pdfFilePublicId = "";

    console.log(`Uploading converted PDF to Cloudinary...`);
    const pdfUpload = await uploadMedia(
      pdfPath,
      "ai-learning-app/documents/pdf",
    );

    // IMPORTANT: Ensure you use .secure_url, not .url (for HTTPS)
    pdfUrl = pdfUpload.secure_url;
    pdfFilePublicId = pdfUpload.public_id;
    console.log("PDF Public id", pdfFilePublicId);

    console.log("PDF URL: ", pdfUrl);

    // cleanup local files
    // try {
    //   if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    //   if (isConverted && pdfPath && fs.existsSync(pdfPath))
    //     fs.unlinkSync(pdfPath);
    // } catch (cleanupError) {
    //   console.error("Cleanup error:", cleanupError);
    // }

    // Save to Database initially as processing
    const newDocument = new Document({
      userId,
      title: title || originalName,
      fileName: originalName,
      filePath: pdfUrl,
      fileSize: req.file.size,
      extractedText: pdfUrl, // Will be updated later
      fileType: mimeType,
      originalUrl: originalUpload.secure_url,
      pdfUrl: pdfUrl,
      originalFilePublicId: originalUpload.public_id,
      pdfFilePublicId: pdfFilePublicId,
      status: "processing",
    });

    await newDocument.save();
    const duration = (Date.now() - startTime) / 1000;
    console.log(
      `--- Document Upload request finished in ${duration}s, continuing processing in background ---`,
    );

    res.status(201).json({
      success: true,
      message:
        "Document uploaded successfully. AI is now analyzing and extracting content.",
      data: newDocument,
    });

    // Run AI extraction in the background
    (async () => {
      try {
        console.log(
          `2. Document uploaded (ID: ${newDocument._id}). Starting Agentic Parsing...`,
        );

        const file = await client.files.create({
          file: fs.createReadStream(req.file.path),
          purpose: "parse", // Specifies we want to parse it, not just store it
        });

        const result = await client.parsing.parse({
          file_id: file.id,
          tier: "agentic", // 'agentic' is their newest premium mode (perfect for math/images)
          version: "latest",
          expand: ["markdown"], // Tells it to return the markdown layout
        });

        console.log("3. Parsing complete! Combining pages...");

        console.log(
          `Starting background Gemini extraction for document ${newDocument._id}...`,
        );

        // const getExtractedContent =
        //   await aiFunctionalities.getExtractedContent(pdfUrl);
        // console.log(
        //   `Gemini extraction complete for document ${newDocument._id}.`,
        // );

        if (!result.markdown || !result.markdown.pages) {
          throw new Error("No markdown returned from LlamaCloud");
        }

        const fullMarkdown = result.markdown.pages
          .map((page) => page.markdown)
          .join("\n\n---\n\n"); // Adds a visual break between pages, good for AI context

        console.log(
          "4. Document Parsed Successfully. Math and Layout Preserved.",
        );

        await Document.findByIdAndUpdate(newDocument._id, {
          extractedText: fullMarkdown,
          status: "ready",
        });

        const docIdString = String(newDocument._id);

        const docsToSave = await textSplitter.createDocuments(
          [fullMarkdown],
          [{ documentId: docIdString }],
        );

        const chunkCollection =
          mongoose.connection.db.collection("document_chunks");

        await MongoDBAtlasVectorSearch.fromDocuments(docsToSave, embeddings, {
          collection: chunkCollection,
          indexName: "vector_index", // Must match the name in MongoDB Atlas UI
          textKey: "text",
          embeddingKey: "embedding",
        });

        console.log(
          `Document ${newDocument._id} successfully updated to 'ready' status.`,
        );
        await user.incrementQuota("document");
        console.log("user document count: ", user.quotas.document.count);
      } catch (extractionError) {
        console.error(
          `Background extraction error for document ${newDocument._id}:`,
          extractionError,
        );
        await Document.findByIdAndUpdate(newDocument._id, {
          status: "failed",
        });
      } finally {
        try {
          if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (isConverted && pdfPath && fs.existsSync(pdfPath))
            fs.unlinkSync(pdfPath);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    })();
  } catch (error) {
    console.error("Upload controller error:", error);
    // Attempt cleanup if error occurred before final cleanup
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path))
        fs.unlinkSync(req.file.path);
    } catch (e) {}

    res.status(500).json({
      success: false,
      message: "Server error during document upload",
      error: error.message,
    });
  }
};

// Get all documents for a user
export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "flashcards",
          localField: "_id",
          foreignField: "documentId",
          as: "flashcardSets",
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "documentId",
          as: "quizzes",
        },
      },
      {
        $addFields: {
          flashcardCount: { $size: "$flashcardSets" },
          quizCount: { $size: "$quizzes" },
        },
      },
      {
        $project: {
          flashcardSets: 0,
          quizzes: 0,
        },
      },
      {
        $sort: { uploadDate: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// Get a specific document by ID
export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404,
      });
    }

    const flashcardCount = await Flashcard.countDocuments({
      documentId: document._id,
      userId: req.user._id,
    });
    const quizCount = await Quiz.countDocuments({
      documents: document._id,
      userId: req.user._id,
    });

    document.lastAccessed = Date.now();
    await document.save();

    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData,
    });
  } catch (error) {
    next(error);
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, summary } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Verify ownership
    if (document.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this document",
      });
    }

    // Update fields
    if (title) document.title = title;
    if (summary) document.summary = summary;

    await document.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    const voicePublicId = await VoiceOverview.findOne({
      documentId: document._id,
      userId: req.user._id,
    }).select("publicId");

    const videoPublicId = await VideoOverview.findOne({
      documentId: document._id,
      userId: req.user._id,
    }).select("publicId");

    await deleteMedia(document.originalFilePublicId);
    await deleteMedia(document.pdfFilePublicId);

    if (voicePublicId) {
      await deleteVideoFromCloudinary(voicePublicId);
    }
    if (videoPublicId) {
      await deleteVideoFromCloudinary(videoPublicId);
    }
    await Flashcard.deleteMany({ documentId: document._id });
    await Quiz.deleteMany({ documentId: document._id });
    await ChatHistory.deleteMany({ documentId: document._id });
    await VoiceOverview.deleteOne({ documentId: document._id });
    await VideoOverview.deleteOne({ documentId: document._id });

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
