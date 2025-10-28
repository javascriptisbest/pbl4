import express from "express";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Upload media API - xử lý cả ảnh và video
router.post("/upload", protectRoute, async (req, res) => {
  try {
    const { image, video } = req.body;

    if (!image && !video) {
      return res.status(400).json({ error: "No file provided" });
    }

    let uploadResponse;

    if (image) {
      console.log("Uploading image to Cloudinary...");
      uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_app_images",
        resource_type: "image",
        quality: "auto:good",
      });
    }

    if (video) {
      console.log("Uploading video to Cloudinary...");
      uploadResponse = await cloudinary.uploader.upload(video, {
        folder: "chat_app_videos",
        resource_type: "video",
        quality: "auto:good",
        timeout: 600000, // 10 minutes
        chunk_size: 6000000, // 6MB chunks
      });
    }

    console.log("Upload successful:", uploadResponse.secure_url);

    res.status(200).json({
      fileUrl: uploadResponse.secure_url,
      resourceType: uploadResponse.resource_type,
      success: true,
    });
  } catch (error) {
    console.log("Error in media upload:", error.message);
    console.log("Full error:", error);

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
