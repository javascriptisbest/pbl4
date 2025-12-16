/**
 * useMediaUpload - Custom React Hook
 *
 * Hook để xử lý upload các loại media (image, video, file, audio)
 * trong MessageInput component
 *
 * Features:
 * - Image: Compress trước khi upload
 * - Video: Validate size và lấy metadata
 * - Audio: Voice recording processing
 * - File: Upload documents/PDFs
 * - Progress tracking
 *
 * Returns:
 * - State: previews, metadata, isUploading, uploadProgress
 * - Actions: handleImageSelect, handleVideoSelect, etc.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { compressImage, fileToBase64 } from "../lib/imageUtils";
import { validateVideoSize, getVideoMetadata } from "../lib/videoUtils";
import { audioToBase64 } from "../lib/voiceUtils";

export const useMediaUpload = () => {
  // Preview states - Base64 strings để preview trong UI
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  // Metadata states - Thông tin về file (size, duration, etc.)
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [audioMetadata, setAudioMetadata] = useState(null);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  /**
   * Xử lý khi user chọn image file
   *
   * Flow:
   * 1. Validate file type
   * 2. Compress image để giảm size
   * 3. Convert sang base64
   * 4. Set preview để hiển thị trong UI
   */
  const handleImageSelect = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    setUploadProgress("Compressing image...");

    try {
      // Compress image trước để giảm bandwidth
      const compressed = await compressImage(file);
      // Convert sang base64 để gửi qua HTTP
      const base64 = await fileToBase64(compressed);
      setImagePreview(base64);
      toast.success("Image ready to send");
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to process image");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  /**
   * Xử lý khi user chọn video file
   * 
   * OPTIMIZED: Upload trực tiếp lên Cloudinary với FormData (nhanh hơn base64 rất nhiều)
   * Flow:
   * 1. Validate file type và size (100MB limit)
   * 2. Lấy metadata (duration, dimensions)
   * 3. Upload trực tiếp lên Cloudinary với FormData
   * 4. Store Cloudinary URL thay vì base64
   */
  const handleVideoSelect = async (file) => {
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Validate size (100MB limit)
    const videoValidation = validateVideoSize(file, 100);
    if (!videoValidation.isValid) {
      toast.error(videoValidation.message);
      return;
    }

    setIsUploading(true);
    setUploadProgress("Processing video...");

    try {
      console.log(`📹 Starting video upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      console.time("⏱️ Video upload total time");
      
      // Lấy video metadata (duration, dimensions, etc.)
      console.time("⏱️ Get video metadata");
      setUploadProgress("Getting video info...");
      const metadata = await getVideoMetadata(file);
      console.timeEnd("⏱️ Get video metadata");
      
      // Upload trực tiếp lên Cloudinary với FormData (nhanh hơn base64 rất nhiều!)
      setUploadProgress(`Uploading video to server... (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");
      
      const { axiosFileInstance } = await import("../lib/axios.js");
      console.time("⏱️ Upload to Cloudinary");
      const response = await axiosFileInstance.post("/images/upload-direct", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(`Uploading: ${percentCompleted}% (${(progressEvent.loaded / (1024 * 1024)).toFixed(1)}MB / ${(progressEvent.total / (1024 * 1024)).toFixed(1)}MB)`);
            
            // Log progress every 25%
            if (percentCompleted % 25 === 0) {
              console.log(`📤 Upload progress: ${percentCompleted}%`);
            }
          }
        },
      });
      console.timeEnd("⏱️ Upload to Cloudinary");
      
      // Store Cloudinary URL instead of base64 (much smaller!)
      setVideoPreview(response.data.fileUrl);
      setVideoMetadata(metadata);
      
      console.timeEnd("⏱️ Video upload total time");
      console.log(`✅ Video uploaded successfully! URL: ${response.data.fileUrl}`);
      
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.timeEnd("⏱️ Video upload total time");
      console.error("❌ Video processing error:", error);
      
      if (error.message?.includes("memory") || error.message?.includes("too large")) {
        toast.error("Video file is too large to process. Please use a smaller video file.");
      } else if (error.response?.status === 413) {
        toast.error(error.response?.data?.error || "File size too large. Maximum allowed is 100MB.");
      } else {
        toast.error(`Failed to upload video: ${error.response?.data?.error || error.message || "Unknown error"}`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB (matching backend limit)
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File size is ${fileSizeMB}MB. Maximum allowed size is 50MB. Please use a smaller file.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress("Uploading file...");

    try {
      console.log(`📎 Starting file upload: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      console.time("⏱️ File upload total time");
      
      // Upload trực tiếp lên Cloudinary với FormData (nhanh hơn base64)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "file");
      
      const { axiosFileInstance } = await import("../lib/axios.js");
      console.time("⏱️ Upload to Cloudinary");
      const response = await axiosFileInstance.post("/images/upload-direct", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(`Uploading: ${percentCompleted}%`);
            
            // Log progress every 25%
            if (percentCompleted % 25 === 0) {
              console.log(`📤 Upload progress: ${percentCompleted}%`);
            }
          }
        },
      });
      console.timeEnd("⏱️ Upload to Cloudinary");
      
      // Store Cloudinary URL instead of base64
      setFilePreview(response.data.fileUrl);
      setFileMetadata({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
      });
      
      console.timeEnd("⏱️ File upload total time");
      console.log(`✅ File uploaded successfully! URL: ${response.data.fileUrl}`);
      
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.timeEnd("⏱️ File upload total time");
      console.error("❌ File processing error:", error);
      
      if (error.response?.status === 413) {
        toast.error(error.response?.data?.error || "File size too large. Maximum allowed is 50MB.");
      } else {
        toast.error(`Failed to upload file: ${error.response?.data?.error || error.message || "Unknown error"}`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleAudioData = async (audioBlob, duration) => {
    setIsUploading(true);
    setUploadProgress("Processing voice message...");

    try {
      const base64 = await audioToBase64(audioBlob);
      setAudioPreview(base64);
      setAudioMetadata({ duration });
      toast.success("Voice message ready");
    } catch (error) {
      console.error("Audio processing error:", error);
      toast.error("Failed to process audio");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const clearAll = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setFilePreview(null);
    setAudioPreview(null);
    setVideoMetadata(null);
    setFileMetadata(null);
    setAudioMetadata(null);
  };

  const removeImage = () => setImagePreview(null);
  const removeVideo = () => {
    setVideoPreview(null);
    setVideoMetadata(null);
  };
  const removeFile = () => {
    setFilePreview(null);
    setFileMetadata(null);
  };
  const removeAudio = () => {
    setAudioPreview(null);
    setAudioMetadata(null);
  };

  return {
    imagePreview,
    videoPreview,
    filePreview,
    audioPreview,
    videoMetadata,
    fileMetadata,
    audioMetadata,
    isUploading,
    uploadProgress,
    handleImageSelect,
    handleVideoSelect,
    handleFileSelect,
    handleAudioData,
    removeImage,
    removeVideo,
    removeFile,
    removeAudio,
    clearAll,
  };
};
