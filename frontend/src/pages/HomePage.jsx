import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import VoiceCallModal from "../components/VoiceCallModal";
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

    preloadData();
  }, [
    authUser,
    getUsers,
    getGroups,
    users.length,
    groups.length,
  ]);

  // Setup voice call modal using socket from useAuthStore
  useEffect(() => {
    const { socket, voiceCallManager } = useAuthStore.getState();
    
    if (!socket || !voiceCallManager) return;

    // Setup voice call modal handlers
    const originalOnIncomingCall = voiceCallManager.onIncomingCall;
    const originalOnCallInitiated = voiceCallManager.onCallInitiated;

      voiceCallManager.onIncomingCall = (callerId, offer) => {
      if (originalOnIncomingCall) originalOnIncomingCall(callerId, offer);
      
        setVoiceCallModal({
          isOpen: true,
          isIncoming: true,
          callerName: `User ${callerId.slice(0, 8)}`,
          offer,
          voiceCallManager,
        });
        toast("📞 Incoming voice call!");
      };

    voiceCallManager.onCallInitiated = (targetUserId) => {
      if (originalOnCallInitiated) originalOnCallInitiated(targetUserId);
      
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

    // Cleanup
    return () => {
      // Restore original handlers if needed
      if (voiceCallManager) {
        voiceCallManager.onIncomingCall = originalOnIncomingCall;
        voiceCallManager.onCallInitiated = originalOnCallInitiated;
      }
    };
  }, [selectedUser]);

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
