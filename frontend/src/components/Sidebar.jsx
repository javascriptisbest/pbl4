import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useFriendStore } from "../store/useFriendStore";
import { Search, Users, Plus, UserCheck, UserPlus, Check, X } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { groups, selectedGroup, setSelectedGroup, getGroups } = useGroupStore();
  const { onlineUsers } = useAuthStore();
  const { searchResults, isSearching, pendingRequests, searchUsersToAdd, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getPendingRequests } = useFriendStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeGroups = Array.isArray(groups) ? groups : [];
  const safeOnlineUsers = Array.isArray(onlineUsers) ? onlineUsers : [];

  useEffect(() => {
    getUsers();
    getGroups();
    getPendingRequests();
  }, [getUsers, getGroups, getPendingRequests]);

  // Search users when typing
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsersToAdd(searchQuery.trim());
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      searchUsersToAdd("");
    }
  }, [searchQuery, searchUsersToAdd]);

  // Normalize Vietnamese text for search
  const normalizeVietnamese = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  // Combine users and groups into one list
  const allItems = useMemo(() => {
    const userItems = safeUsers.map((user) => ({
      type: "user",
      id: user._id,
      name: user.fullName,
      avatar: user.profilePic,
      lastMessage: user.lastMessage,
      unreadCount: user.unreadCount,
      isOnline: safeOnlineUsers.includes(user._id),
      data: user,
    }));

    const groupItems = safeGroups.map((group) => ({
      type: "group",
      id: group._id,
      name: group.name,
      avatar: group.avatar,
      lastMessage: group.lastMessage,
      unreadCount: 0,
      memberCount: group.members?.length || 0,
      data: group,
    }));

    return [...userItems, ...groupItems];
  }, [safeUsers, safeGroups, safeOnlineUsers]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery && !showOnlineOnly) return allItems;

    return allItems.filter((item) => {
      const query = searchQuery.toLowerCase();
      const queryNorm = normalizeVietnamese(searchQuery);
      const name = (item.name || "").toLowerCase();
      const nameNorm = normalizeVietnamese(item.name);

      const matchesSearch = !searchQuery || name.includes(query) || nameNorm.includes(queryNorm);
      const matchesOnline = !showOnlineOnly || item.isOnline;

      return matchesSearch && matchesOnline;
    });
  }, [allItems, searchQuery, showOnlineOnly]);

  // Get last message preview text
  const getLastMessageText = (lastMessage) => {
    if (!lastMessage) return null;
    if (lastMessage.text) return lastMessage.text;
    if (lastMessage.image) return "📸 Ảnh";
    if (lastMessage.video) return "🎥 Video";
    if (lastMessage.audio) return "🎵 Ghi âm";
    if (lastMessage.file) return "📎 Tài liệu";
    return "💬 Tin nhắn";
  };

  const handleItemClick = (item) => {
    if (item.type === "user") {
      setSelectedUser(item.data);
      setSelectedGroup(null);
    } else {
      setSelectedGroup(item.data);
      setSelectedUser(null);
    }
  };

  const isSelected = (item) => {
    if (item.type === "user") {
      return selectedUser?._id === item.id;
    } else {
      return selectedGroup?._id === item.id;
    }
  };

  if (isUsersLoading) {
    return (
      <aside className="h-full w-80 border-r flex flex-col" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="animate-pulse h-10 rounded-lg mb-3" style={{ background: "var(--bg-accent)" }}></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 rounded-full" style={{ background: "var(--bg-accent)" }}></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-3/4" style={{ background: "var(--bg-accent)" }}></div>
                <div className="h-3 rounded w-1/2" style={{ background: "var(--bg-accent)" }}></div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full w-80 flex-shrink-0 flex flex-col border-r border-base-300">
      <div className="p-2 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: "var(--accent-primary)" }} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
            style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
            <span>{filteredItems.length} {filteredItems.length === 1 ? "cuộc trò chuyện" : "cuộc trò chuyện"}</span>
            {showOnlineOnly && (
              <span style={{ color: "var(--accent-primary)" }} className="font-medium">
                ({safeOnlineUsers.length} online)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOnlineOnly(!showOnlineOnly)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                backgroundColor: showOnlineOnly ? "var(--accent-primary)" : "var(--bg-accent)",
                color: showOnlineOnly ? "#ffffff" : "var(--accent-primary)",
              }}
            >
              <UserCheck className="w-3 h-3" />
              <span>{showOnlineOnly ? "Tất cả" : "Online"}</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{ background: "var(--bg-accent)", color: "var(--accent-primary)" }}
            >
              <Plus className="w-3 h-3" />
              <span>Tạo nhóm</span>
            </button>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-1">
        {/* Pending Friend Requests */}
        {!searchQuery && pendingRequests.received && pendingRequests.received.length > 0 && (
          <div className="mb-2">
            <h3 className="text-xs font-semibold mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
              Friend Requests ({pendingRequests.received.length})
            </h3>
            {pendingRequests.received.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-2 rounded-lg mb-2 mx-1"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    {request.profilePic ? (
                      <img src={request.profilePic} alt={request.fullName} className="w-full h-full rounded-full object-cover" />
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

        {/* Search Results (Users to Add) */}
        {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
          <div className="mb-2">
            <h3 className="text-xs font-semibold mb-2 px-2" style={{ color: "var(--text-secondary)" }}>
              Tìm thấy {searchResults.length} người
            </h3>
            {searchResults.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-2 rounded-lg mb-2 mx-1 hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: "var(--bg-accent)" }}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
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
                  onClick={() => sendFriendRequest(user._id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                  style={{ backgroundColor: "var(--accent-primary)", color: "#ffffff" }}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Thêm</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Conversations List */}
        {filteredItems.length === 0 && !searchQuery ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="w-full p-2 flex items-center space-x-3 transition-colors duration-200 rounded-lg mx-1 hover:bg-opacity-80"
              style={{
                backgroundColor: isSelected(item) ? "var(--bg-accent)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium shadow-sm transition-all duration-300"
                  style={{
                    backgroundColor: item.type === "group" ? "var(--accent-secondary)" : "var(--accent-primary)",
                  }}
                >
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-full h-full rounded-full object-cover" />
                  ) : item.type === "group" ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-bold">{item.name?.charAt(0)}</span>
                  )}
                </div>
                {item.type === "user" && item.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
                {item.type === "group" && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">
                    {item.memberCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold text-sm truncate ${item.unreadCount > 0 ? "font-bold" : ""}`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.name}
                  </h3>
                  {item.unreadCount > 0 && (
                    <span
                      className="ml-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold text-white rounded-full"
                      style={{ backgroundColor: "var(--accent-primary)" }}
                    >
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-1 truncate ${item.unreadCount > 0 ? "font-semibold" : ""}`}
                  style={{
                    color: item.unreadCount > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {getLastMessageText(item.lastMessage) ||
                    (item.type === "user" && item.isOnline ? "Đang hoạt động" : "Chưa có tin nhắn")}
                </p>
              </div>
            </button>
          ))
        ) : searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Không tìm thấy</p>
          </div>
        ) : isSearching ? (
          <div className="p-4 text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Đang tìm kiếm...</p>
          </div>
        ) : null}
      </div>

      <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </aside>
  );
};

export default Sidebar;
