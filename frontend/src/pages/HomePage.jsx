import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UnifiedSidebar from "../components/UnifiedSidebar";
import NoChatSelected from "../components/NoChatSelected";
import UnifiedChatContainer from "../components/UnifiedChatContainer";
import { ArrowLeft, Users } from "lucide-react";

const HomePage = () => {
  const { selectedUser, subscribeToMessages, unsubscribeFromMessages, setSelectedUser } =
    useChatStore();
  const {
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    setSelectedGroup
  } = useGroupStore();

  // Mobile state management
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // Tailwind md breakpoint
      setIsMobile(mobile);
      setShowSidebar(!mobile || (!selectedUser && !selectedGroup));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedUser, selectedGroup]);

  // Auto hide sidebar on mobile when chat is selected
  useEffect(() => {
    if (isMobile && (selectedUser || selectedGroup)) {
      setShowSidebar(false);
    }
  }, [selectedUser, selectedGroup, isMobile]);

  // Register socket listeners khi component mount
  useEffect(() => {
    // Subscribe to socket events for real-time updates
    subscribeToMessages();
    subscribeToGroupMessages();

    // Cleanup: Unsubscribe khi component unmount
    return () => {
      unsubscribeFromMessages();
      unsubscribeFromGroupMessages();
    };
  }, [
    subscribeToMessages,
    unsubscribeFromMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  ]);

  // Handle back to sidebar on mobile
  const handleBackToSidebar = () => {
    setShowSidebar(true);
    if (isMobile) {
      setSelectedUser(null);
      setSelectedGroup(null);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 overflow-hidden">
      {/* Mobile: Full screen container, Desktop: Centered container */}
      <div className={`flex items-center justify-center ${isMobile ? 'h-full' : 'pt-6 px-4'} ${isMobile ? 'w-full' : ''}`}>
        <div className={`bg-base-100 shadow-2xl backdrop-blur-sm ${
          isMobile 
            ? 'w-full h-full rounded-none' 
            : 'max-w-6xl w-full h-[calc(100vh-3rem)] rounded-xl border border-base-300/50'
        }`}>
          <div className="flex h-full overflow-hidden">
            {/* Mobile Back Button & Chat Info - Enhanced Design */}
            {isMobile && !showSidebar && (selectedUser || selectedGroup) && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-base-100/95 backdrop-blur-md border-b border-base-300/50 p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToSidebar}
                    className="btn btn-ghost btn-sm btn-circle bg-primary/10 hover:bg-primary/20 border border-primary/20"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft className="w-4 h-4 text-primary" />
                  </button>
                  
                  {/* Chat Info */}
                  {selectedUser && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img 
                          src={selectedUser.profilePic || '/default-avatar.png'} 
                          alt={selectedUser.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-sm">{selectedUser.fullName}</div>
                        <div className="text-xs text-base-content/60">Tap to see details</div>
                      </div>
                    </div>
                  )}
                  
                  {selectedGroup && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-sm">{selectedGroup.name}</div>
                        <div className="text-xs text-base-content/60">{selectedGroup.members?.length || 0} members</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unified Sidebar - Hide/show based on mobile state */}
            <div className={`${
              isMobile 
                ? (showSidebar ? 'block w-full' : 'hidden') 
                : 'block w-80 flex-shrink-0 border-r border-base-300/50'
            }`}>
              <UnifiedSidebar />
            </div>

            {/* Chat area - Mobile: full width when shown, Desktop: flex-1 */}
            <div className={`${
              isMobile 
                ? (showSidebar ? 'hidden' : 'block w-full') 
                : 'flex-1 min-w-0'
            }`}>
              {selectedUser || selectedGroup ? (
                <div className={`h-full ${isMobile && !showSidebar ? 'pt-16' : ''}`}>
                  <UnifiedChatContainer />
                </div>
              ) : (
                <NoChatSelected />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
