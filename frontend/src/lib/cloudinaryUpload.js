/**
 * Cloudinary Direct Upload Utility
 * Upload files directly to Cloudinary from frontend (nhanh hơn nhiều so với base64)
 */

import { axiosInstance } from "./axios.js";

/**
 * Upload file directly to Cloudinary
 * @param {File} file - File to upload
 * @param {string} type - 'image' | 'video' | 'audio' | 'file'
 * @param {Function} onProgress - Progress callback (percent: number) => void (không dùng nữa)
 * @returns {Promise<string>} - Secure URL of uploaded file
 */
export const uploadToCloudinary = async (file, type = "auto", onProgress) => {
  try {
    // Get upload signature from backend
    const folder = type === "video" 
      ? "chat_app_videos" 
      : type === "image"
      ? "chat_app_images"
      : type === "audio"
      ? "chat_app_audio"
      : "chat_app_files";

    const resource_type = type === "video" 
      ? "video" 
      : type === "image"
      ? "image"
      : "auto";

    const signatureRes = await axiosInstance.post("/images/upload-signature", {
      folder,
      resource_type,
    });

    const { signature, timestamp, cloud_name, api_key, timeout, chunk_size } = signatureRes.data;

    // Create FormData for direct upload
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", api_key);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    if (resource_type !== "auto") {
      formData.append("resource_type", resource_type);
    }
    
    // Add optimization parameters for video
    // IMPORTANT: All params added here must be included in backend signature
    if (type === "video") {
      if (timeout) formData.append("timeout", timeout);
      if (chunk_size) formData.append("chunk_size", chunk_size);
      // Bỏ async parameter vì không được include trong signature
    }

    // Upload directly to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resource_type}/upload`;

    const isVideo = type === "video";
    const fileSizeMB = file.size / (1024 * 1024);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set timeout for large files (20 minutes for videos > 50MB)
      if (isVideo && fileSizeMB > 50) {
        xhr.timeout = 20 * 60 * 1000; // 20 minutes
      } else if (isVideo) {
        xhr.timeout = 10 * 60 * 1000; // 10 minutes
      } else {
        xhr.timeout = 5 * 60 * 1000; // 5 minutes for other files
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } catch (error) {
            reject(new Error("Failed to parse upload response"));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error?.message || "Upload failed"));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload. Please check your connection and try again."));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout. The file is taking too long to upload. Please try again or use a smaller file."));
      });

      xhr.open("POST", uploadUrl, true);
      xhr.send(formData);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};
