import { v2 as cloudinary } from "cloudinary";

import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Performance optimizations
  secure: true,
  upload_timeout: 120000, // 2 minutes for large files
});

/**
 * Optimized upload function with retry logic
 */
export const uploadWithRetry = async (file, options = {}, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await cloudinary.uploader.upload(file, options);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  throw lastError;
};

export default cloudinary;
