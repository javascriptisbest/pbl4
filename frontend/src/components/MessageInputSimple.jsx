import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, Mic, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { useMediaUpload } from "../hooks/useMediaUpload";
import EmojiPicker from "./EmojiPicker";
import MediaPreview from "./MediaPreview";
import { VoiceRecorder, formatAudioDuration } from "../lib/voiceUtils";
import { uploadToCloudinary } from "../lib/cloudinaryUpload";

const MessageInputSimple = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const voiceRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const { sendMessage } = useChatStore();
  const media = useMediaUpload();

  const handleFileSelect = (type) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") media.handleImageSelect(file);
    else if (type === "video") media.handleVideoSelect(file);
    else media.handleFileSelect(file);
  };

  const startRecording = async () => {
    try {
      voiceRecorderRef.current = new VoiceRecorder();
      await voiceRecorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Failed to start recording");
      console.error(error);
    }
  };

  const stopRecording = async () => {
    if (!voiceRecorderRef.current) return;

    try {
      const audioBlob = await voiceRecorderRef.current.stopRecording();
      const currentDuration = recordingDuration; // Capture current timer value

      // Process audio with the timer duration instead of parsing from file
      await media.handleAudioData(audioBlob, currentDuration);
    } catch (error) {
      toast.error("Failed to stop recording");
      console.error(error);
    } finally {
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    const trimmedText = text.trim();
    if (
      !trimmedText &&
      !media.imagePreview &&
      !media.videoPreview &&
      !media.filePreview &&
      !media.audioPreview
    ) {
      return;
    }

    // Check if video/file needs to be uploaded
    const videoFile = media.videoMetadata?.fileObject;
    const fileObject = media.fileMetadata?.fileObject;
    let videoUrl = media.videoPreview;
    let fileUrl = media.filePreview;

    // Nếu video là object URL (chưa upload), gửi ngay và upload background
    if (videoFile && media.videoPreview?.startsWith('blob:')) {
      // Upload background, không block UI
      uploadToCloudinary(videoFile, "video")
        .then((uploadedUrl) => {
          // Update message trong store với Cloudinary URL
          const { useChatStore } = require("../store/useChatStore");
          const store = useChatStore.getState();
          const messages = store.messages;
          const updatedMessages = messages.map(msg => {
            if (msg.video === media.videoPreview) {
              return { ...msg, video: uploadedUrl };
            }
            return msg;
          });
          store.set({ messages: updatedMessages });
          
          // Update cache
          const { messagesCache, selectedUser } = store;
          if (selectedUser && messagesCache[selectedUser._id]) {
            store.set({
              messagesCache: {
                ...messagesCache,
                [selectedUser._id]: {
                  ...messagesCache[selectedUser._id],
                  messages: updatedMessages,
                },
              },
            });
          }
        })
        .catch((error) => {
          console.error("Background video upload failed:", error);
          // Không hiển thị error để không làm phiền user
        });
      
      // Gửi ngay với object URL tạm
      videoUrl = media.videoPreview;
    }

    // Tương tự cho file
    if (fileObject && media.filePreview?.startsWith('blob:')) {
      uploadToCloudinary(fileObject, "file")
        .then((uploadedUrl) => {
          const { useChatStore } = require("../store/useChatStore");
          const store = useChatStore.getState();
          const messages = store.messages;
          const updatedMessages = messages.map(msg => {
            if (msg.file === media.filePreview) {
              return { ...msg, file: uploadedUrl };
            }
            return msg;
          });
          store.set({ messages: updatedMessages });
        })
        .catch((error) => {
          console.error("Background file upload failed:", error);
        });
      
      fileUrl = media.filePreview;
    }

    const messageData = {
      text: trimmedText || undefined,
      image: media.imagePreview || undefined,
      video: videoUrl || undefined,
      file: fileUrl || undefined,
      fileName: media.fileMetadata?.name || undefined,
      fileSize: media.fileMetadata?.size || undefined,
      fileType: media.fileMetadata?.type || undefined,
      audio: media.audioPreview || undefined,
      audioDuration: media.audioMetadata?.duration || undefined,
    };

    // Clear form
    setText("");
    media.clearAll();
    [imageInputRef, videoInputRef, fileInputRef].forEach((ref) => {
      if (ref.current) ref.current.value = "";
    });

    try {
      if (onSendMessage) {
        await onSendMessage(messageData);
      } else {
        await sendMessage(messageData);
      }
    } catch (error) {
      // Error is already handled in sendMessage, but log it here for debugging
      console.error("Error in handleSendMessage:", error);
      // Don't show duplicate error toast - sendMessage already shows it
    }
  };

  const hasMedia =
    media.imagePreview ||
    media.videoPreview ||
    media.filePreview ||
    media.audioPreview;

  return (
    <div className="p-2 border-t border-base-300">
      {/* Media Previews */}
      {hasMedia && (
        <div className="mb-3 flex flex-wrap gap-2">
          {media.imagePreview && (
            <MediaPreview
              type="image"
              preview={media.imagePreview}
              onRemove={media.removeImage}
            />
          )}
          {media.videoPreview && (
            <MediaPreview
              type="video"
              preview={media.videoPreview}
              metadata={media.videoMetadata}
              onRemove={media.removeVideo}
            />
          )}
          {media.filePreview && (
            <MediaPreview
              type="file"
              preview={media.filePreview}
              metadata={media.fileMetadata}
              onRemove={media.removeFile}
            />
          )}
          {media.audioPreview && (
            <MediaPreview
              type="audio"
              preview={media.audioPreview}
              metadata={media.audioMetadata}
              onRemove={media.removeAudio}
            />
          )}
        </div>
      )}

      {/* Voice Recording */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-gradient-to-r from-error/10 to-error/20 rounded-2xl shadow-modern">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-error rounded-full animate-pulse shadow-lg"></div>
            <span className="font-semibold">Recording...</span>
            <span className="text-sm text-base-content/70">
              {formatAudioDuration(recordingDuration)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="btn btn-sm btn-error shadow-modern hover:shadow-lg transition-all"
          >
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        {/* Media Buttons - Responsive sizing */}
        <div className="flex gap-1 md:gap-2">
          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect("image")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect("video")}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect("file")}
          />

          {/* Media Attachment Dropdown - Responsive */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              className="w-7 h-7 md:w-auto md:h-auto min-h-7 md:min-h-8 p-0 md:p-2 transition-all rounded-lg"
              style={{
                backgroundColor: "var(--bg-accent)",
                color: "var(--accent-primary)",
              }}
              disabled={isRecording}
              title="Attach"
            >
              <Paperclip className="w-3 h-3 md:w-4 md:h-4" />
            </button>

            {showMediaMenu && (
              <div className="absolute bottom-full left-0 mb-2 glass-effect rounded-2xl shadow-modern-lg border border-primary/20 py-1 min-w-[120px] z-10">
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-primary/10 hover:text-primary flex items-center gap-2 text-sm transition-colors rounded-xl"
                >
                  📷 Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-primary/10 hover:text-primary flex items-center gap-2 text-sm transition-colors rounded-xl"
                >
                  🎥 Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-primary/10 hover:text-primary flex items-center gap-2 text-sm transition-colors rounded-xl"
                >
                  📎 File
                </button>
              </div>
            )}
          </div>

          {/* Voice Recording Button - Responsive */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className="w-7 h-7 md:w-auto md:h-auto min-h-7 md:min-h-8 p-0 md:p-2 transition-all rounded-lg border"
            style={{
              backgroundColor: isRecording
                ? "var(--message-sent)"
                : "var(--bg-accent)",
              color: isRecording ? "#ffffff" : "var(--accent-primary)",
            }}
            title="Voice"
          >
            <Mic className="w-3 h-3 md:w-4 md:h-4" />
          </button>

          {/* Emoji Picker - Responsive */}
          <EmojiPicker
            show={showEmojiPicker}
            onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
            onEmojiSelect={(emoji) => setText((prev) => prev + emoji)}
          />
        </div>

        {/* Text Input Container - Prevent overflow */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="w-full text-base min-h-[44px] focus:outline-none rounded-2xl transition-all px-4 py-2"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
            disabled={isRecording}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
          />
        </div>

        {/* Send Button - Responsive sizing */}
        <button
          type="submit"
          disabled={
            (!text.trim() && !hasMedia) || isRecording
          }
          className="flex-shrink-0 w-8 h-8 md:w-auto md:h-auto min-h-8 md:min-h-12 p-0 md:px-4 transition-all rounded-2xl"
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "#ffffff",
          }}
        >
          <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </form>
    </div>
  );
};

export default MessageInputSimple;
