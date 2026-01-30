import Document from "../models/Document.model.js";
import { uploadMedia } from "../config/cloudinary.js";
import { convertToPdf } from "../utils/converter.js";
import fs from "fs";
import path from "path";

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
    const originalUpload = await uploadMedia(filePath, "ai-learning-app/documents/original");

    // Upload PDF to Cloudinary (if converted, or if it was already PDF)
    // If it was already PDF, originalUpload is the PDF upload.
    let pdfUrl = originalUpload.secure_url;
    let pdfFilePublicId = "";
    if (isConverted) {
      console.log(`Uploading converted PDF to Cloudinary...`);
      const pdfUpload = await uploadMedia(pdfPath, "ai-learning-app/documents/pdf");

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

// Get Document Content Proxy
export const getDocumentContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Verify ownership
    if (document.userId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this document" });
    }

    // Use pdfUrl as the source
    const fileUrl = document.pdfUrl || document.originalUrl;
    if (!fileUrl) {
      return res.status(404).json({ message: "Document file URL not found" });
    }

    try {
      // Fetch the file from Cloudinary (or wherever it is stored)
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      // Get content type from Cloudinary response
      const contentType =
        response.headers.get("content-type") || "application/pdf";

      // Set appropriate headers
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");

      // Check if it's a download request
      if (req.query.type === "download") {
        const fileName = document.fileName.replace(/\.[^/.]+$/, "") + ".pdf";
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`,
        );
      } else {
        res.setHeader("Content-Disposition", "inline");
      }

      // Stream the data for better performance
      const buffer = await response.arrayBuffer();
      const nodeBuffer = Buffer.from(buffer);
      res.send(nodeBuffer);

      // Update last accessed
      document.lastAccessed = new Date();
      await document.save();
    } catch (fetchError) {
      console.error("Error fetching from Cloudinary:", fetchError);
      // Try fallback - return Cloudinary URL for client-side fetch
      return res.status(200).json({
        success: false,
        message: "Streaming failed, use direct URL",
        directUrl: fileUrl,
      });
    }
  } catch (error) {
    console.error("Error serving document content:", error);
    res.status(500).json({
      message: "Error serving document content",
      error: error.message,
    });
  }
};
// Get all documents for a user
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    const documents = await Document.find({ userId })
      .sort({ uploadDate: -1 })
      .select("-chunks -extractedText"); // Exclude large fields for list view

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching documents",
    });
  }
};

// Get a specific document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

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
        message: "Not authorized to access this document",
      });
    }

    // Update last accessed time
    document.lastAccessed = new Date();
    await document.save();

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching document",
    });
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
    console.error("Error updating document:", error);
    res.status(500).json({
      success: false,
      message: "Error updating document",
    });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

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
        message: "Not authorized to delete this document",
      });
    }

    // Delete from Cloudinary if URLs exist
    try {
      if (document.originalUrl) {
        const publicId = document.originalUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`documents/original/${publicId}`);
      }
      if (document.pdfUrl && document.pdfUrl !== document.originalUrl) {
        const publicId = document.pdfUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`documents/pdf/${publicId}`);
      }
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await Document.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting document",
    });
  }
};
