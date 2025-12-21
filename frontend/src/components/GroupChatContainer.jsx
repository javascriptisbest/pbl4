import { useEffect, useRef, useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Crown, Clock, Users2 } from "lucide-react";
import MessageInputSimple from "./MessageInputSimple";
import ImageModal from "./ImageModal";
import MessageBubble from "./MessageBubble";
import { formatMessageTime } from "../lib/utils";

const GroupChatContainer = () => {
  const {
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    selectedGroup,
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
      // Note: subscribeToGroupMessages is now called globally when socket connects
    }
  }, [selectedGroup?._id, getGroupMessages]);

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
          const messageSenderId = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
          const isMyMessage = messageSenderId === authUser?._id;

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isMyMessage={isMyMessage}
              authUser={authUser}
              selectedUser={{ ...selectedGroup, type: "group" }}
              onImageClick={handleImageClick}
            />
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
