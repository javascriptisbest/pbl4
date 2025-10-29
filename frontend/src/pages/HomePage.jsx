import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import UnifiedSidebar from "../components/UnifiedSidebar";
import NoChatSelected from "../components/NoChatSelected";
import UnifiedChatContainer from "../components/UnifiedChatContainer";

const HomePage = () => {
  const { selectedUser, subscribeToMessages, unsubscribeFromMessages } =
    useChatStore();
  const {
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();

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

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Unified Sidebar with Tabs */}
            <UnifiedSidebar />

            {/* Chat area - Unified for both direct and group chats */}
            <div className="flex-1 min-w-0">
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
