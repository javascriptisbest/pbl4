import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useFriendStore = create((set, get) => ({
  friends: [],
  pendingRequests: {
    sent: [],
    received: [],
  },
  searchResults: [],
  isFriendsLoading: false,
  isSearching: false,

  /**
   * Lấy danh sách bạn bè
   */
  getFriends: async () => {
    set({ isFriendsLoading: true });
    try {
      const res = await axiosInstance.get("/friends");
      set({ friends: res.data || [] });
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load friends");
      set({ friends: [] });
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  /**
   * Lấy danh sách friend requests đang chờ
   */
  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/pending");
      set({ pendingRequests: res.data || { sent: [], received: [] } });
    } catch (error) {
      console.error("Error loading pending requests:", error);
      set({ pendingRequests: { sent: [], received: [] } });
    }
  },

  /**
   * Gửi friend request
   */
  sendFriendRequest: async (userId) => {
    try {
      const res = await axiosInstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent");
      // Refresh pending requests
      get().getPendingRequests();
      return res.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to send friend request";
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Chấp nhận friend request
   */
  acceptFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/accept/${requestId}`);
      toast.success("Friend request accepted");
      // Refresh friends và pending requests
      get().getFriends();
      get().getPendingRequests();
      
      // Refresh danh sách users trong chat store để bạn mới hiện ngay
      const useChatStore = await import('./useChatStore').then(m => m.useChatStore);
      useChatStore.getState().getUsers(true); // forceRefresh = true
    } catch (error) {
      toast.error("Failed to accept friend request");
      throw error;
    }
  },

  /**
   * Từ chối friend request
   */
  rejectFriendRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/reject/${requestId}`);
      toast.success("Friend request rejected");
      // Refresh pending requests
      get().getPendingRequests();
    } catch (error) {
      toast.error("Failed to reject friend request");
      throw error;
    }
  },

  /**
   * Xóa bạn bè (unfriend)
   */
  removeFriend: async (userId) => {
    try {
      await axiosInstance.delete(`/friends/${userId}`);
      toast.success("Friend removed");
      // Refresh friends
      get().getFriends();
    } catch (error) {
      toast.error("Failed to remove friend");
      throw error;
    }
  },

  /**
   * Kiểm tra trạng thái friendship với một user
   */
  getFriendStatus: async (userId) => {
    try {
      const res = await axiosInstance.get(`/friends/status/${userId}`);
      return res.data;
    } catch (error) {
      console.error("Error getting friend status:", error);
      return { status: "none" };
    }
  },

  /**
   * Tìm kiếm users để thêm bạn
   */
  searchUsersToAdd: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/friends/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: res.data || [] });
    } catch (error) {
      console.error("Error searching users:", error);
      set({ searchResults: [] });
    } finally {
      set({ isSearching: false });
    }
  },
}));

