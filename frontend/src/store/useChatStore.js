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

    // If we have cached messages for this user, show them immediately
    const cached = messagesCache[userId];
    if (cached) {
      const cacheAge = Date.now() - cached.timestamp;

      // Use cache if less than 2 minutes old
      if (cacheAge < 2 * 60 * 1000) {
        console.log(`💬 Using cached messages for user ${userId} (${cached.preloadLevel || 'full'})`);
        set({ messages: cached.messages });
        
        // Nếu chỉ là preview (5 tin), load thêm tin nhắn trong background
        if (cached.preloadLevel === "preview" || cached.hasMore) {
          console.log("🔄 Loading more messages in background...");
          getMessages(userId, true); // Force refresh để load full
        }
      } else {
        // Cache expired, reload
        set({ messages: cached.messages }); // Show stale data first
        getMessages(userId, true);
      }
    } else {
      // No cache, load fresh
      set({ messages: [] });
      getMessages(userId);
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
      
      console.log(`✅ Marked messages from ${userId} as read`);
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
      
      // Preload messages sau khi load users (background)
      get().preloadMessages();
    } catch (error) {
      console.error("Error loading users:", error);
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
  
  // Preload messages cho tất cả users (background)
  // Top 5: 50 tin, còn lại: 5 tin
  preloadMessages: async () => {
    const { messagesCache } = get();
    
    // Nếu đã có cache, không preload lại
    if (Object.keys(messagesCache).length > 0) {
      console.log("📋 Messages already cached, skipping preload");
      return;
    }
    
    try {
      console.log("🔄 Preloading messages...");
      const startTime = Date.now();
      
      const res = await axiosInstance.get("/messages/preload");
      const preloadedData = res.data;
      
      // Merge vào cache
      const newCache = {};
      for (const [userId, data] of Object.entries(preloadedData)) {
        newCache[userId] = {
          messages: data.messages,
          timestamp: Date.now(),
          hasMore: data.hasMore,
          preloadLevel: data.preloadLevel,
        };
      }
      
      set({ messagesCache: { ...messagesCache, ...newCache } });
      
      const fullCount = Object.values(preloadedData).filter(d => d.preloadLevel === "full").length;
      const previewCount = Object.values(preloadedData).filter(d => d.preloadLevel === "preview").length;
      
      console.log(`✅ Preloaded messages in ${Date.now() - startTime}ms`);
      console.log(`   📬 Full (50 msgs): ${fullCount} users`);
      console.log(`   📩 Preview (5 msgs): ${previewCount} users`);
    } catch (error) {
      console.error("Error preloading messages:", error);
      // Không show toast vì đây là background operation
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

    // Validation: Kiểm tra các điều kiện cần thiết
    if (!authUser) {
      toast.error("Please login to send messages");
      console.error("❌ sendMessage: No authenticated user");
      return;
    }

    if (!selectedUser || !selectedUser._id) {
      toast.error("Please select a user to chat with");
      console.error("❌ sendMessage: No selected user", { selectedUser });
      return;
    }

    // Validate message content
    if (
      !messageData.text &&
      !messageData.image &&
      !messageData.video &&
      !messageData.audio &&
      !messageData.file
    ) {
      toast.error("Message content is required");
      console.error("❌ sendMessage: No message content");
      return;
    }

    // Helper function: Chuẩn hóa ID (ObjectId vs string)
    const toId = (v) =>
      typeof v === "object" && v?._id ? String(v._id) : String(v);

    const receiverId = toId(selectedUser._id);

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
      receiverId: receiverId,
      createdAt: new Date().toISOString(),
      isPending: true, // Flag để biết đây là pending message
    };

    // Update UI ngay lập tức (không đợi server response)
    set({ messages: [...messages, tempMessage] });

    // Gửi request lên server trong background
    try {
      const res = await axiosInstance.post(
        `/messages/send/${receiverId}`,
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
      const { users } = get();
      
      // Cập nhật lastMessage trong sidebar
      const updatedUsers = users.map(user => {
        if (user._id === selectedUser._id) {
          return {
            ...user,
            lastMessage: {
              text: res.data.text,
              image: res.data.image,
              video: res.data.video,
              audio: res.data.audio,
              file: res.data.file,
              senderId: res.data.senderId,
              createdAt: res.data.createdAt,
            },
          };
        }
        return user;
      });
      
      // Sắp xếp lại: người vừa chat lên đầu
      updatedUsers.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const timeB = b.lastMessage?.createdAt
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        return timeB - timeA;
      });
      
      set({
        messages: newMessages,
        users: updatedUsers,
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
      
      // Better error handling with specific error messages
      let errorMessage = "Failed to send message";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          errorMessage = "Authentication failed. Please login again";
          // Optionally redirect to login
          console.error("❌ Authentication error, clearing auth state");
        } else if (status === 400) {
          errorMessage = data?.message || data?.error || "Invalid message data";
        } else if (status === 404) {
          errorMessage = "User not found";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later";
        } else {
          errorMessage = data?.message || data?.error || errorMessage;
        }
        
        console.error("❌ Send message error:", {
          status,
          message: data?.message || data?.error,
          data,
        });
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your connection";
        console.error("❌ Network error:", error.message);
      } else {
        // Something else happened
        console.error("❌ Send message error:", error.message);
      }
      
      toast.error(errorMessage);
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

      if (!isMessageForMe) {
        console.log("🚫 Message not for me, ignoring");
        return;
      }

      // Nếu tin nhắn không thuộc conversation đang mở
      // -> Cập nhật unreadCount và lastMessage trong sidebar
      if (!selectedUser || !isFromSelectedConversation) {
        console.log("📬 New message from different conversation, updating sidebar");
        
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
        const messageText = newMessage.text 
          ? (newMessage.text.length > 50 ? newMessage.text.substring(0, 50) + "..." : newMessage.text)
          : newMessage.image ? "📷 Đã gửi ảnh"
          : newMessage.video ? "🎥 Đã gửi video"
          : newMessage.audio ? "🎵 Đã gửi audio"
          : newMessage.file ? "📄 Đã gửi file"
          : "Đã gửi tin nhắn";
        
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
        msg._id === messageId ? { ...msg, text: newText, isEdited: true } : msg
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
