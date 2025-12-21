import { useState, useEffect } from "react";
import { X, MessageCircle } from "lucide-react";
import Avatar from "./Avatar";

const FloatingNotification = () => {
  const [notifications, setNotifications] = useState([]);

  // Listen for global notification events
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { id, type, title, message, avatar, onClick, duration = 5000 } = event.detail;
      
      const notification = {
        id: id || Date.now() + Math.random(),
        type: type || "message",
        title,
        message,
        avatar,
        onClick,
        createdAt: Date.now(),
        duration,
      };

      setNotifications(prev => [...prev, notification]);

      // Auto remove after duration
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    };

    window.addEventListener("showFloatingNotification", handleNewNotification);
    
    return () => {
      window.removeEventListener("showFloatingNotification", handleNewNotification);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleNotificationClick = (notification) => {
    if (notification.onClick) {
      notification.onClick();
    }
    removeNotification(notification.id);
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-center gap-3 min-w-80 max-w-96 p-4 rounded-xl shadow-lg border backdrop-blur-sm animate-in slide-in-from-right duration-300 cursor-pointer hover:scale-105 transition-transform"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
          onClick={() => handleNotificationClick(notification)}
        >
          {/* Avatar or Icon */}
          <div className="flex-shrink-0">
            {notification.avatar ? (
              <Avatar
                src={notification.avatar}
                alt={notification.title}
                size="sm"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--accent-primary)" }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div 
              className="font-medium text-sm truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {notification.title}
            </div>
            <div 
              className="text-sm mt-1 line-clamp-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {notification.message}
            </div>
            <div 
              className="text-xs mt-2 opacity-60"
              style={{ color: "var(--text-secondary)" }}
            >
              vừa xong
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
            style={{ 
              color: "var(--text-secondary)",
              background: "transparent"
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FloatingNotification;