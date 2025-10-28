import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import Sidebar from "../components/Sidebar";
import GroupSidebar from "../components/GroupSidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import ChatTypeToggle from "../components/ChatTypeToggle";
import { Users } from "lucide-react";

// CÁCH 1: BUTTON TOGGLE (Instagram-style)
const HomePage = () => {
  const { selectedUser } = useChatStore();
  const { selectedGroup } = useGroupStore();
  const [activeTab, setActiveTab] = useState("chats"); // "chats" or "groups"

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            {/* Sidebar with Toggle at top */}
            <div className="w-80 border-r border-base-300 flex flex-col">
              {/* Toggle Buttons */}
              <ChatTypeToggle
                activeType={activeTab}
                onTypeChange={setActiveTab}
              />

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === "chats" ? <Sidebar /> : <GroupSidebar />}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 min-w-0">
              {activeTab === "chats" ? (
                !selectedUser ? (
                  <NoChatSelected />
                ) : (
                  <ChatContainer />
                )
              ) : !selectedGroup ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                    <p className="text-lg font-medium">
                      Select a group to start chatting
                    </p>
                  </div>
                </div>
              ) : (
                <GroupChatContainer />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
