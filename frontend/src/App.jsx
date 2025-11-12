import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import VoiceCallModal from "./components/VoiceCallModal";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { callModal, voiceCallManager } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
      {/* Global voice call modal */}
      <VoiceCallModal
        isOpen={callModal?.isOpen}
        isIncoming={callModal?.isIncoming}
        callerName={callModal?.callerName}
        calleeId={callModal?.callerId}
        offer={callModal?.offer}
        voiceCallManager={voiceCallManager}
        onClose={() => {
          // reset modal state
          useAuthStore.setState({
            callModal: {
              isOpen: false,
              isIncoming: false,
              callerId: null,
              callerName: null,
              offer: null,
            },
          });
        }}
      />

      {/* Performance Dashboard - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceDashboard 
          isOpen={showPerfDashboard}
          onToggle={() => setShowPerfDashboard(!showPerfDashboard)}
        />
      )}
    </div>
  );
};
export default App;
