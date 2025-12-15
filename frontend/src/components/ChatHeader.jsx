import { X, Phone, Bell, BellOff } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { notificationManager } from "../lib/notifications.js";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [notificationEnabled, setNotificationEnabled] = useState(
    Notification.permission === "granted"
  );

  useEffect(() => {
    setNotificationEnabled(Notification.permission === "granted");
  }, []);

  const handleNotificationToggle = async () => {
    if (Notification.permission === "granted") {
      // Đã bật, không thể tắt (browser không cho phép)
      toast.info("Để tắt notification, vui lòng vào Settings của browser");
    } else {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        setNotificationEnabled(true);
        toast.success("Đã bật thông báo");
      } else {
        toast.error("Cần cho phép thông báo để nhận tin nhắn");
      }
    }
  };

  const handleVoiceCall = () => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    if (window.voiceCallManager) {
      try {
        window.voiceCallManager.initiateCall(selectedUser._id);
        toast("Calling " + selectedUser.fullName);
      } catch (error) {
        console.error("Call error:", error);
        toast.error("Failed to start call");
      }
    } else {
      console.error("Voice call manager not available");
      toast.error("Voice calling not available");
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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

        {/* Call and close buttons */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button
            onClick={handleNotificationToggle}
            className={`btn btn-sm btn-circle btn-ghost ${
              notificationEnabled
                ? "hover:bg-green-100 text-green-600"
                : "hover:bg-gray-100 text-gray-400"
            }`}
            title={
              notificationEnabled
                ? "Thông báo đã bật"
                : "Bật thông báo"
            }
          >
            {notificationEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </button>

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
