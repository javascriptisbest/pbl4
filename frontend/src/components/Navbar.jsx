import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, MessageCircle, Settings, User, Bell } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { users, setSelectedUser } = useChatStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Tính tổng số unread messages
  useEffect(() => {
    const total = users.reduce((sum, user) => sum + (user.unreadCount || 0), 0);
    setUnreadCount(total);
  }, [users]);

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lấy danh sách users có unread messages
  const unreadUsers = users.filter((user) => (user.unreadCount || 0) > 0);

  const handleNotificationClick = (user) => {
    setSelectedUser(user);
    setShowNotifications(false);
    navigate("/");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: "var(--bg-primary)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shadow-md border"
                style={{
                  background: "var(--accent-primary)",
                  borderColor: "var(--accent-hover)",
                }}
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h1
                className="text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                TalkSpace
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {authUser && (
              <>
                {/* Notification Button với Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-lg transition-all duration-200 border"
                    style={{
                      backgroundColor: "var(--bg-accent)",
                      color: "var(--accent-primary)",
                      borderColor: "var(--accent-primary)",
                    }}
                    title="Thông báo"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--accent-primary)" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Notifications */}
                  {showNotifications && (
                    <div
                      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg border z-50"
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div
                        className="p-3 border-b"
                        style={{ borderColor: "var(--border-primary)" }}
                      >
                        <h3
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Thông báo ({unreadCount})
                        </h3>
                      </div>

                      {unreadUsers.length === 0 ? (
                        <div
                          className="p-6 text-center"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Không có thông báo mới</p>
                        </div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
                          {unreadUsers.map((user) => (
                            <button
                              key={user._id}
                              onClick={() => handleNotificationClick(user)}
                              className="w-full p-3 hover:bg-opacity-50 transition-colors text-left"
                              style={{ backgroundColor: "var(--bg-accent)" }}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.profilePic || "/avatar.png"}
                                  alt={user.fullName}
                                  className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p
                                      className="font-medium truncate"
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      {user.fullName}
                                    </p>
                                    {user.unreadCount > 0 && (
                                      <span
                                        className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0"
                                        style={{ backgroundColor: "var(--accent-primary)" }}
                                      >
                                        {user.unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  {user.lastMessage && (
                                    <p
                                      className="text-sm truncate mt-1"
                                      style={{ color: "var(--text-secondary)" }}
                                    >
                                      {user.lastMessage.text ||
                                        (user.lastMessage.image && "📷 Đã gửi ảnh") ||
                                        (user.lastMessage.video && "🎥 Đã gửi video") ||
                                        (user.lastMessage.audio && "🎵 Đã gửi audio") ||
                                        (user.lastMessage.file && "📄 Đã gửi file") ||
                                        "Tin nhắn mới"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  to="/settings"
                  className="p-2 rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "#ffffff",
                    borderColor: "var(--accent-hover)",
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <Link
                  to="/profile"
                  className="p-2 rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: "var(--bg-accent)",
                    color: "var(--accent-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: "var(--bg-accent)",
                    color: "var(--accent-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
