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

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
    const toId = (v) => typeof v === 'object' && v?._id ? String(v._id) : String(v);

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
      set({
        messages: (() => {
          const currentMessages = get().messages;
          // Remove temp message và add real message
          const withoutTemp = currentMessages.filter(msg => msg._id !== tempMessage._id);
          // Kiểm tra xem real message đã tồn tại chưa (tránh duplicate)
          const hasRealMessage = withoutTemp.some(msg => msg._id === res.data._id);
          return hasRealMessage ? withoutTemp : [...withoutTemp, res.data];
        })(),
      });
    } catch (error) {
      // Remove temp message on error
      set({
        messages: get().messages.filter(msg => msg._id !== tempMessage._id),
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
      const toId = (v) => typeof v === 'object' && v?._id ? String(v._id) : String(v);
      
      const selId = toId(selectedUser?._id);
      const sId = toId(newMessage.senderId);
      const rId = toId(newMessage.receiverId);
      const meId = toId(authUser?._id);

      // Logic filtering "cứng" hơn:
      // 1. Tin nhắn phải liên quan đến user hiện tại (là sender hoặc receiver)
      const isMessageForMe = (sId === meId || rId === meId);
      
      // 2. Tin nhắn phải thuộc conversation đang mở
      const isFromSelectedConversation = selectedUser && (sId === selId || rId === selId);

      if (!selectedUser || !isMessageForMe || !isFromSelectedConversation) {
        console.log('🚫 Message filtered out:', {
          hasSelectedUser: !!selectedUser,
          isForMe: isMessageForMe,
          isFromConversation: isFromSelectedConversation,
          selId, sId, rId, meId
        });
        return;
      }

      console.log('📨 New message accepted:', {
        messageId: newMessage._id,
        from: sId,
        to: rId,
        currentUser: meId,
        selectedUser: selId
      });

      // Chống trùng tin (optimistic update vs server echo)
      set({
        messages: (() => {
          const msgs = get().messages;
          // Nếu message đã tồn tại (theo _id), không add
          return msgs.some(m => m._id === newMessage._id)
            ? msgs
            : [...msgs, newMessage];
        })(),
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
