import express from "express";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  // Handle errors
  onError: (err, next) => {
    console.error("Multer error:", err);
    next(err);
  },
});

// Handle OPTIONS request for CORS preflight
router.options("/upload-direct", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Fast direct file upload endpoint - accepts FormData (much faster than base64)
// Multer error handler
const uploadSingle = upload.single("file");
const uploadWithErrorHandling = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Multer upload error:", err);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File size too large. Maximum allowed is 100MB." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    next();
  });
};

router.post("/upload-direct", protectRoute, uploadWithErrorHandling, async (req, res) => {
  try {
    // Handle file missing
    if (!req.file) {
      console.error("Upload error: No file in request");
      return res.status(400).json({ error: "No file provided" });
    }

    console.log(`📤 Upload request: ${req.file.originalname} (${(req.file.size / (1024 * 1024)).toFixed(2)}MB), type: ${req.file.mimetype}`);

    const { type = "video" } = req.body; // 'video', 'image', 'file'

    // Validate file size
    const maxSizes = {
      image: 10 * 1024 * 1024,  // 10MB
      video: 100 * 1024 * 1024, // 100MB
      file: 50 * 1024 * 1024,   // 50MB
    };

    if (req.file.size > maxSizes[type] || req.file.size > maxSizes.video) {
      return res.status(413).json({ 
        error: `File size too large. Maximum allowed: ${(maxSizes[type] || maxSizes.video) / (1024 * 1024)}MB` 
      });
    }

    console.log("📤 Starting Cloudinary upload...");
    console.time("⏱️ Cloudinary upload time");
    
    // Convert buffer to base64 for Cloudinary (or use stream if possible)
    const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const uploadOptions = {
      folder: type === "video" ? "chat_app_videos" : type === "image" ? "chat_app_images" : "chat_app_files",
      resource_type: type === "video" ? "video" : "auto",
      timeout: 600000, // 10 minutes
      chunk_size: 6000000, // 6MB chunks
    };

    if (type === "video") {
      uploadOptions.eager = [{ quality: "auto", fetch_format: "auto" }];
    }

    const uploadResponse = await cloudinary.uploader.upload(base64File, uploadOptions);
    console.timeEnd("⏱️ Cloudinary upload time");
    console.log(`✅ Upload successful: ${uploadResponse.secure_url}`);

    res.status(200).json({
      fileUrl: uploadResponse.secure_url,
      resourceType: uploadResponse.resource_type,
      success: true,
    });
  } catch (error) {
    console.error("❌ Direct upload error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      http_code: error.http_code,
      stack: error.stack,
    });
    
    // Ensure response hasn't been sent
    if (res.headersSent) {
      console.error("Response already sent, cannot send error response");
      return;
    }
    
    if (error.message?.includes("Invalid")) {
      res.status(400).json({ error: "Invalid file format" });
    } else if (error.message?.includes("File size too large") || error.http_code === 413) {
      res.status(413).json({ error: "File too large" });
    } else if (error.message?.includes("timeout") || error.http_code === 504) {
      res.status(408).json({ error: "Upload timeout" });
    } else {
      res.status(500).json({ 
        error: "Failed to upload file",
        message: process.env.NODE_ENV === "development" ? error.message : "Upload failed. Please try again.",
      });
    }
  }
});

// Upload media API - xử lý cả ảnh và video (base64 - slower, kept for backward compatibility)
router.post("/upload", protectRoute, async (req, res) => {
  try {
    const { image, video } = req.body;

    if (!image && !video) {
      return res.status(400).json({ error: "No file provided" });
    }

    let uploadResponse;

    if (image) {
      uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_app_images",
        resource_type: "image",
        quality: "auto:good",
      });
    }

    if (video) {
      uploadResponse = await cloudinary.uploader.upload(video, {
        folder: "chat_app_videos",
        resource_type: "video",
        quality: "auto:good",
        timeout: 600000, // 10 minutes
        chunk_size: 6000000, // 6MB chunks
      });
    }

    res.status(200).json({
      fileUrl: uploadResponse.secure_url,
      resourceType: uploadResponse.resource_type,
      success: true,
    });
  } catch (error) {

    // Return more specific error messages
    if (error.message?.includes("Invalid image file")) {
      res.status(400).json({ error: "Invalid file format" });
    } else if (error.message?.includes("File size too large")) {
      res.status(413).json({ error: "File too large" });
    } else if (error.message?.includes("timeout")) {
      res.status(408).json({ error: "Upload timeout" });
    } else {
      res.status(500).json({ error: "Failed to upload file" });
    }
  }
});

export default router;
