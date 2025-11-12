import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, Mic, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import { useMediaUpload } from "../hooks/useMediaUpload";
import EmojiPicker from "./EmojiPicker";
import MediaPreview from "./MediaPreview";
import { VoiceRecorder, formatAudioDuration } from "../lib/voiceUtils";

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

    const messageData = {
      text: trimmedText || undefined,
      image: media.imagePreview || undefined,
      video: media.videoPreview || undefined,
      file: media.filePreview || undefined,
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
        sendMessage(messageData);
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    }
  };

  const hasMedia =
    media.imagePreview ||
    media.videoPreview ||
    media.filePreview ||
    media.audioPreview;

  return (
    <div className="p-4 border-t border-base-300 bg-base-100">
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

      {/* Upload Progress */}
      {media.isUploading && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm">{media.uploadProgress}</span>
          </div>
        </div>
      )}

      {/* Voice Recording */}
      {isRecording && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-error/10 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-error rounded-full animate-pulse"></div>
            <span className="font-medium">Recording...</span>
            <span className="text-sm text-base-content/60">
              {formatAudioDuration(recordingDuration)}
            </span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="btn btn-sm btn-error"
          >
            Stop
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        {/* Media Buttons */}
        <div className="flex gap-1">
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

          {/* Media Attachment Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              className="btn btn-ghost btn-sm"
              disabled={media.isUploading || isRecording}
              title="Attach Media"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {showMediaMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-base-200 rounded-lg shadow-xl border border-base-300 py-1 min-w-[120px]">
                <button
                  type="button"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  📷 Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  🎥 Video
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowMediaMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-base-300 flex items-center gap-2 text-sm"
                >
                  📎 File
                </button>
              </div>
            )}
          </div>

          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`btn btn-ghost btn-sm ${
              isRecording ? "text-error" : ""
            }`}
            disabled={media.isUploading}
            title="Voice Message"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Emoji Picker */}
          <EmojiPicker
            show={showEmojiPicker}
            onToggle={() => setShowEmojiPicker(!showEmojiPicker)}
            onEmojiSelect={(emoji) => setText((prev) => prev + emoji)}
          />
        </div>

        {/* Text Input - Mobile optimized */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="input input-bordered flex-1 text-base" // text-base for iOS zoom prevention
          style={{ fontSize: '16px' }} // Explicit fontSize for mobile
          disabled={media.isUploading || isRecording}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
        />

        {/* Send Button - Larger touch target on mobile */}
        <button
          type="submit"
          disabled={
            (!text.trim() && !hasMedia) || media.isUploading || isRecording
          }
          className="btn btn-primary min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px]"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInputSimple;
