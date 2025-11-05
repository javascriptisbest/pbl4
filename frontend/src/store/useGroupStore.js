import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  groupsCache: null, // Cache groups data
  groupsCacheTime: null, // Thời gian cache

  getGroups: async (forceRefresh = false) => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    const now = Date.now();

    // Kiểm tra cache trước
    const { groupsCache, groupsCacheTime } = get();
    if (
      !forceRefresh &&
      groupsCache &&
      groupsCacheTime &&
      now - groupsCacheTime < CACHE_DURATION
    ) {
      console.log("📋 Using cached groups data");
      set({ groups: groupsCache });
      return;
    }

    set({ isGroupsLoading: true });
    const startTime = Date.now();

    try {
      const res = await axiosInstance.get("/groups");
      const groups = res.data;

      set({
        groups,
        groupsCache: groups,
        groupsCacheTime: now,
      });

      console.log(`👥 Groups loaded in ${Date.now() - startTime}ms`);
    } catch (error) {
      // Fallback to cache nếu có lỗi network
      if (groupsCache) {
        console.log("📋 Network error, using cached groups");
        set({ groups: groupsCache });
      } else {
        toast.error(error.response?.data?.message || "Failed to load groups");
      }
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      set({ groups: [res.data, ...get().groups] });
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create group");
      throw error;
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  sendGroupMessage: async (groupId, messageData) => {
    const { groupMessages } = get();
    const authUser = useAuthStore.getState().authUser;

    // Create temporary message for immediate UI update
    const tempMessage = {
      _id: Date.now().toString(),
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
      groupId: groupId,
      messageType: "group",
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    // Update UI immediately
    set({ groupMessages: [...groupMessages, tempMessage] });

    try {
      const res = await axiosInstance.post(
        `/groups/${groupId}/messages`,
        messageData
      );

      // Replace temp message with real message from server
      const updatedMessages = groupMessages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      set({ groupMessages: [...updatedMessages, res.data] });

      // Update group's last message
      set({
        groups: get().groups.map((g) =>
          g._id === groupId
            ? { ...g, lastMessage: res.data, lastMessageAt: new Date() }
            : g
        ),
      });
    } catch (error) {
      // Remove temp message on error
      const updatedMessages = groupMessages.filter(
        (msg) => msg._id !== tempMessage._id
      );
      set({ groupMessages: updatedMessages });
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  addGroupReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/reaction`, {
        emoji,
      });
      set({
        groupMessages: get().groupMessages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Unsubscribe trước để tránh duplicate listeners
    socket.off("newGroupMessage");
    socket.off("newGroup");
    socket.off("messageReaction");

    socket.on("newGroupMessage", (message) => {
      const { selectedGroup, groupMessages } = get();
      if (selectedGroup && selectedGroup._id === message.groupId) {
        set({ groupMessages: [...groupMessages, message] });
      }

      // Update group list
      set({
        groups: get().groups.map((g) =>
          g._id === message.groupId
            ? { ...g, lastMessage: message, lastMessageAt: new Date() }
            : g
        ),
      });
    });

    socket.on("newGroup", (group) => {
      set({ groups: [group, ...get().groups] });
      toast.success(`You were added to ${group.name}`);
    });

    socket.on("messageReaction", (updatedMessage) => {
      if (updatedMessage.messageType === "group") {
        set({
          groupMessages: get().groupMessages.map((msg) =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          ),
        });
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
      socket.off("newGroup");
      socket.off("messageReaction");
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: null,
        groupMessages: [],
      });
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to leave group");
    }
  },
}));
