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
    // Chỉ load khi chưa có data hoặc cache expired
    const shouldLoadUsers = !users.length || activeTab === "contacts";
    const shouldLoadGroups = !groups.length || activeTab === "groups";

    if (shouldLoadUsers && activeTab === "contacts") {
      getUsers(); // Sẽ dùng cache nếu còn fresh
    }
    if (shouldLoadGroups && activeTab === "groups") {
      getGroups(); // Sẽ dùng cache nếu còn fresh
    }
  }, [activeTab, users.length, groups.length, getUsers, getGroups]);

  // Separate effect cho initial load
  useEffect(() => {
    // Initial load - chỉ chạy 1 lần khi component mount
    if (!users.length) getUsers();
    if (!groups.length) getGroups();
  }, [users.length, groups.length, getUsers, getGroups]);

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
      <aside className="w-full h-full border-r border-base-300 flex flex-col flex-shrink-0 sm:w-72">
        {/* Header with Tab Buttons - Mobile optimized */}
        <div className="border-b border-base-300 p-2 sm:p-3">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === "contacts"
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 hover:bg-base-300"
              }`}
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium hidden xs:inline">Messages</span>
              <span className="font-medium xs:hidden">Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base ${
                activeTab === "groups"
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 hover:bg-base-300"
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">Groups</span>
            </button>
          </div>

          {/* Create Group Button - Mobile positioning */}
          <div className="mt-2 sm:mt-3 flex items-center justify-between">
            {activeTab === "groups" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary btn-sm text-xs sm:text-sm"
                title="Create New Group"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1">New Group</span>
              </button>
            )}
          </div>

          {/* Actions based on active tab */}
          {activeTab === "contacts" ? (
            <div className="mt-2 sm:mt-3 h-8 sm:h-10 flex items-center">
              <label className="cursor-pointer flex items-center gap-2 w-full">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm flex-shrink-0"
                />
                <span className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    Online only
                  </span>
                  <span className="text-xs text-base-content/60">
                    ({onlineUsers.length - 1})
                  </span>
                </span>
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

        {/* Content based on active tab */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "contacts" ? (
            <div className="h-full overflow-y-auto py-3 px-3">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedGroup(null);
                  }}
                  className={`
                    w-full p-2 sm:p-3 flex items-center gap-2 sm:gap-3 rounded-lg mb-1
                    hover:bg-base-200 transition-all duration-200 
                    active:bg-base-300 active:scale-[0.98] transform
                    touch-manipulation
                    ${
                      selectedUser?._id === user._id
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : ""
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
                        className="absolute bottom-0 right-0 size-3 bg-success 
                          rounded-full ring-2 ring-base-100"
                      />
                    )}
                  </div>

                  <div className="text-left min-w-0 flex-1">
                    <div className="font-medium truncate whitespace-nowrap">
                      {user.fullName}
                    </div>
                    <div className="text-sm text-base-content/60 whitespace-nowrap">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4 text-sm">
                  No online users
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto py-3 px-3">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <Users className="w-12 h-12 text-base-content/30 mb-2" />
                  <p className="text-sm text-base-content/60">No groups yet</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-sm btn-primary mt-4"
                  >
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
                      w-full p-3 flex items-center gap-3 rounded-lg
                      hover:bg-base-200 transition-colors
                      ${
                        selectedGroup?._id === group._id
                          ? "bg-primary/10 ring-2 ring-primary/30"
                          : ""
                      }
                    `}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {group.avatar ? (
                          <Avatar
                            src={group.avatar}
                            alt={group.name}
                            size="md"
                            loading="lazy"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-base-100 rounded-full px-1.5 py-0.5 text-xs font-medium border border-base-300">
                        {group.members.length}
                      </div>
                    </div>

                    <div className="text-left min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium truncate whitespace-nowrap">
                          {group.name}
                        </div>
                        {group.lastMessageAt && (
                          <span className="text-xs text-base-content/50 flex-shrink-0 whitespace-nowrap">
                            {formatLastMessageTime(group.lastMessageAt)}
                          </span>
                        )}
                      </div>
                      {group.lastMessage ? (
                        <div className="text-sm text-base-content/60 truncate whitespace-nowrap">
                          {group.lastMessage.text || "Media"}
                        </div>
                      ) : (
                        <div className="text-sm text-base-content/40 italic whitespace-nowrap">
                          No messages yet
                        </div>
                      )}
                    </div>
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
