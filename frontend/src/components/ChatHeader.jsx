import { X, Phone, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, voiceCallManager } = useAuthStore();

  const handleVoiceCall = async () => {
    if (!voiceCallManager) {
      toast.error("Voice call not available");
      return;
    }

    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    try {
      // Set caller name in the store before initiating call
      const { callModal } = useAuthStore.getState();
      useAuthStore.setState({
        callModal: {
          ...callModal,
          callerName: selectedUser.fullName,
        },
      });

      await voiceCallManager.initiateCall(selectedUser._id);
      toast.success(`Calling ${selectedUser.fullName}...`);
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-circle md:hidden"
            title="Back to contacts"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Call and Close buttons */}
        <div className="flex items-center gap-2">
          {/* Voice Call button */}
          <button
            onClick={handleVoiceCall}
            className="btn btn-ghost btn-sm btn-circle"
            title={`Call ${selectedUser.fullName}`}
            disabled={!onlineUsers.includes(selectedUser._id)}
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Close button - hidden on mobile (use back button instead) */}
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm btn-circle hidden md:flex"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
