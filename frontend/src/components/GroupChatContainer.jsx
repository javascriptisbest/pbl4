import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Users, Crown, Clock, Users2 } from "lucide-react";
import MessageInputSimple from "./MessageInputSimple";
import ImageModal from "./ImageModal";

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();

  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: "",
    altText: "",
    currentIndex: 0,
  });

  // Get all images from group messages for navigation
  const getAllImages = () => {
    return groupMessages
      .filter((msg) => msg.image)
      .map((msg) => ({
        url: msg.image,
        alt: "Group shared image",
        messageId: msg._id,
      }));
  };

  const handleImageClick = (imageUrl) => {
    const allImages = getAllImages();
    const currentIndex = allImages.findIndex((img) => img.url === imageUrl);

    setImageModal({
      isOpen: true,
      imageUrl,
      altText: "Group shared image",
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
    if (selectedGroup?._id) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
    }

    return () => unsubscribeFromGroupMessages();
  }, [
    selectedGroup?._id,
    getGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  ]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col h-full min-w-0">
        <GroupChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-base-content/70">
              Đang tải tin nhắn nhóm...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-base-content/50" />
          <h3 className="text-xl font-semibold mb-2">Chọn một nhóm</h3>
          <p className="text-base-content/70">
            Chọn một nhóm từ sidebar để bắt đầu trò chuyện
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <GroupChatHeader />

      <div className="flex-1 overflow-y-auto space-y-1 scroll-smooth">
        {groupMessages.map((message) => {
          // Fix: senderId có thể là object hoặc string
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
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0 transition-all duration-300"
                  style={{ backgroundColor: "var(--accent-primary)" }}
                >
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
                        : "?"}
                    </span>
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    isMyMessage ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender name (chỉ hiển thị cho tin nhắn của người khác) */}
                  {!isMyMessage && (
                    <div className="text-xs text-gray-500 mb-1 px-1">
                      {typeof message.senderId === "object"
                        ? message.senderId.fullName
                        : "Unknown"}
                    </div>
                  )}

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
                    className={`text-xs text-gray-500 mt-1 px-1 ${
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

      <GroupMessageInput />

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

// Group Chat Header Component
const GroupChatHeader = () => {
  const { selectedGroup } = useGroupStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedGroup) return null;

  const onlineMembersCount =
    selectedGroup.members?.filter((member) => onlineUsers.includes(member._id))
      .length || 0;

  return (
    <div
      className="border-b p-3"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div className="flex items-center space-x-3">
        {/* Group Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-all duration-300"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          {selectedGroup.avatar ? (
            <img
              src={selectedGroup.avatar}
              alt={selectedGroup.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Users className="w-5 h-5" />
          )}
        </div>

        {/* Group Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {selectedGroup.name}
            </h3>
            {selectedGroup.isAdmin && (
              <Crown
                className="w-3 h-3 text-yellow-500"
                title="You are admin"
              />
            )}
          </div>
          <div
            className="flex items-center space-x-4 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            <div className="flex items-center space-x-1">
              <Users2 className="w-3 h-3" />
              <span>{selectedGroup.members?.length || 0} thành viên</span>
            </div>
            {onlineMembersCount > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{onlineMembersCount} đang online</span>
              </div>
            )}
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex items-center space-x-2">
          {selectedGroup.createdAt && (
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Tạo {formatMessageTime(selectedGroup.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Group Message Input Component
const GroupMessageInput = () => {
  const { selectedGroup, sendGroupMessage } = useGroupStore();

  const handleSendMessage = async (messageData) => {
    if (!selectedGroup) return;

    try {
      await sendGroupMessage(selectedGroup._id, messageData);
    } catch (error) {
      console.error("Error sending group message:", error);
    }
  };

  return <MessageInputSimple onSendMessage={handleSendMessage} />;
};

export default GroupChatContainer;
