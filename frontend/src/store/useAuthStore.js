import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { createWebSocket } from "../lib/websocketClient.js";
import { VoiceCallManager } from "../lib/voiceCallUtils.js";

import { getSocketURL } from "../config/urls.js";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  voiceCallManager: null,
  callModal: {
    isOpen: false,
    isIncoming: false,
    callerId: null,
    callerName: null,
    offer: null,
  },

  checkAuth: async () => {
    const startTime = Date.now();
    try {
      // Optimize: Parallel check và timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timeout")), 8000)
      );

      const authPromise = axiosInstance.get("/auth/check");

      const res = await Promise.race([authPromise, timeoutPromise]);

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    const existingSocket = get().socket;
    if (existingSocket) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
      set({ socket: null });
    }

    if (typeof window !== "undefined" && window.clearURLCache) {
      window.clearURLCache();
    }

    const socketURL = getSocketURL();

    const socket = createWebSocket(socketURL, {
      query: {
        userId: authUser._id,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: false, // We'll connect manually
    });

    // Error handling
    socket.on("connect_error", (error) => {
      const errorMsg = error?.message || error || "Unknown error";
      console.error("❌ Socket connection error:", errorMsg);
      // Don't show toast for connection errors during initial connection attempts
      // Toast will be shown if max reconnect attempts are reached
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed - max attempts reached");
      toast.error("Không thể kết nối với server. Vui lòng tải lại trang.");
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    // Connect socket first
    socket.connect();

    // instantiate voice call manager and wire incoming call -> open modal
    const vcm = new VoiceCallManager(socket, authUser._id);

    // When someone calls us, open the call modal with the offer
    vcm.onIncomingCall = (callerId, offer) => {
      set({
        callModal: {
          isOpen: true,
          isIncoming: true,
          callerId,
          callerName: `User ${callerId.slice(-4)}`, // Show last 4 chars of ID as fallback
          offer,
        },
      });
    };

    // When we initiate a call, open modal in outgoing mode
    vcm.onCallInitiated = (targetUserId) => {
      set({
        callModal: {
          isOpen: true,
          isIncoming: false,
          callerId: targetUserId,
          callerName: `User ${targetUserId.slice(-4)}`, // Show last 4 chars of ID as fallback
          offer: null,
        },
      });
    };

    // Close modal on call end/disconnect
    vcm.onCallEnded = () => {
      set({
        callModal: {
          isOpen: false,
          isIncoming: false,
          callerId: null,
          callerName: null,
          offer: null,
        },
      });
    };
    vcm.onCallDisconnected = () => {
      set({
        callModal: {
          isOpen: false,
          isIncoming: false,
          callerId: null,
          callerName: null,
          offer: null,
        },
      });
    };

    set({ socket: socket, voiceCallManager: vcm });

    socket.on("getOnlineUsers", (userIds) => {
      const safeUserIds = Array.isArray(userIds) ? userIds : [];
      set({ onlineUsers: safeUserIds });
    });

    // Listen for friend accepted event - tự động refresh danh sách bạn bè
    socket.on("friendAccepted", (data) => {
      
      // Refresh danh sách users trong chat store để bạn mới hiện ngay
      import("../store/useChatStore.js").then((module) => {
        module.useChatStore.getState().getUsers(true); // forceRefresh = true
      });
    });
  },
  disconnectSocket: () => {
    const s = get().socket;
    const v = get().voiceCallManager;
    if (v) {
      try {
        v.destroy();
      } catch (e) {
        console.warn("Error destroying voiceCallManager:", e);
      }
      set({ voiceCallManager: null });
    }
    if (s) {
      s.removeAllListeners();
      s.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
