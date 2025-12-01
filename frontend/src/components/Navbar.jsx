import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageCircle, Settings, User } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
      style={{
        background: "var(--bg-primary)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shadow-md border"
                style={{
                  background: "var(--accent-primary)",
                  borderColor: "var(--accent-hover)",
                }}
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h1
                className="text-lg font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                TalkSpace
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/settings"
              className="p-2 rounded-lg transition-all duration-200 border"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#ffffff",
                borderColor: "var(--accent-hover)",
              }}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {authUser && (
              <>
                <Link
                  to="/profile"
                  className="p-2 rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: "var(--bg-accent)",
                    color: "var(--accent-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg transition-all duration-200 border"
                  style={{
                    backgroundColor: "var(--bg-accent)",
                    color: "var(--accent-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
