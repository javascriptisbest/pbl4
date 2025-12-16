import MessageActions, { MessageReactions } from "./MessageActions";
import { formatMessageTime } from "../lib/utils";

const MessageBubble = ({ message, isMyMessage, authUser, selectedUser, onImageClick, onEdit }) => {
  const messageSenderId = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
  const profilePic = isMyMessage ? authUser?.profilePic : (typeof message.senderId === "object" ? message.senderId.profilePic : null);
  const name = isMyMessage ? authUser?.fullName : (typeof message.senderId === "object" ? message.senderId.fullName : selectedUser?.fullName);

  return (
    <div className={`group flex w-full px-3 py-1 ${isMyMessage ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] items-end gap-2 ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shadow-sm flex-shrink-0">
          {profilePic ? (
            <img src={profilePic} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-xs font-bold">{name?.charAt(0)}</span>
          )}
        </div>

        <div className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}>
          {/* Sender name (for group chat) */}
          {!isMyMessage && selectedUser?.type === "group" && (
            <div className="text-xs text-gray-500 mb-1 px-1">
              {typeof message.senderId === "object" ? message.senderId.fullName : "Unknown"}
            </div>
          )}

          {/* Message Actions & Text */}
          <div className={`flex items-center gap-1 ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
            {message.text && (
              <div
                className={`relative px-4 py-3 rounded-2xl shadow-sm max-w-xs break-words ${
                  isMyMessage ? "rounded-br-md" : "rounded-bl-md border"
                } ${message.isDeleted ? "opacity-60 italic" : ""} ${message.isPending ? "opacity-70" : ""}`}
                style={{
                  background: isMyMessage ? "var(--message-sent)" : "var(--message-received)",
                  color: isMyMessage ? "var(--message-text-sent)" : "var(--message-text-received)",
                  borderColor: !isMyMessage ? "var(--border-primary)" : "none",
                }}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                {message.isPending && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3">
                    <span className="loading loading-spinner loading-xs text-gray-400"></span>
                  </div>
                )}
              </div>
            )}

            {!message.isDeleted && (
              <MessageActions message={message} isMyMessage={isMyMessage} onEdit={onEdit} />
            )}
          </div>

          {/* Reactions */}
          {message.messageType !== "group" && (
            <MessageReactions
              reactions={message.reactions}
              onReactionClick={(emoji) => {
                const { useChatStore } = require("../store/useChatStore");
                useChatStore.getState().addReaction(message._id, emoji);
              }}
            />
          )}

          {/* Media */}
          {message.image && (
            <div className={`${message.text ? "mt-1" : ""} rounded-lg overflow-hidden shadow-sm`}>
              <img
                src={message.image}
                alt="Shared image"
                className="max-w-[400px] max-h-[400px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                onClick={() => onImageClick?.(message.image)}
              />
            </div>
          )}

          {message.video && (
            <div className={`${message.text || message.image ? "mt-1" : ""} rounded-lg overflow-hidden shadow-sm relative`}>
              {message.video === "uploading..." || message.video?.includes("uploading...") ? (
                <div className="max-w-[400px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center flex-col gap-2">
                  <span className="loading loading-spinner loading-lg text-blue-500"></span>
                  <p className="text-sm text-gray-600">Uploading video...</p>
                  {message.video?.includes("%") && (
                    <p className="text-xs text-gray-500">{message.video}</p>
                  )}
                </div>
              ) : (
                <video src={message.video} controls className="max-w-[400px] rounded-lg" style={{ maxHeight: "300px" }}>
                  Trình duyệt không hỗ trợ video
                </video>
              )}
            </div>
          )}

          {message.audio && (
            <div className={`${message.text || message.image || message.video ? "mt-1" : ""} flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-3 shadow-sm`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMyMessage ? "bg-blue-100" : "bg-gray-100"}`}>🎵</div>
              <audio src={message.audio} controls className="flex-1">Trình duyệt không hỗ trợ audio</audio>
              {message.audioDuration && (
                <span className="text-xs text-gray-500">
                  {Math.floor(message.audioDuration / 60)}:{(message.audioDuration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          )}

          {message.file && (
            <div className={`${message.text || message.image || message.video || message.audio ? "mt-1" : ""} flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm max-w-[300px]`}>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                {message.file === "uploading..." || message.file?.includes("uploading...") ? (
                  <span className="loading loading-spinner loading-sm text-blue-500"></span>
                ) : (
                  "📄"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{message.fileName || "Tài liệu"}</p>
                {message.file === "uploading..." || message.file?.includes("uploading...") ? (
                  <p className="text-xs text-gray-500">{message.file}</p>
                ) : message.fileSize ? (
                  <p className="text-xs text-gray-500">{(message.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                ) : null}
              </div>
              {message.file !== "uploading..." && !message.file?.includes("uploading...") && (
                <button onClick={() => window.open(message.file, "_blank")} className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                  Tải
                </button>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 px-1 ${isMyMessage ? "text-right" : "text-left"}`}>
            {formatMessageTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

