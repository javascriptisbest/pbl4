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
        className="btn btn-ghost btn-xs md:btn-sm w-7 h-7 md:w-auto md:h-auto min-h-7 md:min-h-8 p-0 md:p-2"
        title="Emoji"
      >
        <Smile className="w-3 h-3 md:w-4 md:h-4" />
      </button>

      {show && (
        <div className="absolute bottom-full right-0 mb-2 bg-base-200 rounded-lg shadow-lg p-2 md:p-3 w-48 md:w-64 max-h-32 md:max-h-48 overflow-y-auto z-10">
          <div className="grid grid-cols-8 gap-0.5 md:gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onEmojiSelect(emoji);
                  onToggle();
                }}
                className="text-sm md:text-xl hover:bg-base-300 rounded p-0.5 md:p-1 transition-colors w-5 h-5 md:w-auto md:h-auto flex items-center justify-center"
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
