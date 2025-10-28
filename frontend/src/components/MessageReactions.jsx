/**
 * MessageReactions Component
 * 
 * Hiển thị emoji reactions dưới mỗi tin nhắn
 * 
 * Features:
 * - Nhóm reactions giống nhau lại với nhau
 * - Hiển thị count nếu > 1 người react cùng emoji
 * - Click vào reaction để toggle (add/remove)
 * 
 * Props:
 * @param {Array} reactions - Mảng các reaction objects: [{ emoji, userId }]
 * @param {Function} onReactionClick - Callback khi click vào reaction
 * @param {String} messageId - ID của message (để add/remove reaction)
 */

const MessageReactions = ({ reactions, onReactionClick, messageId }) => {
  // Không hiển thị gì nếu không có reactions
  if (!reactions || reactions.length === 0) return null;

  /**
   * Nhóm reactions theo emoji
   * Input:  [{ emoji: "👍", userId: "1" }, { emoji: "👍", userId: "2" }, { emoji: "❤️", userId: "3" }]
   * Output: { 
   *   "👍": { emoji: "👍", count: 2, users: ["1", "2"] },
   *   "❤️": { emoji: "❤️", count: 1, users: ["3"] }
   * }
   */
  const grouped = reactions.reduce((acc, { emoji, userId }) => {
    if (!acc[emoji]) {
      acc[emoji] = { emoji, count: 0, users: [] };
    }
    acc[emoji].count++;
    acc[emoji].users.push(userId);
    return acc;
  }, {});

  const reactionList = Object.values(grouped);

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactionList.map(({ emoji, count }) => (
        <button
          key={emoji}
          onClick={() => onReactionClick && onReactionClick(messageId, emoji)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-base-200 hover:bg-base-300 border border-base-300 transition-colors text-sm"
          type="button"
        >
          <span>{emoji}</span>
          {/* Chỉ hiển thị count nếu > 1 người react */}
          {count > 1 && <span className="text-xs opacity-70">{count}</span>}
        </button>
      ))}
    </div>
  );
};

export default MessageReactions;
