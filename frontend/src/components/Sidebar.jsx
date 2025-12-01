import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import {
  Search,
  User,
  Users,
  UserCheck,
  MessageSquare,
  Plus,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" or "groups"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Group store
  const { groups, selectedGroup, setSelectedGroup, getGroups } =
    useGroupStore();

  // Ensure users and groups are always arrays
  const safeUsers = Array.isArray(users) ? users : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  useEffect(() => {
    getUsers();
    if (activeTab === "groups") {
      getGroups();
    }
  }, [getUsers, activeTab, getGroups]);

  // Lọc users dựa trên online status và search
  const filteredUsers = safeUsers.filter((user) => {
    const matchesSearch =
      user?.fullName?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      false;
    const matchesOnlineFilter = showOnlineOnly
      ? safeOnlineUsers.includes(user?._id)
      : true;
    return matchesSearch && matchesOnlineFilter;
  });

  const showSkeleton = isUsersLoading;

  if (showSkeleton) {
    return (
      <aside
        className="h-full w-80 border-r flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <div
            className="animate-pulse h-10 rounded-lg mb-3"
            style={{ background: "var(--bg-accent)" }}
          ></div>
          <div
            className="animate-pulse h-8 rounded-lg"
            style={{ background: "var(--bg-accent)" }}
          ></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div
                className="w-12 h-12 rounded-full"
                style={{ background: "var(--bg-accent)" }}
              ></div>
              <div className="flex-1 space-y-2">
                <div
                  className="h-4 rounded w-3/4"
                  style={{ background: "var(--bg-accent)" }}
                ></div>
                <div
                  className="h-3 rounded w-1/2"
                  style={{ background: "var(--bg-accent)" }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full w-80 flex-shrink-0 flex flex-col border-r border-base-300">
      {/* Tab Switcher */}
      <div className="p-2 space-y-3">
        <div
          className="flex rounded-lg p-1"
          style={{
            background: "var(--bg-accent)",
          }}
        >
          <button
            onClick={() => setActiveTab("contacts")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
            style={{
              background:
                activeTab === "contacts"
                  ? "var(--accent-primary)"
                  : "transparent",
              color:
                activeTab === "contacts" ? "#ffffff" : "var(--accent-primary)",
              boxShadow: activeTab === "contacts" ? "var(--shadow-sm)" : "none",
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium"
            style={{
              background:
                activeTab === "groups"
                  ? "var(--accent-primary)"
                  : "transparent",
              color:
                activeTab === "groups" ? "#ffffff" : "var(--accent-primary)",
              boxShadow: activeTab === "groups" ? "var(--shadow-sm)" : "none",
            }}
          >
            <Users className="w-4 h-4" />
            <span>Groups</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--accent-primary)" }}
          />
          <input
            type="text"
            placeholder={
              activeTab === "contacts" ? "Tìm kiếm..." : "Tìm nhóm..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
            style={{
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Controls based on active tab */}
        {activeTab === "contacts" ? (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <Users
                className="w-4 h-4"
                style={{ color: "var(--accent-primary)" }}
              />
              <span>{safeUsers.length} người</span>
              {showOnlineOnly && (
                <span
                  style={{ color: "var(--accent-primary)" }}
                  className="font-medium"
                >
                  ({safeOnlineUsers.length} đang online)
                </span>
              )}
            </div>

            <button
              onClick={() => setShowOnlineOnly(!showOnlineOnly)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: showOnlineOnly
                  ? "var(--accent-primary)"
                  : "var(--bg-accent)",
                color: showOnlineOnly ? "#ffffff" : "var(--accent-primary)",
              }}
            >
              <UserCheck className="w-3 h-3" />
              <span>{showOnlineOnly ? "Tất cả" : "Online"}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <Users className="w-4 h-4" />
              <span>{safeGroups.length} nhóm</span>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: "var(--bg-accent)",
                color: "var(--accent-primary)",
                ":hover": {
                  background: "var(--accent-primary)",
                  color: "white",
                },
              }}
            >
              <Plus className="w-3 h-3" />
              <span>Tạo nhóm</span>
            </button>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto p-1">
        {activeTab === "contacts" ? (
          // Users List
          <div>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  setSelectedUser(user);
                  setSelectedGroup(null); // Clear group selection
                }}
                className="w-full p-2 flex items-center space-x-3 transition-colors duration-200 rounded-lg mx-1"
                style={{
                  backgroundColor:
                    selectedUser?._id === user._id
                      ? "var(--bg-accent)"
                      : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-sm transition-all duration-300"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {user.fullName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  {safeOnlineUsers.includes(user._id) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user.fullName}
                  </h3>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {safeOnlineUsers.includes(user._id)
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </p>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="p-8 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  {searchQuery
                    ? "Không tìm thấy người dùng"
                    : "Không có người dùng nào"}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Groups List
          <div>
            {safeGroups.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">Chưa có nhóm nào</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  Tạo nhóm đầu tiên
                </button>
              </div>
            ) : (
              safeGroups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedUser(null); // Clear user selection
                  }}
                  className="w-full p-2 flex items-center space-x-3 transition-colors duration-200 rounded-lg mx-1"
                  style={{
                    backgroundColor:
                      selectedGroup?._id === group._id
                        ? "var(--bg-accent)"
                        : "transparent",
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-sm transition-all duration-300"
                      style={{ backgroundColor: "var(--accent-secondary)" }}
                    >
                      {group.avatar ? (
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
                      {group.members?.length || 0}
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {group.name}
                    </h3>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {group.lastMessage
                        ? group.lastMessage.text ||
                          (group.lastMessage.image && "📸 Ảnh") ||
                          (group.lastMessage.video && "🎥 Video") ||
                          (group.lastMessage.audio && "🎵 Ghi âm") ||
                          (group.lastMessage.file && "📎 Tài liệu") ||
                          "💬 Tin nhắn"
                        : "Chưa có tin nhắn"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </aside>
  );
};

export default Sidebar;
