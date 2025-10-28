/**
 * Compresses a video file by reducing quality and size
 * @param {File} videoFile - The video file to compress
 * @returns {Promise<File>} - A promise that resolves to the compressed video file
 */
export const compressVideo = async (videoFile) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      // Reduce dimensions to max 720p
      const maxWidth = 1280;
      const maxHeight = 720;

      let { videoWidth: width, videoHeight: height } = video;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      video.ontimeupdate = () => {
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], videoFile.name, {
                type: "video/mp4",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // If compression fails, return original file
              resolve(videoFile);
            }
          },
          "video/mp4",
          0.7
        ); // 70% quality
      };

      video.currentTime = 0;
    };

    video.onerror = () => {
      // If video processing fails, return original file
      resolve(videoFile);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Checks if video file is too large and shows appropriate message
 * @param {File} file - The video file to check
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - Returns true if file is valid size
 */
export const validateVideoSize = (file, maxSizeMB = 100) => {
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      message: `Video file is ${fileSizeMB.toFixed(
        1
      )}MB. Please select a file under ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true };
};

/**
 * Shows video duration and size info
 * @param {File} videoFile - The video file
 * @returns {Promise<Object>} - Video metadata
 */
export const getVideoMetadata = (videoFile) => {
  return new Promise((resolve) => {
    const video = document.createElement("video");

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const sizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);

      resolve({
        duration: Math.round(duration),
        sizeMB: sizeMB,
        dimensions: `${video.videoWidth}x${video.videoHeight}`,
      });
    };

    video.onerror = () => {
      resolve({ duration: 0, sizeMB: 0, dimensions: "Unknown" });
    };

    video.src = URL.createObjectURL(videoFile);
  });
};
