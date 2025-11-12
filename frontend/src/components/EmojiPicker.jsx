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
        className="btn btn-ghost btn-xs w-8 h-8 min-h-8 p-0"
        title="Emoji"
      >
        <Smile className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute bottom-full right-0 mb-2 bg-base-200 rounded-lg shadow-lg p-2 w-56 max-h-40 overflow-y-auto z-10">
          <div className="grid grid-cols-8 gap-0.5">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onEmojiSelect(emoji);
                  onToggle();
                }}
                className="text-lg hover:bg-base-300 rounded p-1 transition-colors w-6 h-6 flex items-center justify-center"
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
