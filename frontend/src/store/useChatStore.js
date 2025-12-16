/**
 * Chat Store - Zustand State Management
 * Quản lý state cho direct chat (1-1 messaging)
 *
 * Zustand là lightweight alternative cho Redux
 * Đơn giản hơn, ít boilerplate code hơn
 */

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance, axiosFileInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";
import { notificationManager } from "../lib/notifications.js";

export const useChatStore = create((set, get) => ({
  // State
  messages: [], // Danh sách tin nhắn của conversation hiện tại
  users: [], // Danh sách users trong sidebar
  selectedUser: null, // User đang được chọn để chat
  isUsersLoading: false, // Loading state khi fetch users
  isMessagesLoading: false, // Loading state khi fetch messages
  usersCache: null, // Cache users data
  usersCacheTime: null, // Thời gian cache
  messagesCache: {}, // Cache messages by userId: { userId: { messages: [], timestamp: number } }

  // Set selected user with immediate cache check
  setSelectedUser: (user) => {
    const { messagesCache, markAsRead, users, getMessages } = get();
    const userId = user?._id;

    set({ selectedUser: user });

    if (!userId) return;

      const cached = messagesCache[userId];
    if (!cached) {
      set({ messages: [] });
      getMessages(userId);
        return;
      }

    const cacheAge = Date.now() - cached.timestamp;
    const isValidCache = cacheAge < 2 * 60 * 1000;
    
    set({ messages: cached.messages });
    
    if (!isValidCache || cached.preloadLevel === "preview" || cached.hasMore) {
      getMessages(userId, true);
    }

    // Mark messages as read khi mở conversation
    const userInList = users.find(u => u._id === userId);
    if (userInList?.unreadCount > 0) {
      markAsRead(userId);
    }
  },
  
  // Đánh dấu tin nhắn đã đọc
  markAsRead: async (userId) => {
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
      
      // Cập nhật unreadCount trong users list
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === userId 
          ? { ...user, unreadCount: 0 }
          : user
      );
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  getUsers: async (forceRefresh = false) => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    const now = Date.now();

    // Kiểm tra cache trước
    const { usersCache, usersCacheTime } = get();
    if (
      !forceRefresh &&
      usersCache &&
      usersCacheTime &&
      now - usersCacheTime < CACHE_DURATION
    ) {
      set({ users: usersCache });
      return;
    }

    set({ isUsersLoading: true });
    const startTime = Date.now();

    try {
      const res = await axiosInstance.get("/messages/users");
      const users = Array.isArray(res.data) ? res.data : [];

      set({
        users,
        usersCache: users,
        usersCacheTime: now,
      });

      // Preload messages sau khi load users (background)
      get().preloadMessages();
    } catch (error) {
      console.error("Error loading users:", error);
      // Fallback to cache nếu có lỗi network
      if (usersCache && Array.isArray(usersCache)) {
        set({ users: usersCache });
      } else {
        // Ensure users is always an array, even on error
        set({ users: [] });
        toast.error(error.response?.data?.message || "Failed to load users");
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },
  
  // Preload messages cho tất cả users (background) - tối ưu: chỉ preload khi cần
  preloadMessages: async () => {
    const { messagesCache } = get();
    if (Object.keys(messagesCache).length > 0) return;
    
    try {
      // Timeout riêng cho preload (ngắn hơn để không block)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await axiosInstance.get("/messages/preload", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const newCache = {};
      for (const [userId, data] of Object.entries(res.data || {})) {
        newCache[userId] = {
          messages: data.messages || [],
          timestamp: Date.now(),
          hasMore: data.hasMore || false,
          preloadLevel: data.preloadLevel || "preview",
        };
      }
      
      set({ messagesCache: { ...messagesCache, ...newCache } });
    } catch (error) {
      // Silent fail - không ảnh hưởng UX
      if (error.name !== "AbortError") {
        // Chỉ log nếu không phải timeout
      }
    }
  },

  getMessages: async (userId, forceRefresh = false) => {
    const { messagesCache } = get();
    const now = Date.now();

    if (!forceRefresh && messagesCache[userId]) {
      const cached = messagesCache[userId];
      if (now - cached.timestamp < 2 * 60 * 1000) {
        set({ messages: cached.messages });
        return;
      }
    }

    set({ isMessagesLoading: true });
    const startTime = Date.now();

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;

      // Update both current messages and cache
      set({
        messages,
        messagesCache: {
          ...messagesCache,
          [userId]: { messages, timestamp: now },
        },
      });

    } catch (error) {
      if (messagesCache[userId]) {
        set({ messages: messagesCache[userId].messages });
      } else {
        toast.error(error.response?.data?.message || "Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const authUser = useAuthStore.getState().authUser;

    if (!authUser || !selectedUser?._id) {
      toast.error(!authUser ? "Please login" : "Please select a user");
      return;
    }

    if (!messageData.text && !messageData.image && !messageData.video && !messageData.audio && !messageData.file) {
      toast.error("Message content is required");
      return;
    }

    const toId = (v) => (typeof v === "object" && v?._id ? String(v._id) : String(v));
    const receiverId = toId(selectedUser._id);

    const tempMessage = {
      _id: `temp_${Date.now()}_${Math.random()}`,
      ...messageData,
      senderId: { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
      receiverId,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    set({ messages: [...messages, tempMessage] });

    try {
      // Use axiosFileInstance for video/file uploads (longer timeout - 10 minutes)
      const client = messageData.video || messageData.file 
        ? axiosFileInstance 
        : axiosInstance;
      
      // Show upload progress for large files
      if (messageData.video || messageData.file) {
        toast.loading(messageData.video 
          ? "Uploading video... This may take a while for large files." 
          : "Uploading file...", 
        { id: "upload-progress" });
      }
      
      const res = await client.post(`/messages/send/${receiverId}`, messageData);
      
      // Dismiss loading toast if it exists
      if (messageData.video || messageData.file) {
        toast.dismiss("upload-progress");
      }
      
      const { messagesCache, users } = get();
      const currentMessages = get().messages;
      const newMessages = [...currentMessages.filter(m => m._id !== tempMessage._id), res.data];

      const updatedUsers = users.map(user => 
        user._id === selectedUser._id
          ? { ...user, lastMessage: { text: res.data.text, image: res.data.image, video: res.data.video, audio: res.data.audio, file: res.data.file, senderId: res.data.senderId, createdAt: res.data.createdAt } }
          : user
      ).sort((a, b) => {
        const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      set({
        messages: newMessages,
        users: updatedUsers,
        messagesCache: { ...messagesCache, [selectedUser._id]: { messages: newMessages, timestamp: Date.now() } },
      });
    } catch (error) {
      // Dismiss loading toast if it exists
      toast.dismiss("upload-progress");
      
      set({ messages: get().messages.filter(m => m._id !== tempMessage._id) });
      
      // Extract error message
      let errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to send message";
      
      // Handle specific error cases
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMessage = "Upload timeout: The file is too large or connection is slow. Please try a smaller file or check your internet connection.";
      } else if (error.response?.status === 413) {
        errorMessage = error.response?.data?.error || "File size too large. Please use a smaller file.";
      } else if (error.response?.status === 408) {
        errorMessage = error.response?.data?.error || "Upload timeout. Please try again with a smaller file.";
      }
      
      toast.error(errorMessage);
      console.error("Send message error:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Unsubscribe trước để tránh duplicate listeners
    socket.off("newMessage");
    socket.off("messageReaction");
    socket.off("messageDeleted");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();
      const { authUser } = useAuthStore.getState();

      // Helper function: Chuẩn hóa ID (ObjectId vs string)
      const toId = (v) =>
        typeof v === "object" && v?._id ? String(v._id) : String(v);

      const selId = toId(selectedUser?._id);
      const sId = toId(newMessage.senderId);
      const rId = toId(newMessage.receiverId);
      const meId = toId(authUser?._id);

      // Logic filtering "cứng" hơn:
      // 1. Tin nhắn phải liên quan đến user hiện tại (là sender hoặc receiver)
      const isMessageForMe = sId === meId || rId === meId;

      // 2. Tin nhắn phải thuộc conversation đang mở
      const isFromSelectedConversation =
        selectedUser && (sId === selId || rId === selId);

      if (!isMessageForMe) return;

      if (!selectedUser || !isFromSelectedConversation) {
        
        // Cập nhật users list với unreadCount + 1 và lastMessage mới
        const { users } = get();
        const updatedUsers = users.map(user => {
          if (user._id === sId) {
            return {
              ...user,
              unreadCount: (user.unreadCount || 0) + 1,
              lastMessage: {
                text: newMessage.text,
                image: newMessage.image,
                video: newMessage.video,
                audio: newMessage.audio,
                file: newMessage.file,
                senderId: newMessage.senderId,
                createdAt: newMessage.createdAt,
              },
            };
          }
          return user;
        });
        
        // Sắp xếp lại: người vừa gửi tin lên đầu
        updatedUsers.sort((a, b) => {
          const timeA = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;
          const timeB = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;
          return timeB - timeA;
        });
        
        // 🔔 Show notification
        const sender = updatedUsers.find(u => u._id === sId);
        const senderName = sender?.fullName || "Ai đó";
        const getMessageText = () => {
          if (newMessage.text) return newMessage.text.length > 50 ? newMessage.text.substring(0, 50) + "..." : newMessage.text;
          if (newMessage.image) return "📷 Đã gửi ảnh";
          if (newMessage.video) return "🎥 Đã gửi video";
          if (newMessage.audio) return "🎵 Đã gửi audio";
          if (newMessage.file) return "📄 Đã gửi file";
          return "Đã gửi tin nhắn";
        };
        const messageText = getMessageText();
        
        notificationManager.show(
          senderName,
          messageText,
          sender?.profilePic || "/avatar.png",
          () => {
            const { setSelectedUser } = get();
            setSelectedUser(sId);
          }
        );
        
        set({ users: updatedUsers });
        return;
      }

      // Chống trùng tin (optimistic update vs server echo)
      const currentMessages = get().messages;
      const { messagesCache } = get();
      const userId = selectedUser._id;

      const updatedMessages = currentMessages.some(m => m._id === newMessage._id) 
        ? currentMessages
        : [...currentMessages, newMessage];

      set({
        messages: updatedMessages,
        messagesCache: {
          ...messagesCache,
          [userId]: {
            messages: updatedMessages,
            timestamp: Date.now(),
          },
        },
      });
    });

    // Listen for message reactions
    socket.on("messageReaction", (updatedMessage) => {
      const { messages, messagesCache, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      );
      
      set({
        messages: updatedMessages,
        messagesCache: selectedUser ? {
          ...messagesCache,
          [selectedUser._id]: {
            ...messagesCache[selectedUser._id],
            messages: updatedMessages,
            timestamp: Date.now(),
          },
        } : messagesCache,
      });
    });

    // Listen for message edits
    socket.on("messageEdited", (updatedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      });
    });

    // Listen for message deletions
    socket.on("messageDeleted", (deletedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === deletedMessage._id ? deletedMessage : msg
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageReaction");
    socket.off("messageDeleted");
    socket.off("messageEdited");
  },

  addReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
      const updatedMessage = res.data;
      
      // Cập nhật message trong state ngay lập tức
      const { messages, messagesCache, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      );
      
      set({
        messages: updatedMessages,
        messagesCache: selectedUser ? {
          ...messagesCache,
          [selectedUser._id]: {
            ...messagesCache[selectedUser._id],
            messages: updatedMessages,
            timestamp: Date.now(),
          },
        } : messagesCache,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      // Không cần toast, xóa im lặng
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text: newText });
      
      // Cập nhật message trong state
      const { messages, messagesCache, selectedUser } = get();
      const updatedMessages = messages.map((msg) =>
        msg._id === messageId ? { ...msg, text: newText } : msg
      );
      
      set({
        messages: updatedMessages,
        messagesCache: selectedUser ? {
          ...messagesCache,
          [selectedUser._id]: {
            ...messagesCache[selectedUser._id],
            messages: updatedMessages,
            timestamp: Date.now(),
          },
        } : messagesCache,
      });
      
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
      throw error;
    }
  },
}));
