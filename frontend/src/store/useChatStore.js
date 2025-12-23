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
import { showNewMessageNotification } from "../lib/floatingNotifications.js";

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
  
  // Debug performance
  _debugPerformance: false, // Set true để enable debugging
  
  // Force refresh functions for debugging
  forceRefreshUsers: () => {
    const { getUsers } = get();
    set({ users: [], usersCache: null, usersCacheTime: null });
    getUsers(true);
  },
  
  forceRefreshMessages: (userId) => {
    const { getMessages, messagesCache } = get();
    const newCache = { ...messagesCache };
    delete newCache[userId];
    set({ messages: [], messagesCache: newCache });
    if (userId) getMessages(userId, true);
  },

  // Set selected user with immediate cache check
  setSelectedUser: (user) => {
    const { messagesCache, markAsRead, users, getMessages } = get();
    const userId = user?._id;

    // Update selected user immediately với force re-render
    set({ selectedUser: user });

    if (!userId) {
      set({ messages: [] });
      return;
    }

    // Mark messages as read ngay lập tức (optimistic update)
    const userInList = users.find(u => u._id === userId);
    if (userInList?.unreadCount > 0) {
      markAsRead(userId); // Đã có optimistic update
    }

    const cached = messagesCache[userId];
    if (!cached) {
      console.log(`📭 No cache for user ${userId}, loading...`);
      set({ messages: [] });
      getMessages(userId);
      return;
    }

    const cacheAge = Date.now() - cached.timestamp;
    const isValidCache = cacheAge < 2 * 60 * 1000;
    
    // ✅ HIỂN THỊ CACHED MESSAGES NGAY LẬP TỨC (instant loading)
    console.log(`⚡ Loading from cache (${cached.messages.length} messages, age: ${Math.round(cacheAge/1000)}s, level: ${cached.preloadLevel}, needsRefresh: ${cached.needsRefresh || false})`);
    set({ messages: [...cached.messages] }); // Spread để force new array reference
    
    // Load background nếu cần refresh (KHÔNG HIỆN LOADING SPINNER)
    // Luôn refresh nếu: cache cũ, preload level thấp, có thêm messages, hoặc được đánh dấu needsRefresh
    if (!isValidCache || cached.preloadLevel === "preview" || cached.hasMore || cached.needsRefresh) {
      console.log(`🔄 Refreshing messages in background...`);
      // Gọi getMessages nhưng KHÔNG set isMessagesLoading = true
      const refreshMessages = async () => {
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          const messages = res.data;
          const currentSelected = get().selectedUser;
          
          // Chỉ update nếu user vẫn đang xem conversation này
          if (currentSelected?._id === userId) {
            set({
              messages,
              messagesCache: {
                ...get().messagesCache,
                [userId]: { messages, timestamp: Date.now(), hasMore: false, preloadLevel: "full", needsRefresh: false },
              },
            });
            console.log(`✅ Background refresh complete (${messages.length} messages)`);
          }
        } catch (error) {
          console.log(`⚠️ Background refresh failed (using cached messages)`);
        }
      };
      refreshMessages();
    }
  },
  
  // Đánh dấu tin nhắn đã đọc
  markAsRead: async (userId) => {
    // Optimistic update - cập nhật UI ngay lập tức
    const { users } = get();
    const updatedUsers = users.map(user => 
      user._id === userId 
        ? { ...user, unreadCount: 0 }
        : user
    );
    set({ users: updatedUsers }); // Force re-render ngay lập tức
    
    try {
      await axiosInstance.post(`/messages/read/${userId}`);
      // Success - optimistic update đã đúng
    } catch (error) {
      console.error("Error marking messages as read:", error);
      // Rollback optimistic update nếu có lỗi
      const originalUsers = get().users.map(user => 
        user._id === userId 
          ? { ...user, unreadCount: user.unreadCount || 1 }
          : user
      );
      set({ users: originalUsers });
      toast.error("Không thể đánh dấu đã đọc");
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
      
      // ✅ Filter out current user (chính mình) từ danh sách
      const authUser = useAuthStore.getState().authUser;
      const filteredUsers = users.filter(user => user._id !== authUser?._id);
      
      if (users.length !== filteredUsers.length) {
        console.warn(`⚠️ Removed ${users.length - filteredUsers.length} self-user from list`);
      }

      set({
        users: filteredUsers,
        usersCache: filteredUsers,
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
  preloadMessages: async (forceRefresh = false) => {
    const { messagesCache } = get();
    
    // Cho phép refresh lại sau 5 phút nếu forceRefresh = true
    if (!forceRefresh && Object.keys(messagesCache).length > 0) {
      console.log(`✅ Messages already preloaded (${Object.keys(messagesCache).length} conversations)`);
      return;
    }
    
    console.log(`🚀 Preloading messages for all conversations...`);
    const startTime = Date.now();
    
    try {
      // Timeout riêng cho preload (ngắn hơn để không block)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await axiosInstance.get("/messages/preload", { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const newCache = {};
      let totalMessages = 0;
      for (const [userId, data] of Object.entries(res.data || {})) {
        newCache[userId] = {
          messages: data.messages || [],
          timestamp: Date.now(),
          hasMore: data.hasMore || false,
          preloadLevel: data.preloadLevel || "preview",
        };
        totalMessages += data.messages?.length || 0;
      }
      
      set({ messagesCache: { ...messagesCache, ...newCache } });
      console.log(`✅ Preloaded ${totalMessages} messages for ${Object.keys(newCache).length} conversations in ${Date.now() - startTime}ms`);
    } catch (error) {
      // Silent fail - không ảnh hưởng UX
      if (error.name === "AbortError") {
        console.log(`⚠️ Preload timeout after 15s`);
      } else {
        console.log(`⚠️ Preload failed:`, error.message);
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
  sendMessage: async (messageData, videoFile = null, fileFile = null) => {
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

    // Optimistic update: Hiển thị message ngay cho sender
    const tempMessage = {
      _id: `temp_${Date.now()}_${Math.random()}`,
      ...messageData,
      senderId: { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
      receiverId,
      createdAt: new Date().toISOString(),
      isPending: true,
      // Thêm placeholder cho video/file đang upload
      ...(videoFile && { video: "uploading...", videoUploading: true }),
      ...(fileFile && { file: "uploading...", fileUploading: true }),
    };

    set({ messages: [...messages, tempMessage] });

    try {
      console.log(`💬 Sending message to user: ${receiverId}`);
      console.time("⏱️ Send message total time");
      
      let finalMessageData = { ...messageData };
      
      // Upload video/file trong background (song song nếu có cả 2)
      const uploadPromises = [];
      
      if (videoFile) {
        console.log(`📹 Uploading video file: ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB)`);
        console.time("⏱️ Upload video to Cloudinary");
        
        const formData = new FormData();
        formData.append("file", videoFile);
        formData.append("type", "video");
        
        const { axiosFileInstance } = await import("../lib/axios.js");
        const uploadPromise = axiosFileInstance.post("/images/upload-direct", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              const uploadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
              const totalMB = (progressEvent.total / (1024 * 1024)).toFixed(1);
              
              // Update temp message với progress
              const currentMessages = get().messages;
              const updatedMessages = currentMessages.map(msg => 
                msg._id === tempMessage._id 
                  ? { ...msg, video: `uploading... ${percentCompleted}% (${uploadedMB}MB/${totalMB}MB)` }
                  : msg
              );
              set({ messages: updatedMessages });
              
              if (percentCompleted % 25 === 0) {
                console.log(`📤 Upload progress: ${percentCompleted}%`);
              }
            }
          },
        }).then(response => {
          console.timeEnd("⏱️ Upload video to Cloudinary");
          console.log(`✅ Video uploaded: ${response.data.fileUrl}`);
          return { type: "video", url: response.data.fileUrl };
        });
        
        uploadPromises.push(uploadPromise);
      }
      
      if (fileFile) {
        console.log(`📎 Uploading file: ${fileFile.name} (${(fileFile.size / (1024 * 1024)).toFixed(2)}MB)`);
        console.time("⏱️ Upload file to Cloudinary");
        
        const formData = new FormData();
        formData.append("file", fileFile);
        formData.append("type", "file");
        
        const { axiosFileInstance } = await import("../lib/axios.js");
        const uploadPromise = axiosFileInstance.post("/images/upload-direct", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              // Update temp message với progress
              const currentMessages = get().messages;
              const updatedMessages = currentMessages.map(msg => 
                msg._id === tempMessage._id 
                  ? { ...msg, file: `uploading... ${percentCompleted}%` }
                  : msg
              );
              set({ messages: updatedMessages });
            }
          },
        }).then(response => {
          console.timeEnd("⏱️ Upload file to Cloudinary");
          console.log(`✅ File uploaded: ${response.data.fileUrl}`);
          return { 
            type: "file", 
            url: response.data.fileUrl,
            fileName: fileFile.name,
            fileSize: fileFile.size,
            fileType: fileFile.type,
          };
        });
        
        uploadPromises.push(uploadPromise);
      }
      
      // Đợi tất cả uploads hoàn thành
      if (uploadPromises.length > 0) {
        toast.loading("Uploading media...", { id: "upload-progress" });
        const uploadResults = await Promise.all(uploadPromises);
        
        uploadResults.forEach(result => {
          if (result.type === "video") {
            finalMessageData.video = result.url;
          } else if (result.type === "file") {
            finalMessageData.file = result.url;
            // Preserve file metadata if not already in messageData
            if (!finalMessageData.fileName && result.fileName) {
              finalMessageData.fileName = result.fileName;
            }
            if (!finalMessageData.fileSize && result.fileSize) {
              finalMessageData.fileSize = result.fileSize;
            }
            if (!finalMessageData.fileType && result.fileType) {
              finalMessageData.fileType = result.fileType;
            }
          }
        });
        
        toast.dismiss("upload-progress");
      }
      
      // Clean up placeholder values before sending
      if (finalMessageData.video === "pending") delete finalMessageData.video;
      if (finalMessageData.file === "pending") delete finalMessageData.file;
      
      // Debug: Log what's being sent to backend
      console.log("📤 Sending message data to backend:", JSON.stringify(finalMessageData, null, 2));
      
      // Use axiosFileInstance for video/file uploads (longer timeout - 10 minutes)
      const client = finalMessageData.video || finalMessageData.file 
        ? axiosFileInstance 
        : axiosInstance;
      
      console.time("⏱️ API request time");
      const res = await client.post(`/messages/send/${receiverId}`, finalMessageData);
      console.timeEnd("⏱️ API request time");
      
      console.timeEnd("⏱️ Send message total time");
      console.log(`✅ Message sent successfully! Message ID: ${res.data._id}`);
      
      // Replace temp message with real message
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
        messagesCache: { 
          ...messagesCache, 
          [selectedUser._id]: { 
            messages: newMessages, 
            timestamp: Date.now(),
            needsRefresh: false,
          } 
        },
      });
    } catch (error) {
      console.timeEnd("⏱️ Send message total time");
      console.error("❌ Send message error:", error);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);
      
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
      } else if (error.response?.status === 500) {
        // Log more details for 500 errors
        console.error("❌ Server error details:", {
          error: error.response?.data?.error,
          message: error.response?.data?.message,
          timestamp: error.response?.data?.timestamp,
        });
        errorMessage = error.response?.data?.error || error.response?.data?.message || "Server error. Please try again.";
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
      const sId = toId(newMessage.senderId?._id || newMessage.senderId);
      const rId = toId(newMessage.receiverId);
      const meId = toId(authUser?._id);

      console.log("🔔 New message received:", { 
        senderId: sId, 
        receiverId: rId, 
        myId: meId, 
        selectedUserId: selId,
        text: newMessage.text?.substring(0, 30) || "media"
      });

      // Logic filtering "cứng" hơn:
      // 1. Tin nhắn phải liên quan đến user hiện tại (là sender hoặc receiver)
      const isMessageForMe = sId === meId || rId === meId;

      // 2. Tin nhắn phải thuộc conversation đang mở
      const isFromSelectedConversation =
        selectedUser && (sId === selId || rId === selId);

      console.log("📊 Message check:", { isMessageForMe, isFromSelectedConversation });

      if (!isMessageForMe) {
        console.log("❌ Message not for me, ignoring");
        return;
      }

      // Nếu KHÔNG ĐANG XEM conversation này → Chỉ update sidebar
      if (!selectedUser || !isFromSelectedConversation) {
        console.log("📬 Message for different conversation, updating sidebar only");
        
        // Cập nhật users list với unreadCount + 1 và lastMessage mới
        const { users, messagesCache } = get();
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
        
        // ✅ QUAN TRỌNG: Update cache messages cho conversation này
        // Để khi user click vào, tin nhắn mới đã có sẵn
        const otherUserId = sId === meId ? rId : sId; // ID của người kia
        const cachedConversation = messagesCache[otherUserId];
        
        if (cachedConversation) {
          const isDuplicate = cachedConversation.messages.some(m => m._id === newMessage._id);
          
          if (!isDuplicate) {
            const updatedCachedMessages = [...cachedConversation.messages, newMessage];
            set({
              messagesCache: {
                ...messagesCache,
                [otherUserId]: {
                  ...cachedConversation,
                  messages: updatedCachedMessages,
                  timestamp: Date.now(), // Update timestamp
                  needsRefresh: false, // Đã có tin nhắn mới, không cần refresh thêm
                },
              },
            });
            console.log(`✅ Updated cache for conversation ${otherUserId}, total: ${updatedCachedMessages.length}`);
          }
        } else {
          console.log(`⚠️ No cache found for conversation ${otherUserId}, will load when user opens it`);
        }
        
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
        
        // 🔔 Show notifications
        const sender = updatedUsers.find(u => u._id === sId);
        const senderData = {
          fullName: sender?.fullName || "Ai đó",
          profilePic: sender?.profilePic,
        };
        
        // Desktop notification (browser notification)
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
          senderData.fullName,
          messageText,
          senderData.profilePic || "/avatar.png",
          () => {
            const { setSelectedUser } = get();
            setSelectedUser(sId);
          }
        );

        // Floating notification (in-app notification)
        showNewMessageNotification(
          newMessage,
          senderData,
          () => {
            const { setSelectedUser } = get();
            setSelectedUser(sId);
            window.focus(); // Focus window when click notification
          }
        );
        
        set({ users: updatedUsers });
        return;
      }

      // ✅ ĐANG XEM conversation này → Update messages trong chat
      console.log("💬 Message for current conversation, adding to chat");
      
      // Chống trùng tin (optimistic update vs server echo)
      const currentMessages = get().messages;
      const { messagesCache, users } = get();
      const userId = selectedUser._id;

      const isDuplicate = currentMessages.some(m => m._id === newMessage._id);
      
      if (isDuplicate) {
        console.log("⚠️ Duplicate message detected, skipping");
        return;
      }

      const updatedMessages = [...currentMessages, newMessage];
      
      console.log("✅ Added new message to chat, total:", updatedMessages.length);

      // Update messages và cache
      set({
        messages: updatedMessages,
        messagesCache: {
          ...messagesCache,
          [userId]: {
            messages: updatedMessages,
            timestamp: Date.now(),
            needsRefresh: false, // Đã có tin mới nhất
          },
        },
      });

      // Update sidebar lastMessage
      const updatedUsers = users.map(user => {
        if (user._id === userId) {
          return {
            ...user,
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

      set({ users: updatedUsers });
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

    // Listen for user list updates (unread count changes)
    socket.on("userListUpdate", (updatedUser) => {
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === updatedUser._id ? { ...user, ...updatedUser } : user
      );
      set({ users: updatedUsers }); // Force re-render
    });

    // Listen for unread count changes
    socket.on("unreadCountUpdate", ({ userId, unreadCount }) => {
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, unreadCount } : user
      );
      set({ users: updatedUsers }); // Force re-render
    });

    // Listen for messages read confirmation (từ người khác đọc tin mình gửi)
    socket.on("messagesRead", ({ readerId, count }) => {
      // Update read status for messages if needed
      // Có thể update UI để show "Đã xem" status
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageReaction");
    socket.off("messageDeleted");
    socket.off("messageEdited");
    socket.off("userListUpdate");
    socket.off("unreadCountUpdate");
    socket.off("messagesRead");
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
