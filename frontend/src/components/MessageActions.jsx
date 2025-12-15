import { useState, useRef, useEffect } from "react";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageActions = ({ message, isMyMessage, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  const { addReaction, deleteMessage } = useChatStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReaction = async (emoji) => {
    try {
      await addReaction(message._id, emoji);
      setShowMenu(false);
    } catch (error) {
      toast.error("Không thể thả reaction");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(message._id);
      setShowMenu(false);
    } catch (error) {
      // Error đã được xử lý trong store
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
    setShowMenu(false);
  };

  // Nếu tin nhắn đã bị xóa, không hiển thị actions
  if (message.isDeleted) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Action trigger button - hiển thị khi hover */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
        title="Thêm"
      >
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </button>

      {/* Actions Menu */}
      {showMenu && (
        <div
          className={`absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-2 ${
            isMyMessage ? "right-0" : "left-0"
          }`}
          style={{ bottom: "100%", marginBottom: "4px" }}
        >
          {/* Quick Emoji Row */}
          <div className="flex items-center justify-center gap-1 px-2 pb-2 border-b border-gray-100">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1"
                title={`React với ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Edit - chỉ cho tin nhắn của mình và có text */}
          {isMyMessage && message.text && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
            >
              <Edit2 className="w-4 h-4" />
              <span>Chỉnh sửa</span>
            </button>
          )}

          {/* Delete - chỉ cho tin nhắn của mình */}
          {isMyMessage && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-sm text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Component hiển thị reactions của message
export const MessageReactions = ({ reactions = [], onReactionClick }) => {
  if (!reactions || reactions.length === 0) return null;

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, users]) => (
        <button
          key={emoji}
          onClick={() => onReactionClick && onReactionClick(emoji)}
          className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors"
          title={`${users.length} người đã react`}
        >
          <span>{emoji}</span>
          {users.length > 1 && (
            <span className="text-xs text-gray-600">{users.length}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default MessageActions;


