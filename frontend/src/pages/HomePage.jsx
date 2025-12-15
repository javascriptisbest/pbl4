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
import { createWebSocket } from "../lib/websocketClient.js";
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

    // Preload data không blocking - chạy background
    const preloadData = async () => {
      try {
        if (!users.length) await getUsers();
        if (!groups.length) await getGroups();
      } catch (error) {
        // Silent fail
      }
    };

    const setupVoiceCall = async () => {
      const socketURL = getSocketURL();

      const socket = createWebSocket(socketURL, {
        query: { userId: authUser._id },
        forceNew: true, // Force new connection
      });

      socket.on("connect_error", (error) => {
        console.error("Voice call socket error:", error.message);
      });

      // Initialize voice call manager
      const voiceCallManager = new VoiceCallManager(socket, authUser._id);
      window.voiceCallManager = voiceCallManager;

      voiceCallManager.onIncomingCall = (callerId, offer) => {
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
        setVoiceCallModal({
          isOpen: false,
          isIncoming: false,
          callerName: "",
          offer: null,
          voiceCallManager: null,
        });
      };

      voiceCallManager.onCallRejected = () => {
        setVoiceCallModal({
          isOpen: false,
          isIncoming: false,
          callerName: "",
          offer: null,
          voiceCallManager: null,
        });
      };

      voiceCallManager.onCallConnected = () => {
        toast.success("Call connected");
      };

      voiceCallManager.onCallFailed = (error) => {
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
    };

    setupVoiceCall();

    // Cleanup function
    return () => {
      if (window.voiceCallManager) {
        window.voiceCallManager.destroy();
        window.voiceCallManager = null;
      }
    };

    preloadData();

    return () => {
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
