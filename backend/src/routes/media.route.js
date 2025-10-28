import express from "express";
import cloudinary from "../lib/cloudinary.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Upload image API - sẽ trả về URL sau khi upload
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
      });
    }

    res.status(200).json({
      fileUrl: uploadResponse.secure_url,
      resourceType: uploadResponse.resource_type,
      success: true,
    });
  } catch (error) {
    console.log("Error in file upload:", error.message);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

export default router;
