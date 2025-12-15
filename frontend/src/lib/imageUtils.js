import imageCompression from "browser-image-compression";
import { axiosInstance } from "./axios";
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


    return compressedFile;
  } catch (error) {
    return imageFile;
  }
};

export const fileToBase64 = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    
    // Track progress for large files (especially videos)
    if (onProgress && file.size > 5 * 1024 * 1024) { // Only track for files > 5MB
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }
    
    reader.readAsDataURL(file); // Read file as Data URL (base64)
  });
};

export const uploadImage = async (base64Image) => {
  try {
    const response = await axiosInstance.post("/images/upload", {
      image: base64Image,
    });
    return response.data.fileUrl || response.data.imageUrl;
  } catch (error) {
    throw error;
  }
};

export const uploadVideo = async (base64Video) => {
  try {
    const response = await axiosInstance.post("/images/upload", {
      video: base64Video,
    });
    return response.data.fileUrl;
  } catch (error) {
    throw error;
  }
};
