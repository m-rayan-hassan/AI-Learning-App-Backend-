import Document from "../models/Document.model.js";
import Flashcard from "../models/Flashcard.model.js";
import Quiz from "../models/Quiz.model.js";
import { uploadMedia } from "../config/cloudinary.js";
import { convertToPdf } from "../utils/converter.js";
import fs from "fs";
import mongoose from "mongoose";
import { deleteMedia } from "../config/cloudinary.js";

// Upload Document Controller
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title } = req.body;
    const userId = req.user._id; // Assumes auth middleware populates req.user
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    let pdfPath = filePath;
    let isConverted = false;

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
    if (isConverted) {
      console.log(`Uploading converted PDF to Cloudinary...`);
      const pdfUpload = await uploadMedia(
        pdfPath,
        "ai-learning-app/documents/pdf",
      );

      // IMPORTANT: Ensure you use .secure_url, not .url (for HTTPS)
      pdfUrl = pdfUpload.secure_url;
      pdfFilePublicId = pdfUpload.public_id;
      console.log("PDF URL: ", pdfUrl);
    }

    // cleanup local files
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (isConverted && pdfPath && fs.existsSync(pdfPath))
        fs.unlinkSync(pdfPath);
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    // Save to Database
    const newDocument = new Document({
      userId,
      title: title || originalName,
      fileName: originalName,
      filePath: pdfUrl,
      fileSize: req.file.size,
      fileType: mimeType,
      originalUrl: originalUpload.secure_url,
      pdfUrl: pdfUrl,
      originalFilePublicId: originalUpload.public_id,
      pdfFilePublicId: pdfFilePublicId,
      status: "ready",
    });

    await newDocument.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded and processed successfully",
      data: newDocument,
    });
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
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
        statusCode: 404
      });
    }

    const flashcardCount = await Flashcard.countDocuments({documentId: document._id, userId: req.user._id});
    const quizCount = await Quiz.countDocuments({documents: document._id, userId: req.user._id});

    document.lastAccessed = Date.now();
    await document.save();

    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData      
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
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        statusCode: 404
      });
    }

    await deleteMedia(document.originalFilePublicId);
    await deleteMedia(document.pdfFilePublicId);

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
