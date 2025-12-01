import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import { Check } from "lucide-react";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  // Theme preview colors
  const themePreview = {
    pastel: { primary: '#ec4899', secondary: '#f472b6', bg: '#fafafa' },
    professional: { primary: '#3730a3', secondary: '#4f46e5', bg: '#f8fafc' },
    vibrant: { primary: '#ea580c', secondary: '#f59e0b', bg: '#fef7ff' },
    dark: { primary: '#3b82f6', secondary: '#60a5fa', bg: '#111827' },
    luxury: { primary: '#fbbf24', secondary: '#f59e0b', bg: '#0f0f23' }
  };

  return (
    <div className="h-full p-6 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cài đặt
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Tùy chỉnh trải nghiệm của bạn
          </p>
        </div>

        {/* Theme Selection */}
        <div 
          className="rounded-xl p-6 shadow-sm border"
          style={{ 
            background: 'var(--bg-secondary)', 
            borderColor: 'var(--border-primary)' 
          }}
        >
          <h2 
            className="text-lg font-semibold mb-4" 
            style={{ color: 'var(--text-primary)' }}
          >
            Giao diện
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative p-6 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                  theme === t.id
                    ? "scale-105 shadow-lg"
                    : "hover:shadow-md"
                }`}
                style={{
                  background: theme === t.id ? 'var(--bg-accent)' : 'var(--bg-secondary)',
                  borderColor: theme === t.id ? 'var(--accent-primary)' : 'var(--border-primary)'
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
                        borderColor: 'var(--border-secondary)'
                      }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ 
                        background: themePreview[t.id].secondary,
                        borderColor: 'var(--border-secondary)'
                      }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full border"
                      style={{ 
                        background: themePreview[t.id].bg,
                        borderColor: 'var(--border-secondary)'
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
                          background: theme === t.id ? 'var(--message-received)' : themePreview[t.id].bg,
                          borderColor: 'var(--border-secondary)'
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
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {t.name}
                  </div>
                </div>

                {theme === t.id && (
                  <div 
                    className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bg-accent)' }}>
            <p 
              className="text-sm text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              💡 Giao diện sẽ thay đổi ngay lập tức khi bạn chọn theme mới
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
