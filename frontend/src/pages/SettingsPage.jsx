import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import { Check, Bell, BellOff, ArrowLeft } from "lucide-react";
import { notificationManager } from "../lib/notifications.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const [notificationEnabled, setNotificationEnabled] = useState(
    Notification.permission === "granted"
  );

  useEffect(() => {
    setNotificationEnabled(Notification.permission === "granted");
  }, []);

  const handleNotificationToggle = async () => {
    if (Notification.permission === "granted") {
      toast.info("Để tắt notification, vui lòng vào Settings của browser");
    } else {
      const granted = await notificationManager.requestPermission();
      if (granted) {
        setNotificationEnabled(true);
        toast.success("Đã bật thông báo");
      } else {
        setNotificationEnabled(false);
        toast.error("Cần cho phép thông báo để nhận tin nhắn");
      }
    }
  };

  // Theme preview colors
  const themePreview = {
    pastel: { primary: "#ec4899", secondary: "#f472b6", bg: "#fafafa" },
    professional: { primary: "#3730a3", secondary: "#4f46e5", bg: "#f8fafc" },
    vibrant: { primary: "#ea580c", secondary: "#f59e0b", bg: "#fef7ff" },
    dark: { primary: "#3b82f6", secondary: "#60a5fa", bg: "#111827" },
    luxury: { primary: "#fbbf24", secondary: "#f59e0b", bg: "#0f0f23" },
  };

  return (
    <div
      className="h-full p-6 overflow-y-auto"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:translate-x-[-2px] transition"
            style={{
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
              background: "var(--bg-secondary)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại chat
          </button>
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Cài đặt
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Tùy chỉnh trải nghiệm của bạn
            </p>
          </div>
        </div>

        {/* Theme Selection */}
        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Giao diện
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  theme === t.id ? "scale-105 shadow-lg" : "hover:shadow-md"
                }`}
                style={{
                  background:
                    theme === t.id ? "var(--bg-accent)" : "var(--bg-secondary)",
                  borderColor:
                    theme === t.id
                      ? "var(--accent-primary)"
                      : "var(--border-primary)",
                }}
              >
                {/* Theme Preview */}
                <div className="mb-4">
                  <div className="flex space-x-2 mb-3">
                    {/* Color swatches */}
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{
                        background: themePreview[t.id].primary,
                        borderColor: "var(--border-secondary)",
                      }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{
                        background: themePreview[t.id].secondary,
                        borderColor: "var(--border-secondary)",
                      }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{
                        background: themePreview[t.id].bg,
                        borderColor: "var(--border-secondary)",
                      }}
                    />
                  </div>

                  {/* Mini chat preview */}
                  <div className="space-y-2">
                    <div className="flex justify-end">
                      <div
                        className="px-3 py-1 rounded-lg text-xs text-white"
                        style={{ background: themePreview[t.id].primary }}
                      >
                        Xin chào!
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div
                        className="px-3 py-1 rounded-lg text-xs border"
                        style={{
                          background:
                            theme === t.id
                              ? "var(--message-received)"
                              : themePreview[t.id].bg,
                          borderColor: "var(--border-secondary)",
                        }}
                      >
                        Chào bạn!
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-2">{t.emoji}</div>
                  <div
                    className="font-medium text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t.name}
                  </div>
                </div>

                {theme === t.id && (
                  <div
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div
            className="mt-6 p-4 rounded-lg"
            style={{ background: "var(--bg-accent)" }}
          >
            <p
              className="text-sm text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              💡 Giao diện sẽ thay đổi ngay lập tức khi bạn chọn theme mới
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div
          className="rounded-xl p-6 shadow-sm border mt-6"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Thông báo
          </h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notificationEnabled ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Desktop Notifications
                </div>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {notificationEnabled
                    ? "Đã bật - Bạn sẽ nhận thông báo khi có tin nhắn mới"
                    : "Đã tắt - Bật để nhận thông báo khi có tin nhắn mới"}
                </div>
              </div>
            </div>

            <button
              onClick={handleNotificationToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                notificationEnabled
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {notificationEnabled ? "Đã bật" : "Bật"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
