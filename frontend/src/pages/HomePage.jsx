import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UnifiedSidebar from "../components/UnifiedSidebar";
import NoChatSelected from "../components/NoChatSelected";
import UnifiedChatContainer from "../components/UnifiedChatContainer";
import { ArrowLeft } from "lucide-react";

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
    <div className="h-screen bg-base-200">
      {/* Mobile: Full screen container, Desktop: Centered container */}
      <div className={`flex items-center justify-center ${isMobile ? 'h-full' : 'pt-20 px-4'}`}>
        <div className={`bg-base-100 rounded-lg shadow-cl w-full h-full ${
          isMobile ? '' : 'max-w-6xl h-[calc(100vh-8rem)]'
        }`}>
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Mobile Back Button */}
            {isMobile && !showSidebar && (
              <div className="absolute top-4 left-4 z-10">
                <button
                  onClick={handleBackToSidebar}
                  className="bg-base-300 hover:bg-base-200 p-2 rounded-full shadow-lg transition-colors"
                  aria-label="Back to contacts"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Unified Sidebar - Hide/show based on mobile state */}
            <div className={`${
              isMobile 
                ? (showSidebar ? 'block w-full' : 'hidden') 
                : 'block w-80 flex-shrink-0'
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
                <UnifiedChatContainer />
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
