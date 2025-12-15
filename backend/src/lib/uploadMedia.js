import cloudinary from "./cloudinary.js";

/**
 * File size limits (in bytes)
 * Base64 encoding increases size by ~33%, so we account for that
 */
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10MB original = ~13.3MB base64
  video: 100 * 1024 * 1024,     // 100MB original = ~133MB base64 (tối đa)
  audio: 50 * 1024 * 1024,      // 50MB original = ~66.5MB base64
  file: 50 * 1024 * 1024,       // 50MB original = ~66.5MB base64
};

/**
 * Calculate approximate original file size from base64 string
 * Base64 size ≈ original_size * 4/3
 */
function estimateOriginalSize(base64String) {
  // Remove data URL prefix (data:type/subtype;base64,)
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  // Calculate original size: base64_size * 3/4
  return Math.floor((base64Data.length * 3) / 4);
}

/**
 * Upload media to Cloudinary
 * @param {string} media - Base64 encoded media
 * @param {string} type - 'image' | 'video' | 'audio' | 'file'
 * @returns {Promise<string>} - Secure URL
 */
export const uploadMedia = async (media, type) => {
  if (!media) return null;

  const configs = {
    image: {
      folder: "chat_app_images",
      resource_type: "image",
    },
    video: {
      folder: "chat_app_videos",
      resource_type: "video",
      timeout: 600000, // 10 minutes
      chunk_size: 6000000, // 6MB chunks
      eager: [{ quality: "auto", fetch_format: "auto" }],
    },
    audio: {
      folder: "chat_app_audio",
      resource_type: "video",
      timeout: 300000, // 5 minutes
      eager: [{ quality: "auto", fetch_format: "auto" }],
    },
    file: {
      folder: "chat_app_files",
      resource_type: "auto",
      timeout: 600000, // 10 minutes
      chunk_size: 6000000, // 6MB chunks
    },
  };

  const config = configs[type];
  if (!config) {
    throw new Error(`Invalid media type: ${type}`);
  }

  // Validate file size before upload
  const estimatedSize = estimateOriginalSize(media);
  const sizeLimit = FILE_SIZE_LIMITS[type];
  
  if (estimatedSize > sizeLimit) {
    const sizeMB = (estimatedSize / (1024 * 1024)).toFixed(2);
    const limitMB = (sizeLimit / (1024 * 1024)).toFixed(0);
    
    if (type === "video") {
      throw new Error(`File size too large: Video file is ${sizeMB}MB. Maximum allowed size is ${limitMB}MB. Please compress or use a smaller file.`);
    } else if (type === "file") {
      throw new Error(`File size too large: File is ${sizeMB}MB. Maximum allowed size is ${limitMB}MB. Please use a smaller file.`);
    } else {
      throw new Error(`File size too large: ${type} file is ${sizeMB}MB. Maximum allowed size is ${limitMB}MB.`);
    }
  }

  // Validate format
  if (type === "video" && !media.startsWith("data:video/")) {
    throw new Error("Invalid video format. Please use MP4, AVI, MOV, or other supported video formats.");
  }
  if (type === "audio" && !media.startsWith("data:audio/")) {
    throw new Error("Invalid audio format. Please use MP3, WAV, or other supported audio formats.");
  }
  if (type === "image" && !media.startsWith("data:image/")) {
    throw new Error("Invalid image format. Please use JPEG, PNG, GIF, or other supported image formats.");
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(media, config);
    return uploadResponse.secure_url;
  } catch (cloudinaryError) {
    console.error("Cloudinary upload error:", cloudinaryError);
    
    // Handle specific Cloudinary errors
    if (cloudinaryError.http_code === 400) {
      throw new Error("Invalid file format or corrupted file. Please try again with a different file.");
    } else if (cloudinaryError.http_code === 413 || cloudinaryError.message?.includes("too large")) {
      const limitMB = (sizeLimit / (1024 * 1024)).toFixed(0);
      throw new Error(`File size too large: Maximum allowed size is ${limitMB}MB. Please compress or use a smaller file.`);
    } else if (cloudinaryError.http_code === 504 || cloudinaryError.message?.includes("timeout")) {
      throw new Error("Upload timeout: The file is taking too long to upload. Please try a smaller file or check your internet connection.");
    } else {
      throw new Error(`Upload failed: ${cloudinaryError.message || "Please try again later."}`);
    }
  }
};

