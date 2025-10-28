import { MessageSquare, Users } from "lucide-react";

const ChatTypeToggle = ({ activeType, onTypeChange }) => {
  return (
    <div className="p-2 border-b border-base-300">
      <div className="flex gap-2">
        <div
          className="tooltip tooltip-bottom flex-1"
          data-tip="Direct Messages"
        >
          <button
            onClick={() => onTypeChange("chats")}
            className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
              activeType === "chats"
                ? "bg-primary text-primary-content shadow-md"
                : "bg-base-200 text-base-content hover:bg-base-300"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        <div className="tooltip tooltip-bottom flex-1" data-tip="Groups">
          <button
            onClick={() => onTypeChange("groups")}
            className={`w-full flex items-center justify-center p-2 rounded-lg transition-all ${
              activeType === "groups"
                ? "bg-primary text-primary-content shadow-md"
                : "bg-base-200 text-base-content hover:bg-base-300"
            }`}
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTypeToggle;
