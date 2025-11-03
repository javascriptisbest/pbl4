import { describe, it, expect } from "vitest";

describe("Media File Validation", () => {
  describe("Image File Types", () => {
    it("should accept valid image formats", () => {
      const validFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      const isValidImageType = (mimeType) => {
        return validFormats.includes(mimeType);
      };

      validFormats.forEach((format) => {
        expect(isValidImageType(format)).toBe(true);
      });
    });

    it("should reject invalid image formats", () => {
      const invalidFormats = [
        "text/plain",
        "application/pdf",
        "video/mp4",
        "audio/mp3",
        "",
      ];

      const validFormats = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const isValidImageType = (mimeType) => {
        return validFormats.includes(mimeType);
      };

      invalidFormats.forEach((format) => {
        expect(isValidImageType(format)).toBe(false);
      });
    });
  });

  describe("Video File Types", () => {
    it("should accept valid video formats", () => {
      const validFormats = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];

      const isValidVideoType = (mimeType) => {
        return mimeType && mimeType.startsWith("video/");
      };

      validFormats.forEach((format) => {
        expect(isValidVideoType(format)).toBe(true);
      });
    });
  });

  describe("Audio File Types", () => {
    it("should accept valid audio formats", () => {
      const validFormats = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/webm",
      ];

      const isValidAudioType = (mimeType) => {
        return mimeType && mimeType.startsWith("audio/");
      };

      validFormats.forEach((format) => {
        expect(isValidAudioType(format)).toBe(true);
      });
    });
  });

  describe("File Size Validation", () => {
    it("should validate file size limits", () => {
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
      const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
      const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

      expect(MAX_IMAGE_SIZE).toBe(5242880);
      expect(MAX_VIDEO_SIZE).toBe(52428800);
      expect(MAX_AUDIO_SIZE).toBe(10485760);
    });

    it("should check if file is within size limit", () => {
      const isFileSizeValid = (fileSize, maxSize) => {
        return fileSize > 0 && fileSize <= maxSize;
      };

      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      expect(isFileSizeValid(1024, MAX_SIZE)).toBe(true);
      expect(isFileSizeValid(MAX_SIZE, MAX_SIZE)).toBe(true);
      expect(isFileSizeValid(MAX_SIZE + 1, MAX_SIZE)).toBe(false);
      expect(isFileSizeValid(0, MAX_SIZE)).toBe(false);
      expect(isFileSizeValid(-1, MAX_SIZE)).toBe(false);
    });
  });

  describe("File Name Sanitization", () => {
    it("should sanitize file names", () => {
      const sanitizeFileName = (fileName) => {
        return fileName
          .replace(/[^a-zA-Z0-9.-]/g, "_")
          .replace(/_{2,}/g, "_")
          .substring(0, 100);
      };

      const testCases = [
        { input: "my file.jpg", expected: "my_file.jpg" },
        { input: "photo@2024!.png", expected: "photo_2024_.png" },
        {
          input: "test__multiple__underscores.jpg",
          expected: "test_multiple_underscores.jpg",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(sanitizeFileName(input)).toBe(expected);
      });
    });

    it("should limit file name length", () => {
      const sanitizeFileName = (fileName) => {
        return fileName.substring(0, 100);
      };

      const longFileName = "a".repeat(200) + ".jpg";
      const sanitized = sanitizeFileName(longFileName);

      expect(sanitized.length).toBe(100);
    });
  });
});

describe("Cloudinary URL Validation", () => {
  it("should validate Cloudinary URL format", () => {
    const validUrls = [
      "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
      "https://res.cloudinary.com/mycloud/video/upload/video.mp4",
      "https://res.cloudinary.com/test/raw/upload/file.pdf",
    ];

    validUrls.forEach((url) => {
      expect(url).toContain("cloudinary.com");
      expect(url).toMatch(/^https:\/\//);
    });
  });

  it("should extract public ID from Cloudinary URL", () => {
    const extractPublicId = (url) => {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\./);
      return match ? match[1] : null;
    };

    const testCases = [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        expected: "sample",
      },
      {
        url: "https://res.cloudinary.com/demo/image/upload/folder/image.png",
        expected: "folder/image",
      },
    ];

    testCases.forEach(({ url, expected }) => {
      expect(extractPublicId(url)).toBe(expected);
    });
  });
});
