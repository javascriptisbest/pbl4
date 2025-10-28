import { useState, useRef, useEffect } from "react";
import { Copy, Trash2, MoreVertical } from "lucide-react";
import toast from "react-hot-toast";

const MessageActions = ({ message, onReaction, onDelete, isOwnMessage }) => {
  const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Copy text tin nhắn
  const handleCopy = () => {
    let textToCopy = "";

    if (message.text) {
      textToCopy = message.text;
    } else if (message.image) {
      textToCopy = "📷 Image";
    } else if (message.video) {
      textToCopy = "🎥 Video";
    } else if (message.audio) {
      textToCopy = "🎤 Voice message";
    } else if (message.file) {
      textToCopy = "📎 File";
    }

    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");
    setShowMenu(false);
  };

  // Xóa tin nhắn
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message._id);
    }
    setShowMenu(false);
  };

  return (
    <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="flex items-center gap-1 bg-base-100 border border-base-300 rounded-full px-2 py-1 shadow-lg">
        {/* Emoji reactions - chỉ hiện cho tin nhắn người khác */}
        {!isOwnMessage && (
          <>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReaction && onReaction(message._id, emoji)}
                className="hover:scale-125 transition-transform duration-150 text-base w-7 h-7 flex items-center justify-center rounded-full hover:bg-base-200"
                type="button"
              >
                {emoji}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-5 bg-base-300 mx-1" />
          </>
        )}

        {/* More menu button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="hover:scale-125 transition-transform duration-150 w-7 h-7 flex items-center justify-center rounded-full hover:bg-base-200"
            type="button"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute top-full right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2"
                type="button"
              >
                <Copy size={14} />
                Copy
              </button>

              {/* Delete - chỉ hiện cho tin nhắn của mình */}
              {isOwnMessage && (
                <>
                  <div className="border-t border-base-300 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-error hover:text-error-content flex items-center gap-2 text-error"
                    type="button"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageActions;
