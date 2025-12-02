import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { getSocketURL } from "../config/urls.js";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import VoiceCallModal from "../components/VoiceCallModal";
import { VoiceCallManager } from "../lib/voiceCallUtils";
import { measureAsync } from "../lib/performanceMonitor";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const HomePage = () => {
  const { selectedUser, getUsers, users } = useChatStore();
  const { selectedGroup, getGroups, groups } = useGroupStore();
  const { authUser } = useAuthStore();

  // Simple voice call modal state
  const [voiceCallModal, setVoiceCallModal] = useState({
    isOpen: false,
    isIncoming: false,
    callerName: "",
    offer: null,
    voiceCallManager: null,
  });

  useEffect(() => {
    if (!authUser) return;

    // Preload users and groups for instant sidebar switching
    const preloadData = measureAsync("preloadChatData", async () => {
      console.log("🚀 HomePage: Preloading chat data...");

      // Load users if not already loaded
      if (!users.length) {
        console.log("👥 Loading users...");
        await getUsers();
      }

      // Load groups if not already loaded
      if (!groups.length) {
        console.log("👥 Loading groups...");
        await getGroups();
      }
    });

    // Measure voice call setup performance
    const setupVoiceCall = measureAsync("voiceCallSetup", async () => {
      console.log("🔧 Initializing voice call system...");

      // Simple socket connection với URL detection
      const socketURL = getSocketURL();
      console.log("🌐 Voice call socket URL:", socketURL, {
        location: window?.location?.href,
        timestamp: Date.now(),
        version: "voice-v2.1",
      });

      const socket = io(socketURL, {
        query: { userId: authUser._id },
        transports: ["polling", "websocket"],
        forceNew: true, // Force new connection
      });

      socket.on("connect", () => {
        console.log("✅ Voice call socket connected");
      });

      // Initialize voice call manager
      const voiceCallManager = new VoiceCallManager(socket, authUser._id);
      window.voiceCallManager = voiceCallManager;

      // Simple event handlers
      voiceCallManager.onIncomingCall = (callerId, offer) => {
        console.log("📞 Incoming call from:", callerId);
        setVoiceCallModal({
          isOpen: true,
          isIncoming: true,
          callerName: `User ${callerId.slice(0, 8)}`,
          offer,
          voiceCallManager,
        });
        toast("📞 Incoming voice call!");
      };

      voiceCallManager.onCallInitiated = () => {
        console.log("📞 Call initiated");
        setVoiceCallModal({
          isOpen: true,
          isIncoming: false,
          callerName: selectedUser?.fullName || "User",
          offer: null,
          voiceCallManager,
        });
        toast("📞 Calling...");
      };

      voiceCallManager.onCallDisconnected = () => {
        console.log("📞 Call disconnected");
        setVoiceCallModal({
          isOpen: false,
          isIncoming: false,
          callerName: "",
          offer: null,
          voiceCallManager: null,
        });
      };

      voiceCallManager.onCallRejected = () => {
        console.log("📞 Call rejected");
        setVoiceCallModal({
          isOpen: false,
          isIncoming: false,
          callerName: "",
          offer: null,
          voiceCallManager: null,
        });
      };

      voiceCallManager.onCallConnected = () => {
        console.log("📞 Call connected!");
        toast.success("Call connected");
      };

      voiceCallManager.onCallFailed = (error) => {
        console.log("📞 Call failed:", error);
        setVoiceCallModal({
          isOpen: false,
          isIncoming: false,
          callerName: "",
          offer: null,
          voiceCallManager: null,
        });
        toast.error(`Call failed: ${error}`);
      };

      return socket;
    });

    setupVoiceCall().then((socket) => {
      // Cleanup function setup
      return () => {
        console.log("🧹 Cleaning up voice call system");
        if (window.voiceCallManager) {
          window.voiceCallManager.destroy();
          window.voiceCallManager = null;
        }
        socket.disconnect();
      };
    });

    // Run preload in parallel
    preloadData();

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up voice call system");
      if (window.voiceCallManager) {
        window.voiceCallManager.destroy();
        window.voiceCallManager = null;
      }
    };
  }, [
    authUser,
    selectedUser,
    getUsers,
    getGroups,
    users.length,
    groups.length,
  ]);

  const handleCloseCallModal = () => {
    console.log("❌ Closing call modal");
    setVoiceCallModal({
      isOpen: false,
      isIncoming: false,
      callerName: "",
      offer: null,
      voiceCallManager: null,
    });

    if (voiceCallModal.voiceCallManager?.isCallActive) {
      voiceCallModal.voiceCallManager.endCall();
    }
  };

  return (
    <div className="h-screen">
      <Navbar />
      <div className="h-full pt-16">
        <div className="bg-white w-full h-full">
          <div className="flex h-full overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
              {!selectedUser && !selectedGroup && <NoChatSelected />}
              {selectedUser && <ChatContainer />}
              {selectedGroup && <GroupChatContainer />}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Voice Call Modal */}
      <VoiceCallModal
        isOpen={voiceCallModal.isOpen}
        isIncoming={voiceCallModal.isIncoming}
        callerName={voiceCallModal.callerName}
        offer={voiceCallModal.offer}
        voiceCallManager={voiceCallModal.voiceCallManager}
        onClose={handleCloseCallModal}
      />
    </div>
  );
};

export default HomePage;
