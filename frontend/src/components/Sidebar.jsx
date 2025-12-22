import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useFriendStore } from "../store/useFriendStore";
import {
  Search,
  User,
  Users,
  UserCheck,
  MessageSquare,
  Plus,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts", "groups", or "addFriends"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState(null); // Track which user we're sending request to

  // Friend store
  const {
    searchResults,
    isSearching,
    pendingRequests,
    searchUsersToAdd,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getPendingRequests,
  } = useFriendStore();

  // Create a Set of pending sent user IDs for quick lookup
  const pendingSentIds = useMemo(() => {
    const ids = new Set();
    if (pendingRequests?.sent) {
      pendingRequests.sent.forEach(req => ids.add(req._id));
    }
    return ids;
  }, [pendingRequests?.sent]);

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
    if (activeTab === "addFriends") {
      getPendingRequests();
    }
  }, [getUsers, activeTab, getGroups, getPendingRequests]);

  // Search users khi searchQuery thay đổi (chỉ trong tab addFriends)
  useEffect(() => {
    if (activeTab === "addFriends") {
      const timeoutId = setTimeout(() => {
        if (searchQuery.trim().length >= 2) {
          searchUsersToAdd(searchQuery);
        } else {
          searchUsersToAdd("");
        }
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeTab, searchUsersToAdd]);

  // Hàm normalize tiếng Việt (bỏ dấu) để tìm kiếm linh hoạt
  const normalizeVietnamese = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Optimize filtering with useMemo để tránh re-calculate mỗi render
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((user) => {
      const queryLower = searchQuery.toLowerCase();
      const queryNormalized = normalizeVietnamese(searchQuery);
      const nameLower = (user?.fullName || "").toLowerCase();
      const nameNormalized = normalizeVietnamese(user?.fullName);
      
      // Match nếu tên chứa query (có dấu hoặc không dấu)
      const matchesSearch =
        nameLower.includes(queryLower) || nameNormalized.includes(queryNormalized);
      const matchesOnlineFilter = showOnlineOnly
        ? safeOnlineUsers.includes(user?._id)
        : true;
      return matchesSearch && matchesOnlineFilter;
    });
  }, [safeUsers, searchQuery, showOnlineOnly, safeOnlineUsers]);

  // Memoize user click handler để tránh re-render
  const handleUserClick = useCallback((user) => {
    setSelectedUser(user);
  }, [setSelectedUser]);

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
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium"
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
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium"
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
          <button
            onClick={() => setActiveTab("addFriends")}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium"
            style={{
              background:
                activeTab === "addFriends"
                  ? "var(--accent-primary)"
                  : "transparent",
              color:
                activeTab === "addFriends" ? "#ffffff" : "var(--accent-primary)",
              boxShadow: activeTab === "addFriends" ? "var(--shadow-sm)" : "none",
            }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add</span>
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
        {activeTab === "addFriends" ? (
          // Add Friends Tab
          <div>
            {/* Pending Requests - Received */}
            {pendingRequests.received && pendingRequests.received.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
                  Friend Requests ({pendingRequests.received.length})
                </h3>
                {pendingRequests.received.map((request) => (
                  <div
                    key={request._id || request.requestId}
                    className="flex items-center justify-between p-2 rounded-lg mb-2"
                    style={{ backgroundColor: "var(--bg-accent)" }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: "var(--accent-primary)" }}
                      >
                        {request.profilePic ? (
                          <img
                            src={request.profilePic}
                            alt={request.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{request.fullName?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {request.fullName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          {request.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => acceptFriendRequest(request.requestId)}
                        className="p-1.5 rounded-full hover:bg-green-100 transition-colors"
                        style={{ color: "#10b981" }}
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(request.requestId)}
                        className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                        style={{ color: "#ef4444" }}
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pending Requests - Sent */}
            {pendingRequests.sent && pendingRequests.sent.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
                  Sent Requests ({pendingRequests.sent.length})
                </h3>
                {pendingRequests.sent.map((request) => (
                  <div
                    key={request._id || request.requestId}
                    className="flex items-center justify-between p-2 rounded-lg mb-2"
                    style={{ backgroundColor: "var(--bg-accent)" }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: "var(--accent-secondary)" }}
                      >
                        {request.profilePic ? (
                          <img
                            src={request.profilePic}
                            alt={request.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{request.fullName?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {request.fullName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          Pending...
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                    >
                      Waiting
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results */}
            <div>
              <h3 className="text-xs font-semibold mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
                {searchQuery.trim().length >= 2 ? "Search Results" : "Search for users to add"}
              </h3>
              {isSearching ? (
                <div className="p-4 text-center">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Searching...</p>
                </div>
              ) : searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No users found</p>
                </div>
              ) : (
                searchResults.map((user) => {
                  const isPendingSent = pendingSentIds.has(user._id);
                  const isSending = sendingRequestTo === user._id;
                  
                  return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 rounded-lg mb-2 hover:bg-opacity-80 transition-colors"
                    style={{ backgroundColor: "var(--bg-accent)" }}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: "var(--accent-primary)" }}
                      >
                        {user.profilePic ? (
                          <img
                            src={user.profilePic}
                            alt={user.fullName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs">{user.fullName?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {user.fullName}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (isPendingSent || isSending) return;
                        setSendingRequestTo(user._id);
                        try {
                          await sendFriendRequest(user._id);
                          // Refresh search results sau khi gửi request
                          if (searchQuery.trim().length >= 2) {
                            searchUsersToAdd(searchQuery);
                          }
                        } finally {
                          setSendingRequestTo(null);
                        }
                      }}
                      disabled={isPendingSent || isSending}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                      style={{
                        backgroundColor: isPendingSent ? "var(--bg-secondary)" : "var(--accent-primary)",
                        color: isPendingSent ? "var(--text-secondary)" : "#ffffff",
                        cursor: isPendingSent || isSending ? "not-allowed" : "pointer",
                        opacity: isSending ? 0.7 : 1,
                      }}
                    >
                      {isSending ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Sending...</span>
                        </>
                      ) : isPendingSent ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                )})
              )}
              {searchQuery.trim().length < 2 && (
                <div className="p-8 text-center">
                  <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "contacts" ? (
          // Users List
          <div>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => {
                  handleUserClick(user);
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
                  <div className="flex items-center gap-2 mt-1">
                    <p
                      className="text-xs truncate flex-1"
                      style={{ 
                        color: user.unreadCount > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: user.unreadCount > 0 ? "600" : "normal"
                      }}
                    >
                      {user.lastMessage ? (
                        <>
                          {user.lastMessage.text ? (
                            user.lastMessage.text.length > 25 
                              ? `${user.lastMessage.text.substring(0, 25)}...`
                              : user.lastMessage.text
                          ) : user.lastMessage.image ? (
                            "📷 Đã gửi ảnh"
                          ) : user.lastMessage.video ? (
                            "🎥 Đã gửi video"  
                          ) : user.lastMessage.audio ? (
                            "🎵 Đã gửi ghi âm"
                          ) : user.lastMessage.file ? (
                            "📎 Đã gửi tài liệu"
                          ) : (
                            "💬 Tin nhắn"
                          )}
                        </>
                      ) : (
                        safeOnlineUsers.includes(user._id)
                          ? "• Đang hoạt động"
                          : "Không hoạt động"
                      )}
                    </p>
                    {user.unreadCount > 0 && (
                      <div 
                        className="min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "var(--accent-primary)" }}
                      >
                        {user.unreadCount > 99 ? "99+" : user.unreadCount}
                      </div>
                    )}
                  </div>
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
                  className="w-full p-2 flex items-center space-x-3 transition-colors duration-200 rounded-lg mx-1 relative"
                  style={{
                    backgroundColor:
                      selectedGroup?._id === group._id
                        ? "var(--bg-accent)"
                        : group.unreadCount > 0
                        ? "var(--bg-accent-light)"
                        : "transparent",
                    borderLeft: group.unreadCount > 0 ? "3px solid var(--accent-primary)" : "3px solid transparent",
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
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {group.name}
                      </h3>
                      {group.unreadCount > 0 && (
                        <div 
                          className="min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ml-2"
                          style={{ background: "var(--accent-primary)" }}
                        >
                          {group.unreadCount > 99 ? "99+" : group.unreadCount}
                        </div>
                      )}
                    </div>
                    <p
                      className="text-xs mt-1 truncate"
                      style={{ 
                        color: group.unreadCount > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: group.unreadCount > 0 ? "600" : "normal"
                      }}
                    >
                      {group.lastMessage
                        ? group.lastMessage.text ||
                          (group.lastMessage.image && "📷 Đã gửi ảnh") ||
                          (group.lastMessage.video && "🎥 Đã gửi video") ||
                          (group.lastMessage.audio && "🎵 Đã gửi ghi âm") ||
                          (group.lastMessage.file && "📎 Đã gửi tài liệu") ||
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

export default React.memo(Sidebar);
