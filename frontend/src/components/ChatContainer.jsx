import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInputSimple from "./MessageInputSimple";
import ImageModal from "./ImageModal";
import MessageBubble from "./MessageBubble";

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
  const prevMessagesLengthRef = useRef(0);
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: "",
    altText: "",
    currentIndex: 0,
  });
  const [editingMessage, setEditingMessage] = useState(null);

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

  // Chỉ auto-scroll khi có message mới (length tăng), không scroll khi chỉ update reaction/edit
  useEffect(() => {
    if (messagesEndRef.current && messages) {
      const currentLength = messages.length;
      const prevLength = prevMessagesLengthRef.current;
      
      // Chỉ scroll khi có message mới được thêm vào
      if (currentLength > prevLength) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      
      prevMessagesLengthRef.current = currentLength;
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
          const messageSenderId = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
          const isMyMessage = messageSenderId === authUser?._id;

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isMyMessage={isMyMessage}
              authUser={authUser}
              selectedUser={selectedUser}
              onImageClick={handleImageClick}
              onEdit={setEditingMessage}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <MessageInputSimple />

      {/* Edit Message Modal */}
      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          onClose={() => setEditingMessage(null)}
        />
      )}

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

// Edit Message Modal Component - Đơn giản nhất
const EditMessageModal = ({ message, onClose }) => {
  const [text, setText] = useState(message.text || "");
  const { editMessage } = useChatStore();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    try {
      await editMessage(message._id, text.trim());
      onClose();
    } catch (error) {
      // Error đã được xử lý trong store
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Chỉnh sửa tin nhắn</h3>
        
        <form onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Nhập nội dung tin nhắn..."
          />
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;
