import { Smile } from "lucide-react";

const EmojiPicker = ({ onEmojiSelect, show, onToggle }) => {
  const emojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😅",
    "😂",
    "🤣",
    "😊",
    "😇",
    "🙂",
    "🙃",
    "😉",
    "😌",
    "😍",
    "🥰",
    "😘",
    "😗",
    "😙",
    "😚",
    "😋",
    "😛",
    "😝",
    "😜",
    "🤪",
    "🤨",
    "🧐",
    "🤓",
    "😎",
    "🤩",
    "🥳",
    "😏",
    "😒",
    "👍",
    "👎",
    "👌",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "💥",
    "💫",
    "💨",
    "💤",
    "💯",
    "✨",
    "🔥",
    "⚡",
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="btn btn-ghost btn-sm"
        title="Emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      {show && (
        <div className="absolute bottom-full right-0 mb-2 bg-base-200 rounded-lg shadow-lg p-3 w-64 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onEmojiSelect(emoji);
                  onToggle();
                }}
                className="text-2xl hover:bg-base-300 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
