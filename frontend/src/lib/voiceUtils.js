/**
 * Voice recording utilities for chat app
 */

export class VoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
  }

  /**
   * Start recording voice
   * @returns {Promise<boolean>} Success status
   */
  async startRecording() {
    try {
      // Request microphone permission with optimized settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 22050, // Lower sample rate for smaller files
          channelCount: 1, // Mono audio
        },
      });

      // Try different codecs for better compatibility
      let options;
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        options = { mimeType: "audio/wav" };
      } else {
        options = {}; // Use default
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.audioChunks = [];
      this.isRecording = true;

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      console.log("Voice recording started");
      return true;
    } catch (error) {
      console.error("Error starting voice recording:", error);

      if (error.name === "NotAllowedError") {
        throw new Error(
          "Microphone permission denied. Please allow microphone access."
        );
      } else if (error.name === "NotFoundError") {
        throw new Error("No microphone found. Please connect a microphone.");
      } else {
        throw new Error("Failed to start recording. Please try again.");
      }
    }
  }

  /**
   * Stop recording and get audio file
   * @returns {Promise<File>} Audio file
   */
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error("Recording not active"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

        // Create file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const audioFile = new File([audioBlob], `voice-${timestamp}.webm`, {
          type: "audio/webm",
          lastModified: Date.now(),
        });

        console.log(
          "Voice recording stopped, size:",
          (audioFile.size / 1024).toFixed(2),
          "KB"
        );

        // Cleanup
        this.cleanup();
        resolve(audioFile);
      };

      this.mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        this.cleanup();
        reject(new Error("Recording failed"));
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Cancel recording
   */
  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
    this.cleanup();
    console.log("Voice recording cancelled");
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  /**
   * Get recording status
   */
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      duration:
        this.mediaRecorder?.state === "recording" ? "Recording..." : "Stopped",
    };
  }
}

/**
 * Convert audio file to base64
 * @param {File} audioFile
 * @returns {Promise<string>} Base64 string
 */
export const audioToBase64 = (audioFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(audioFile);
  });
};

/**
 * Get audio duration
 * @param {File} audioFile
 * @returns {Promise<number>} Duration in seconds
 */
export const getAudioDuration = (audioFile) => {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      // Clean up
      URL.revokeObjectURL(audio.src);

      // Check if duration is valid
      if (!duration || isNaN(duration) || !isFinite(duration)) {
        console.warn("Invalid audio duration, defaulting to 0");
        resolve(0);
      } else {
        resolve(Math.round(duration));
      }
    };

    audio.onerror = () => {
      console.error("Failed to load audio metadata");
      URL.revokeObjectURL(audio.src);
      resolve(0); // Return 0 if can't determine duration
    };

    // Add timeout fallback
    setTimeout(() => {
      if (audio.readyState === 0) {
        console.warn("Audio metadata load timeout");
        URL.revokeObjectURL(audio.src);
        resolve(0);
      }
    }, 5000); // 5 second timeout

    audio.src = URL.createObjectURL(audioFile);
    audio.load();
  });
};

/**
 * Format audio duration for display
 * @param {number} seconds
 * @returns {string} Formatted duration (mm:ss)
 */
export const formatAudioDuration = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
