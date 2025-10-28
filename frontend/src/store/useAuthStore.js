import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { VoiceCallManager } from "../lib/voiceCallUtils.js";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SOCKET_URL || "http://localhost:5002"
    : "/";

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
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
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
      console.error("Login error:", error);
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
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
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
      set({ onlineUsers: userIds });
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
    if (s?.connected) s.disconnect();
  },
}));
