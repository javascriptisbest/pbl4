import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInputSimple from "./MessageInputSimple";
import ImageModal from "./ImageModal";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: "",
    altText: "",
    currentIndex: 0,
  });

  // Get all images from messages for navigation
  const getAllImages = () => {
    return messages
      .filter((msg) => msg.image)
      .map((msg) => ({
        url: msg.image,
        alt: "Shared image",
        messageId: msg._id,
      }));
  };

  const handleImageClick = (imageUrl) => {
    const allImages = getAllImages();
    const currentIndex = allImages.findIndex((img) => img.url === imageUrl);

    setImageModal({
      isOpen: true,
      imageUrl,
      altText: "Shared image",
      currentIndex: Math.max(0, currentIndex),
    });
  };

  const handleImageNavigate = (newIndex) => {
    const allImages = getAllImages();
    if (newIndex >= 0 && newIndex < allImages.length) {
      const newImage = allImages[newIndex];
      setImageModal((prev) => ({
        ...prev,
        imageUrl: newImage.url,
        altText: newImage.alt,
        currentIndex: newIndex,
      }));
    }
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
    if (messagesEndRef.current && messages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full min-w-0">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-base-content/70">Đang tải tin nhắn...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto space-y-1 scroll-smooth">
        {messages.map((message) => {
          // Fix: senderId là object, cần lấy _id
          const messageSenderId =
            typeof message.senderId === "object"
              ? message.senderId._id
              : message.senderId;

          const isMyMessage = messageSenderId === authUser?._id;

          return (
            <div
              key={message._id}
              className={`flex w-full px-3 py-1 ${
                isMyMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[70%] items-end gap-2 ${
                  isMyMessage ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar - hiển thị cho cả 2 bên */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
                  {isMyMessage ? (
                    authUser?.profilePic ? (
                      <img
                        src={authUser.profilePic}
                        alt={authUser.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold">
                        {authUser?.fullName?.charAt(0)}
                      </span>
                    )
                  ) : // Sử dụng thông tin từ message.senderId object
                  typeof message.senderId === "object" &&
                    message.senderId.profilePic ? (
                    <img
                      src={message.senderId.profilePic}
                      alt={message.senderId.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold">
                      {typeof message.senderId === "object"
                        ? message.senderId.fullName?.charAt(0)
                        : selectedUser?.fullName?.charAt(0)}
                    </span>
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    isMyMessage ? "items-end" : "items-start"
                  }`}
                >
                  {/* Text Bubble - chỉ cho text */}
                  {message.text && (
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm max-w-xs break-words ${
                        isMyMessage ? "rounded-br-md" : "rounded-bl-md border"
                      }`}
                      style={{
                        background: isMyMessage
                          ? "var(--message-sent)"
                          : "var(--message-received)",
                        color: isMyMessage
                          ? "var(--message-text-sent)"
                          : "var(--message-text-received)",
                        borderColor: !isMyMessage
                          ? "var(--border-primary)"
                          : "none",
                      }}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                    </div>
                  )}

                  {/* Image - ngoài bubble, to hơn */}
                  {message.image && (
                    <div
                      className={`${
                        message.text ? "mt-1" : ""
                      } rounded-lg overflow-hidden shadow-sm`}
                    >
                      <img
                        src={message.image}
                        alt="Shared image"
                        className="max-w-[400px] max-h-[400px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                        onClick={() => handleImageClick(message.image)}
                      />
                    </div>
                  )}

                  {/* Video - ngoài bubble, to hơn */}
                  {message.video && (
                    <div
                      className={`${
                        message.text || message.image ? "mt-1" : ""
                      } rounded-lg overflow-hidden shadow-sm`}
                    >
                      <video
                        src={message.video}
                        controls
                        className="max-w-[400px] rounded-lg"
                        style={{ maxHeight: "300px" }}
                      >
                        Trình duyệt không hỗ trợ video
                      </video>
                    </div>
                  )}

                  {message.audio && (
                    <div
                      className={`${
                        message.text || message.image || message.video
                          ? "mt-1"
                          : ""
                      } flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-3 shadow-sm`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isMyMessage ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        🎵
                      </div>
                      <audio src={message.audio} controls className="flex-1">
                        Trình duyệt không hỗ trợ audio
                      </audio>
                      {message.audioDuration && (
                        <span className="text-xs text-gray-500">
                          {Math.floor(message.audioDuration / 60)}:
                          {(message.audioDuration % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  )}

                  {message.file && (
                    <div
                      className={`${
                        message.text ||
                        message.image ||
                        message.video ||
                        message.audio
                          ? "mt-1"
                          : ""
                      } flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm max-w-[300px]`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {message.fileName || "Tài liệu"}
                        </p>
                        {message.fileSize && (
                          <p className="text-xs text-gray-500">
                            {(message.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => window.open(message.file, "_blank")}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Tải
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-xs text-gray-500 px-1 ${
                      isMyMessage ? "text-right" : "text-left"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <MessageInputSimple />

      <ImageModal
        isOpen={imageModal.isOpen}
        imageUrl={imageModal.imageUrl}
        altText={imageModal.altText}
        allImages={getAllImages()}
        currentIndex={imageModal.currentIndex}
        onNavigate={handleImageNavigate}
        onClose={() =>
          setImageModal({
            isOpen: false,
            imageUrl: "",
            altText: "",
            currentIndex: 0,
          })
        }
      />
    </div>
  );
};

export default ChatContainer;
