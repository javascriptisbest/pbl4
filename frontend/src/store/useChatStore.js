/**
 * Chat Store - Zustand State Management
 * Quản lý state cho direct chat (1-1 messaging)
 *
 * Zustand là lightweight alternative cho Redux
 * Đơn giản hơn, ít boilerplate code hơn
 */

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";

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
    const { messagesCache } = get();
    const userId = user?._id;

    set({ selectedUser: user });

    // If we have cached messages for this user, show them immediately
    if (userId && messagesCache[userId]) {
      const cached = messagesCache[userId];
      const cacheAge = Date.now() - cached.timestamp;

      // Use cache if less than 2 minutes old
      if (cacheAge < 2 * 60 * 1000) {
        console.log(`💬 Using cached messages for user ${userId}`);
        set({ messages: cached.messages });
        return;
      }
    }

    // Clear messages if no cache or cache is stale
    if (userId) {
      set({ messages: [] });
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
      console.log("📋 Using cached users data");
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

      console.log(`👥 Users loaded in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to cache nếu có lỗi network
      if (usersCache && Array.isArray(usersCache)) {
        console.log("📋 Network error, using cached users");
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

  getMessages: async (userId, forceRefresh = false) => {
    const { messagesCache } = get();
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh && messagesCache[userId]) {
      const cached = messagesCache[userId];
      const cacheAge = now - cached.timestamp;

      // Use cache if less than 2 minutes old
      if (cacheAge < 2 * 60 * 1000) {
        console.log(`💬 Using cached messages for user ${userId}`);
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

      console.log(`💬 Messages loaded in ${Date.now() - startTime}ms`);
    } catch (error) {
      // Fallback to cache if available
      if (messagesCache[userId]) {
        console.log("📋 Network error, using cached messages");
        set({ messages: messagesCache[userId].messages });
      } else {
        toast.error(error.response?.data?.message || "Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  /**
   * Action: sendMessage
   * Gửi tin nhắn với optimistic UI update
   *
   * Flow:
   * 1. Tạo tempMessage ngay lập tức để UI responsive
   * 2. Gửi request lên server
   * 3. Thay tempMessage bằng message thật từ server
   * 4. Nếu lỗi: Xóa tempMessage và show error
   */
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const authUser = useAuthStore.getState().authUser;

    // Helper function: Chuẩn hóa ID (ObjectId vs string)
    const toId = (v) =>
      typeof v === "object" && v?._id ? String(v._id) : String(v);

    // Optimistic UI Update: Tạo message tạm để hiển thị ngay
    const tempMessage = {
      _id: `temp_${Date.now()}_${Math.random()}`, // Unique temporary ID
      text: messageData.text,
      image: messageData.image,
      video: messageData.video,
      audio: messageData.audio,
      audioDuration: messageData.audioDuration,
      file: messageData.file,
      fileName: messageData.fileName,
      fileSize: messageData.fileSize,
      fileType: messageData.fileType,
      senderId: {
        _id: authUser._id,
        fullName: authUser.fullName,
        profilePic: authUser.profilePic,
      },
      receiverId: toId(selectedUser._id),
      createdAt: new Date().toISOString(),
      isPending: true, // Flag để biết đây là pending message
    };

    // Update UI ngay lập tức (không đợi server response)
    set({ messages: [...messages, tempMessage] });

    // Gửi request lên server trong background
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Replace temp message with real message from server
      const currentMessages = get().messages;
      const { messagesCache, selectedUser } = get();

      // Remove temp message và add real message
      const withoutTemp = currentMessages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      // Kiểm tra xem real message đã tồn tại chưa (tránh duplicate)
      const hasRealMessage = withoutTemp.some(
        (msg) => msg._id === res.data._id
      );
      const newMessages = hasRealMessage
        ? withoutTemp
        : [...withoutTemp, res.data];

      // Update both current messages and cache
      set({
        messages: newMessages,
        messagesCache: {
          ...messagesCache,
          [selectedUser._id]: {
            messages: newMessages,
            timestamp: Date.now(),
          },
        },
      });
    } catch (error) {
      // Remove temp message on error
      set({
        messages: get().messages.filter((msg) => msg._id !== tempMessage._id),
      });
      toast.error(error.response?.data?.message || "Failed to send message");
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

      if (!selectedUser || !isMessageForMe || !isFromSelectedConversation) {
        console.log("🚫 Message filtered out:", {
          hasSelectedUser: !!selectedUser,
          isForMe: isMessageForMe,
          isFromConversation: isFromSelectedConversation,
          selId,
          sId,
          rId,
          meId,
        });
        return;
      }

      console.log("📨 New message accepted:", {
        messageId: newMessage._id,
        from: sId,
        to: rId,
        currentUser: meId,
        selectedUser: selId,
      });

      // Chống trùng tin (optimistic update vs server echo)
      const currentMessages = get().messages;
      const { messagesCache } = get();
      const userId = selectedUser._id;

      // Nếu message đã tồn tại (theo _id), không add
      const updatedMessages = currentMessages.some(
        (m) => m._id === newMessage._id
      )
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
  },

  addReaction: async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },
}));
