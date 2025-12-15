import express from "express";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import crypto from "crypto";

const router = express.Router();

// Generate upload signature for direct upload from frontend
// This allows direct upload to Cloudinary without sending file through backend
router.post("/upload-signature", protectRoute, async (req, res) => {
  try {
    const { folder, resource_type = "auto" } = req.body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder: folder || "chat_app_uploads",
      resource_type,
    };

    // Optimizations for video uploads
    if (resource_type === "video") {
      // Allow larger timeout for videos
      params.timeout = 1200000; // 20 minutes
      // Enable chunk upload for better performance
      params.chunk_size = 10000000; // 10MB chunks
    }

    // Generate signature using Cloudinary secret
    const paramsString = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(paramsString + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    res.status(200).json({
      signature,
      timestamp,
      folder: params.folder,
      resource_type,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      // Include optimization params for large videos
      ...(resource_type === "video" && {
        timeout: params.timeout,
        chunk_size: params.chunk_size,
      }),
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

// Upload media API - xử lý cả ảnh và video (fallback for small files)
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
