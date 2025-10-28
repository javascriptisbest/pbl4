const ChatTypeSelector = ({ activeType, onTypeChange }) => {
  return (
    <div className="p-3 border-b border-base-300">
      <select
        value={activeType}
        onChange={(e) => onTypeChange(e.target.value)}
        className="select select-bordered w-full"
      >
        <option value="chats">💬 Direct Messages</option>
        <option value="groups">👥 Group Chats</option>
      </select>
    </div>
  );
};

export default ChatTypeSelector;
