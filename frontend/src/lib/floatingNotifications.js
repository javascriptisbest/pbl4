/**
 * Floating Notification Helper
 * Hiện floating notification trong app
 */

export const showFloatingNotification = ({
  title,
  message,
  avatar = null,
  type = "message",
  duration = 5000,
  onClick = null,
}) => {
  // Tạo custom event để trigger floating notification
  const event = new CustomEvent("showFloatingNotification", {
    detail: {
      id: Date.now() + Math.random(),
      title,
      message,
      avatar,
      type,
      duration,
      onClick,
    },
  });

  window.dispatchEvent(event);
};

/**
 * Show notification for new message
 */
export const showNewMessageNotification = (message, sender, onClick) => {
  // Skip if window has focus (user is actively using app)
  if (document.hasFocus()) return;

  const title = sender?.fullName || "Tin nhắn mới";
  let messageText = "";

  if (message.text) {
    messageText = message.text;
  } else if (message.image) {
    messageText = "📷 Đã gửi một hình ảnh";
  } else if (message.video) {
    messageText = "🎥 Đã gửi một video";
  } else if (message.audio) {
    messageText = "🎵 Đã gửi một tin nhắn thoại";
  } else if (message.file) {
    messageText = `📎 Đã gửi file ${message.fileName || ""}`;
  } else {
    messageText = "Đã gửi một tin nhắn";
  }

  showFloatingNotification({
    title,
    message: messageText,
    avatar: sender?.profilePic,
    type: "message",
    duration: 6000,
    onClick,
  });
};

/**
 * Show notification for friend request
 */
export const showFriendRequestNotification = (requester, onClick) => {
  showFloatingNotification({
    title: "Lời mời kết bạn mới",
    message: `${requester.fullName} đã gửi lời mời kết bạn`,
    avatar: requester.profilePic,
    type: "friend_request",
    duration: 8000,
    onClick,
  });
};

/**
 * Show notification for group message
 */
export const showGroupMessageNotification = (message, sender, group, onClick) => {
  if (document.hasFocus()) return;

  const title = `${group.name}`;
  let messageText = "";

  if (message.text) {
    messageText = `${sender.fullName}: ${message.text}`;
  } else if (message.image) {
    messageText = `${sender.fullName} đã gửi một hình ảnh`;
  } else if (message.video) {
    messageText = `${sender.fullName} đã gửi một video`;
  } else {
    messageText = `${sender.fullName} đã gửi một tin nhắn`;
  }

  showFloatingNotification({
    title,
    message: messageText,
    avatar: group.avatar || sender.profilePic,
    type: "group_message",
    duration: 6000,
    onClick,
  });
};