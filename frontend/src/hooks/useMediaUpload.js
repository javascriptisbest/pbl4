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
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

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
  const [uploadPercent, setUploadPercent] = useState(0);

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
   * Flow:
   * 1. Validate file type và size (100MB limit)
   * 2. Upload trực tiếp lên Cloudinary (nhanh hơn nhiều!)
   * 3. Lấy metadata và preview URL
   * 4. Set preview
   */
  const handleVideoSelect = async (file) => {
    if (!file || !file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }

    // Validate size (100MB limit - đảm bảo đủ lớn cho video chất lượng cao)
    const videoValidation = validateVideoSize(file, 100);
    if (!videoValidation.isValid) {
      toast.error(videoValidation.message);
      return;
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const isLargeFile = file.size > 10 * 1024 * 1024; // > 10MB

    setIsUploading(true);
    setUploadPercent(0);
    setUploadProgress(`Đang tải video lên Cloudinary (${fileSizeMB}MB)...`);

    try {
      // Lấy video metadata song song (không block upload)
      const metadataPromise = getVideoMetadata(file);
      
      // Upload trực tiếp lên Cloudinary với progress tracking
      // Nhanh hơn nhiều so với base64 vì upload trực tiếp, không qua backend
      const videoUrl = await uploadToCloudinary(file, "video", (percent) => {
        setUploadPercent(percent);
        setUploadProgress(`Đang tải video lên Cloudinary... ${percent}%`);
      });
      
      // Lấy metadata
      const metadata = await metadataPromise;
      
      // Tạo preview URL từ Cloudinary URL (thêm transformation cho preview)
      // Cloudinary tự động tạo preview URL
      const previewUrl = videoUrl.replace(/\/upload\//, '/upload/w_640,h_360,c_fill,f_auto,q_auto/');
      
      setVideoPreview(previewUrl);
      setVideoMetadata(metadata);
      toast.success(`Video đã tải lên thành công! (${fileSizeMB}MB)`);
    } catch (error) {
      console.error("Video upload error:", error);
      const errorMsg = error.message || "Không thể tải video";
      toast.error(errorMsg.includes("size") 
        ? "Video quá lớn. Vui lòng chọn video nhỏ hơn 100MB." 
        : "Không thể tải video. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setUploadPercent(0);
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

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const isLargeFile = file.size > 5 * 1024 * 1024; // > 5MB

    setIsUploading(true);
    setUploadPercent(0);

    try {
      // For large files, upload directly to Cloudinary (nhanh hơn)
      if (isLargeFile) {
        setUploadProgress(`Đang tải file lên Cloudinary (${fileSizeMB}MB)...`);
        const fileUrl = await uploadToCloudinary(file, "file", (percent) => {
          setUploadPercent(percent);
          setUploadProgress(`Đang tải file lên Cloudinary... ${percent}%`);
        });
        
        setFilePreview(fileUrl);
        setFileMetadata({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          type: file.type,
        });
        toast.success("File đã tải lên thành công!");
      } else {
        // For small files, use base64 (không cần upload)
        setUploadProgress("Đang xử lý file...");
        const base64 = await fileToBase64(file);
        
        setFilePreview(base64);
        setFileMetadata({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + " KB",
          type: file.type,
        });
        toast.success("File sẵn sàng gửi");
      }
    } catch (error) {
      console.error("File processing error:", error);
      toast.error("Không thể xử lý file. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      setUploadPercent(0);
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
    setIsUploading(false);
    setUploadProgress("");
    setUploadPercent(0);
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
    uploadPercent,
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
