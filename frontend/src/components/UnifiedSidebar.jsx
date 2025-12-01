import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { Users, Plus, MessageSquare } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import Avatar from "./Avatar";

const UnifiedSidebar = () => {
  const [activeTab, setActiveTab] = useState("contacts"); // "contacts" or "groups"
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Chat store
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

  // Group store
  const {
    groups,
    selectedGroup,
    setSelectedGroup,
    getGroups,
    isGroupsLoading,
  } = useGroupStore();

  useEffect(() => {
    // Preload both users and groups immediately for instant switching
    console.log("🚀 UnifiedSidebar: Preloading data for instant access");
    if (!users.length) {
      console.log("👥 Loading users...");
      getUsers();
    }
    if (!groups.length) {
      console.log("👥 Loading groups...");
      getGroups(); 
    }
  }, [users.length, groups.length, getUsers, getGroups]);

  // No separate tab-based loading - everything is preloaded

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const formatLastMessageTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString();
  };

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="w-full h-full flex flex-col bg-gradient-to-b from-base-100 to-base-200/30">
        {/* Header with Tab Buttons - Enhanced Modern Design */}
        <div className="p-3 sm:p-4 border-b border-base-300/70 bg-base-100/80 backdrop-blur-sm">
          {/* Tab Switcher */}
          <div className="relative bg-base-200/50 rounded-xl p-1">
            <div className="flex relative">
              <button
                onClick={() => setActiveTab("contacts")}
                className={`relative flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  activeTab === "contacts"
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/25 scale-105"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-100/80"
                }`}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Messages</span>
              </button>

              <button
                onClick={() => setActiveTab("groups")}
                className={`relative flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium ${
                  activeTab === "groups"
                    ? "bg-primary text-primary-content shadow-lg shadow-primary/25 scale-105"
                    : "text-base-content/70 hover:text-base-content hover:bg-base-100/80"
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Groups</span>
              </button>
            </div>
          </div>

          {/* Create Group Button & Controls - Enhanced Design */}
          <div className="mt-3 flex items-center justify-between">
            {activeTab === "groups" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary btn-sm gap-2 text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
                title="Create New Group"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New Group</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>

          {/* Actions based on active tab - Enhanced */}
          {activeTab === "contacts" ? (
            <div className="mt-3 flex items-center">
              <label className="cursor-pointer flex items-center gap-2 w-full bg-base-200/50 rounded-lg px-3 py-2 hover:bg-base-200/70 transition-colors">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span className="text-sm font-medium text-base-content/80">
                  Online only
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto"></div>
              </label>
            </div>
          ) : (
            <div className="mt-3 h-10 flex items-center">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary btn-sm btn-block"
                title="Create Group"
              >
                <Plus className="w-4 h-4" />
                <span>New Group</span>
              </button>
            </div>
          )}
        </div>

        {/* Content based on active tab - Enhanced styling */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "contacts" ? (
            <div className="h-full overflow-y-auto py-2 px-2 sm:px-3 space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                  }}
                  className={`
                    w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 rounded-xl
                    backdrop-blur-sm transition-all duration-300 
                    hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10
                    hover:shadow-lg hover:scale-[1.02] transform
                    active:scale-[0.98] touch-manipulation
                    border border-transparent hover:border-primary/20
                    ${
                      selectedUser?._id === user._id
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10 scale-[1.02]"
                        : "hover:bg-base-200/50"
                    }
                  `}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={user.profilePic}
                      alt={user.fullName}
                      size="md"
                      loading="lazy"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 
                          rounded-full ring-2 ring-base-100 animate-pulse"
                      />
                    )}
                  </div>

                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold truncate text-base-content mb-1">
                      {user.fullName}
                    </div>
                    <div
                      className={`text-xs font-medium flex items-center gap-1 ${
                        onlineUsers.includes(user._id)
                          ? "text-green-600"
                          : "text-base-content/50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          onlineUsers.includes(user._id)
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>

                  {selectedUser?._id === user._id && (
                    <div className="text-primary">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-base-300/50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-base-content/30" />
                  </div>
                  <h3 className="font-medium text-base-content/70 mb-1">
                    No users found
                  </h3>
                  <p className="text-sm text-base-content/50">
                    {showOnlineOnly
                      ? "No users are currently online"
                      : "No users to show"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto py-2 px-2 sm:px-3 space-y-1">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-primary/70" />
                  </div>
                  <h3 className="font-semibold text-base-content mb-2">
                    No groups yet
                  </h3>
                  <p className="text-sm text-base-content/60 mb-4">
                    Create your first group to start chatting with multiple
                    people
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </button>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => {
                      console.log("Group clicked:", group);
                      setSelectedGroup(group);
                      setSelectedUser(null);
                    }}
                    className={`
                      w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 rounded-xl
                      backdrop-blur-sm transition-all duration-300 
                      hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10
                      hover:shadow-lg hover:scale-[1.02] transform
                      active:scale-[0.98] touch-manipulation
                      border border-transparent hover:border-primary/20
                      ${
                        selectedGroup?._id === group._id
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10 scale-[1.02]"
                          : "hover:bg-base-200/50"
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                        {group.avatar ? (
                          <Avatar
                            src={group.avatar}
                            alt={group.name}
                            size="lg"
                            loading="lazy"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-content rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-base-100">
                        {group.members.length}
                      </div>
                    </div>

                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="font-semibold truncate text-base-content">
                          {group.name}
                        </div>
                        {group.lastMessageAt && (
                          <span className="text-xs text-base-content/50 flex-shrink-0">
                            {formatLastMessageTime(group.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      {group.lastMessage ? (
                        <div className="text-sm text-base-content/60 truncate">
                          {group.lastMessage.text || "📎 Media"}
                        </div>
                      ) : (
                        <div className="text-sm text-base-content/40 italic">
                          No messages yet
                        </div>
                      )}
                    </div>

                    {selectedGroup?._id === group._id && (
                      <div className="text-primary">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </aside>

      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};

export default UnifiedSidebar;
