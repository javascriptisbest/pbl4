import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, MessageCircle } from "lucide-react";
import AuthImagePattern from "../components/AuthImagePattern";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div 
      className="h-full flex"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Left Side - Form */}
      <div 
        className="flex-1 flex items-center justify-center p-8"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'var(--accent-primary)' }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              TalkSpace
            </h1>
            <p 
              className="mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Đăng nhập vào tài khoản của bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '2px solid var(--bg-accent)',
                  color: 'var(--text-primary)'
                }}
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all duration-200 pr-12"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '2px solid var(--bg-accent)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff'
              }}
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>
              Chưa có tài khoản?{" "}
              <Link
                to="/signup"
                className="font-medium transition-colors"
                style={{ color: 'var(--accent-primary)' }}
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image Pattern */}
      <div className="hidden lg:block flex-1">
        <AuthImagePattern
          title="Kết nối và trò chuyện"
          subtitle="Tham gia vào cộng đồng lớn của chúng tôi và kết nối với bạn bè trên khắp thế giới."
        />
      </div>
    </div>
  );
};

export default LoginPage;
