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

      console.log(`✅ Auth check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });

      // Nếu timeout hoặc network error, vẫn cho user vào offline mode
      if (
        error.message === "Auth check timeout" ||
        error.code === "NETWORK_ERROR"
      ) {
        console.log("🔄 Running in offline mode");
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      
      // Lưu token vào localStorage cho cross-origin auth
      if (res.data.token) {
        localStorage.setItem('jwt_token', res.data.token);
      }
      
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
      
      // Lưu token vào localStorage cho cross-origin auth
      if (res.data.token) {
        localStorage.setItem('jwt_token', res.data.token);
      }
      
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      
      // Xóa token khỏi localStorage
      localStorage.removeItem('jwt_token');
      
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
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // Disconnect existing socket first to prevent conflicts
    const existingSocket = get().socket;
    if (existingSocket) {
      console.log("🔄 Disconnecting existing socket before reconnecting...");
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
      set({ socket: null });
    }

    // Force clear any cached URLs for fresh detection
    if (typeof window !== "undefined" && window.clearURLCache) {
      window.clearURLCache();
    }

    const socketURL = getSocketURL();
    console.log("🔌 Auth socket connecting to:", socketURL, {
      location: window?.location?.href,
      timestamp: Date.now(),
      version: "auth-v3.0",
    });

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
      console.error("❌ Socket connection error:", error.message);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Socket reconnection failed");
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected successfully, ID:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("📴 Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

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

    // Listen for friend accepted event
    socket.on("friendAccepted", ({ friendship, message }) => {
      console.log("✅ Friend accepted event received:", friendship);
      toast.success(message || "Friend request accepted");
      
      // Refresh danh sách users trong chat store
      import("./useChatStore.js").then((module) => {
        module.useChatStore.getState().getUsers(true);
      });
    });

    // ✅ Subscribe to chat messages immediately when socket connects
    // This ensures messages are received even when no chat is open
    import("./useChatStore.js").then((module) => {
      console.log("📬 Setting up direct message listeners...");
      module.useChatStore.getState().subscribeToMessages();
    });

    // ✅ Subscribe to group messages
    import("./useGroupStore.js").then((module) => {
      console.log("📬 Setting up group message listeners...");
      module.useGroupStore.getState().subscribeToGroupMessages();
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
