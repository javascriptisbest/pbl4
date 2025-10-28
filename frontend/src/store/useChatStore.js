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

    // Optimistic UI Update: Tạo message tạm để hiển thị ngay
    const tempMessage = {
      _id: Date.now().toString(), // Temporary ID
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
      receiverId: selectedUser._id,
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
      const updatedMessages = messages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      set({ messages: [...updatedMessages, res.data] });
    } catch (error) {
      // Remove temp message on error
      const updatedMessages = messages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      set({ messages: updatedMessages });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
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
