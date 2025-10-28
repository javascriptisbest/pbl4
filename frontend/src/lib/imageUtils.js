/**
 * Image & Media Utils
 * 
 * Utility functions để xử lý images, videos và files
 * trước khi upload lên server (Cloudinary)
 * 
 * Features:
 * - Compress images để giảm bandwidth
 * - Convert file sang base64 để gửi qua HTTP
 * - Upload media lên server
 */

import imageCompression from "browser-image-compression";
import { axiosInstance } from "./axios";

/**
 * Compress image file để giảm kích thước
 * 
 * Tại sao cần compress:
 * - Giảm bandwidth khi upload
 * - Tăng tốc độ load ảnh
 * - Tiết kiệm storage trên cloud
 * 
 * @param {File} imageFile - Image file cần compress
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (imageFile, options = {}) => {
  try {
    const defaultOptions = {
      maxSizeMB: 1, // Kích thước tối đa 1MB
      maxWidthOrHeight: 1024, // Chiều rộng/cao tối đa 1024px
      useWebWorker: true, // Dùng Web Worker để không block UI thread
      initialQuality: 0.8, // Chất lượng ảnh 80%
    };

    // Merge default options với custom options
    const compressionOptions = { ...defaultOptions, ...options };

    // Compress ảnh bằng browser-image-compression library
    const compressedFile = await imageCompression(
      imageFile,
      compressionOptions
    );

    console.log("Original file size:", imageFile.size / 1024 / 1024, "MB");
    console.log(
      "Compressed file size:",
      compressedFile.size / 1024 / 1024,
      "MB"
    );

    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original file nếu compress fail
    return imageFile;
  }
};

/**
 * Convert File object sang base64 string
 * 
 * Tại sao dùng base64:
 * - Dễ gửi qua HTTP JSON payload
 * - Không cần multipart/form-data
 * - Backend có thể upload trực tiếp lên Cloudinary
 * 
 * @param {File} file - File cần convert
 * @returns {Promise<string>} - Base64 data URL
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file); // Read file as Data URL (base64)
  });
};

/**
 * Uploads an image to the server
 * @param {string} base64Image - The base64-encoded image
 * @returns {Promise<string>} - A promise that resolves to the image URL
 */
export const uploadImage = async (base64Image) => {
  try {
    const response = await axiosInstance.post("/images/upload", {
      image: base64Image,
    });
    return response.data.fileUrl || response.data.imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Uploads a video to the server
 * @param {string} base64Video - The base64-encoded video
 * @returns {Promise<string>} - A promise that resolves to the video URL
 */
export const uploadVideo = async (base64Video) => {
  try {
    console.log(
      "Uploading video, size:",
      Math.round(base64Video.length / 1024),
      "KB"
    );

    const response = await axiosInstance.post("/images/upload", {
      video: base64Video,
    });

    console.log("Video upload response:", response.data);
    return response.data.fileUrl;
  } catch (error) {
    console.error("Error uploading video:", error);

    // Log more detailed error info
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    throw error;
  }
};
