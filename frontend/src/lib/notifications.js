/**
 * Desktop Notifications - Tối giản
 */

class NotificationManager {
  constructor() {
    this.permission = Notification.permission;
  }

  async requestPermission() {
    if (!("Notification" in window)) return false;
    if (this.permission === "granted") return true;
    if (this.permission === "denied") return false;

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === "granted";
  }

  show(title, body, icon, onClick) {
    if (this.permission !== "granted") return null;
    if (document.hasFocus()) return null; // Chỉ show khi tab không active

    // Default icon: dùng avatar.png nếu không có icon
    const notificationIcon = icon || "/avatar.png";

    const notification = new Notification(title, {
      body,
      icon: notificationIcon,
      badge: notificationIcon, // Badge icon (mobile)
      tag: "new-message",
      silent: false,
    });

    if (onClick) {
      notification.onclick = () => {
        onClick();
        notification.close();
        window.focus();
      };
    }

    setTimeout(() => notification.close(), 5000);
    return notification;
  }
}

export const notificationManager = new NotificationManager();

// Auto request permission sau 1 giây
if (typeof window !== "undefined") {
  setTimeout(() => notificationManager.requestPermission(), 1000);
}

