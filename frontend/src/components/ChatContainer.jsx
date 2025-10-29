import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInputSimple from "./MessageInputSimple";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import ImageViewer from "./ImageViewer";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { formatAudioDuration } from "../lib/voiceUtils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    addReaction,
    deleteMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const prevMessagesLength = useRef(messages.length);
  const [viewingImage, setViewingImage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      await deleteMessage(messageId);
    }
  };

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
    // TODO: Scroll to input and focus
  };

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    // Chỉ scroll khi có tin nhắn mới, không scroll khi reaction
    if (messageEndRef.current && messages.length > prevMessagesLength.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <MessageSkeleton />
        </div>
        <MessageInputSimple />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`chat group relative ${
                isOwnMessage ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="relative">
                <MessageActions
                  message={message}
                  isOwnMessage={isOwnMessage}
                  onReaction={addReaction}
                  onDelete={handleDeleteMessage}
                  onReply={handleReplyMessage}
                />

                {message.isDeleted ? (
                  <div className="chat-bubble">
                    <p className="italic text-gray-500 break-words">
                      {message.text}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`flex flex-col gap-1 ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Image - no bubble */}
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="rounded-lg max-w-[250px] md:max-w-[300px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setViewingImage(message.image)}
                      />
                    )}

                    {/* Video - no bubble */}
                    {message.video && (
                      <video
                        src={message.video}
                        controls
                        className="rounded-lg max-w-[250px] md:max-w-[300px]"
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}

                    {/* Audio - no bubble */}
                    {message.audio && (
                      <div className="bg-accent/20 p-3 rounded-lg max-w-[250px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-2xl">🎤</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              Voice Message
                            </div>
                            <div className="text-xs opacity-60">
                              {message.audioDuration
                                ? formatAudioDuration(message.audioDuration)
                                : "Audio"}
                            </div>
                          </div>
                        </div>
                        <audio
                          controls
                          className="w-full h-8"
                          src={message.audio}
                          preload="metadata"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {/* File - no bubble */}
                    {message.file && (
                      <div className="bg-base-200 p-3 rounded-lg max-w-[250px]">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {message.fileName}
                            </div>
                            <div className="text-xs opacity-60">
                              {(message.fileSize / 1024 / 1024).toFixed(2)} MB •{" "}
                              {message.fileType}
                            </div>
                          </div>
                        </div>
                        <a
                          href={message.file}
                          download={message.fileName}
                          className="block mt-2 text-primary hover:text-primary-focus text-sm"
                        >
                          Download
                        </a>
                      </div>
                    )}

                    {/* Text - with bubble */}
                    {message.text && (
                      <div className="chat-bubble">
                        <p className="break-words">{message.text}</p>
                      </div>
                    )}
                  </div>
                )}

                {!message.isDeleted && (
                  <MessageReactions
                    reactions={message.reactions}
                    messageId={message._id}
                    onReactionClick={addReaction}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="border-t border-base-300 bg-base-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex-1">
              <p className="text-xs text-base-content/60">
                Replying to {replyingTo.senderId?.fullName || "User"}
              </p>
              <p className="text-sm truncate">
                {replyingTo.text || "Media message"}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <MessageInputSimple
        replyTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Image Viewer Modal */}
      <ImageViewer
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};

export default ChatContainer;
