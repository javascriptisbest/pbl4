import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { formatAudioDuration } from "../lib/voiceUtils";
import { Users, ArrowLeft } from "lucide-react";
import ChatHeader from "./ChatHeader";
import MessageInputSimple from "./MessageInputSimple";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import Avatar from "./Avatar";
import MessageActions from "./MessageActions";
import MessageReactions from "./MessageReactions";
import ImageViewer from "./ImageViewer";
import toast from "react-hot-toast";

const UnifiedChatContainer = () => {
  const { authUser } = useAuthStore();
  const {
    selectedUser,
    messages,
    getMessages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    addReaction,
    deleteMessage,
  } = useChatStore();
  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    sendGroupMessage,
    isGroupMessagesLoading,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    addGroupReaction,
    setSelectedGroup,
  } = useGroupStore();

  const messageEndRef = useRef(null);
  const [viewingImage, setViewingImage] = useState(null);

  // Determine if we're in group mode
  const isGroupChat = !!selectedGroup;
  const currentMessages = isGroupChat ? groupMessages : messages;
  const isLoading = isGroupChat ? isGroupMessagesLoading : isMessagesLoading;
  const prevMessagesLength = useRef(currentMessages.length);

  /**
   * Handler: Delete Message
   * Xóa tin nhắn (soft delete - set isDeleted flag)
   */
  const handleDeleteMessage = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      if (isGroupChat) {
        toast.error("Group message delete coming soon!");
      } else {
        await deleteMessage(messageId);
      }
    }
  };

  /**
   * Handler: Send Message
   * Route message đến đúng handler (direct chat hoặc group chat)
   */
  const handleSendMessage = async (messageData) => {
    if (isGroupChat) {
      await sendGroupMessage(selectedGroup._id, messageData);
    }
    // Direct chat: MessageInputSimple tự handle qua useChatStore.sendMessage
  };

  /**
   * Handler: Add Reaction
   * Thêm emoji reaction vào tin nhắn
   */
  const handleAddReaction = (messageId, emoji) => {
    if (isGroupChat) {
      addGroupReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
  };

  // Subscribe to messages
  useEffect(() => {
    if (isGroupChat && selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
      return () => unsubscribeFromGroupMessages();
    } else if (selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      return () => unsubscribeFromMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id, selectedGroup?._id]);

  // Auto scroll
  useEffect(() => {
    if (
      messageEndRef.current &&
      currentMessages.length > prevMessagesLength.current
    ) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = currentMessages.length;
  }, [currentMessages]);

  // No selection
  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <p className="text-lg font-medium">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full">
        {isGroupChat ? (
          <GroupHeader
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <ChatHeader />
        )}
        <div className="flex-1 flex items-center justify-center">
          <MessageSkeleton />
        </div>
        <MessageInputSimple
          onSendMessage={isGroupChat ? handleSendMessage : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      {isGroupChat ? (
        <GroupHeader
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
        />
      ) : (
        <ChatHeader />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">👋</div>
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm text-base-content/60">
              {isGroupChat
                ? "Start the conversation with your group"
                : "Send a message to start chatting"}
            </p>
          </div>
        ) : (
          currentMessages.map((message) => {
            // Handle both populated and non-populated senderId
            const senderId = message.senderId?._id || message.senderId;
            const isOwnMessage = senderId === authUser._id;

            return (
              <div
                key={message._id}
                className={`chat group relative ${
                  isOwnMessage ? "chat-end" : "chat-start"
                }`}
              >
                {/* Avatar - always show */}
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <Avatar
                      src={message.senderId?.profilePic || authUser.profilePic}
                      alt={message.senderId?.fullName || authUser.fullName}
                      size="md"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Name & Time */}
                {isGroupChat ? (
                  <div className="chat-header mb-1">
                    <span className="font-medium text-sm">
                      {message.senderId?.fullName || "User"}
                    </span>
                    <time className="text-xs opacity-50 ml-1">
                      {formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                ) : (
                  <div className="chat-footer opacity-50 text-xs mt-1">
                    {formatMessageTime(message.createdAt)}
                  </div>
                )}

                <div className="relative">
                  <MessageActions
                    message={message}
                    isOwnMessage={isOwnMessage}
                    onReaction={handleAddReaction}
                    onDelete={handleDeleteMessage}
                  />

                  {message.isDeleted ? (
                    <div
                      className={`chat-bubble max-w-[330px] opacity-60 italic ${
                        isOwnMessage ? "chat-bubble-primary" : ""
                      }`}
                    >
                      <p className="text-sm">🚫 This message was deleted</p>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col gap-1 ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Image */}
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="rounded-lg max-w-[250px] md:max-w-[300px] cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setViewingImage(message.image)}
                          loading="lazy"
                        />
                      )}

                      {/* Video */}
                      {message.video && (
                        <video
                          src={message.video}
                          controls
                          className="rounded-lg max-w-[250px] md:max-w-[300px]"
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}

                      {/* Audio */}
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

                      {/* File */}
                      {message.file && (
                        <div className="bg-base-200 p-3 rounded-lg max-w-[250px]">
                          <div className="flex items-center gap-2">
                            <div className="text-2xl">📄</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {message.fileName}
                              </div>
                              <div className="text-xs opacity-60">
                                {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                                • {message.fileType}
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

                      {/* Text */}
                      {message.text && (
                        <div
                          className={`chat-bubble max-w-[330px] ${
                            isOwnMessage ? "chat-bubble-primary" : ""
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">
                            {message.text}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!message.isDeleted && (
                    <MessageReactions
                      reactions={message.reactions}
                      messageId={message._id}
                      onReactionClick={handleAddReaction}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <MessageInputSimple
        onSendMessage={isGroupChat ? handleSendMessage : undefined}
      />

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};

// Group Header Component
const GroupHeader = ({ group, onBack }) => {
  return (
    <div className="border-b border-base-300 p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="btn btn-ghost btn-sm btn-circle lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {group.avatar ? (
            <img
              src={group.avatar}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{group.name}</h3>
          <p className="text-sm text-base-content/60">
            {group.members.length} members
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatContainer;
