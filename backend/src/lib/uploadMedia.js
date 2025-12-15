import cloudinary from "./cloudinary.js";

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
      timeout: 600000,
      chunk_size: 6000000,
      eager: [{ quality: "auto", fetch_format: "auto" }],
    },
    audio: {
      folder: "chat_app_audio",
      resource_type: "video",
      timeout: 300000,
      eager: [{ quality: "auto", fetch_format: "auto" }],
    },
    file: {
      folder: "chat_app_files",
      resource_type: "auto",
      timeout: 600000,
      chunk_size: 6000000,
    },
  };

  const config = configs[type];
  if (!config) {
    throw new Error(`Invalid media type: ${type}`);
  }

  // Validate format
  if (type === "video" && !media.startsWith("data:video/")) {
    throw new Error("Invalid video format");
  }
  if (type === "audio" && !media.startsWith("data:audio/")) {
    throw new Error("Invalid audio format");
  }

  const uploadResponse = await cloudinary.uploader.upload(media, config);
  return uploadResponse.secure_url;
};

