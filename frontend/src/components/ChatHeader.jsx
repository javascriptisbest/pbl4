import { X, Phone } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Simple voice call function
  const handleVoiceCall = () => {
    console.log('📞 Voice call button clicked');
    
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    // Use global voice call manager
    if (window.voiceCallManager) {
      try {
        window.voiceCallManager.initiateCall(selectedUser._id);
        console.log('📞 Call initiated to:', selectedUser.fullName);
        toast('Calling ' + selectedUser.fullName);
      } catch (error) {
        console.error('Call error:', error);
        toast.error('Failed to start call');
      }
    } else {
      console.error('Voice call manager not available');
      toast.error('Voice calling not available');
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
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

        {/* Call and close buttons */}
        <div className="flex items-center gap-2">
          {/* Voice Call Button */}
          <button
            onClick={handleVoiceCall}
            className="btn btn-sm btn-circle btn-ghost hover:bg-blue-100 text-blue-600"
            title="Voice Call"
          >
            <Phone size={18} />
          </button>

          {/* Close chat button */}
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-sm btn-circle btn-ghost"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
