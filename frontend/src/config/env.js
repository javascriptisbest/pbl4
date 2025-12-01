// Environment Configuration with Fallbacks
// Supports both localhost and production deployment

// Default configuration (fallback when no .env)
const DEFAULT_CONFIG = {
  // Local development
  BACKEND_URL: "http://localhost:5002/api",
  SOCKET_URL: "http://localhost:5002",

  // Production URLs
  PRODUCTION_BACKEND_URL:
    "https://fullstack-chat-app-backend-weld.vercel.app/api",
  PRODUCTION_SOCKET_URL: "https://fullstack-chat-app-backend-weld.vercel.app",

  // Render URLs (alternative)
  RENDER_BACKEND_URL: "https://chat-backend-api.onrender.com/api",
  RENDER_SOCKET_URL: "https://chat-backend-api.onrender.com",
};

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Get environment variable with fallback
const getEnvVar = (key, fallback) => {
  return import.meta.env[key] || fallback;
};

// Smart backend URL detection
const getBackendUrl = () => {
  // Priority 1: Environment variable
  const envBackendUrl = getEnvVar("VITE_BACKEND_URL", null);
  if (envBackendUrl) return envBackendUrl;

  // Priority 2: Auto-detect based on hostname
  const hostname = window.location.hostname;

  // Vercel deployment
  if (hostname.includes("vercel.app")) {
    return DEFAULT_CONFIG.PRODUCTION_BACKEND_URL;
  }

  // Render deployment
  if (hostname.includes("onrender.com")) {
    return DEFAULT_CONFIG.RENDER_BACKEND_URL;
  }

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_CONFIG.BACKEND_URL;
  }

  // Fallback to production
  return isProduction
    ? DEFAULT_CONFIG.PRODUCTION_BACKEND_URL
    : DEFAULT_CONFIG.BACKEND_URL;
};

// Smart socket URL detection
const getSocketUrl = () => {
  // Priority 1: Environment variable
  const envSocketUrl = getEnvVar("VITE_SOCKET_URL", null);
  if (envSocketUrl) return envSocketUrl;

  // Priority 2: Auto-detect based on hostname
  const hostname = window.location.hostname;

  // Vercel deployment
  if (hostname.includes("vercel.app")) {
    return DEFAULT_CONFIG.PRODUCTION_SOCKET_URL;
  }

  // Render deployment
  if (hostname.includes("onrender.com")) {
    return DEFAULT_CONFIG.RENDER_SOCKET_URL;
  }

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return DEFAULT_CONFIG.SOCKET_URL;
  }

  // Fallback to production
  return isProduction
    ? DEFAULT_CONFIG.PRODUCTION_SOCKET_URL
    : DEFAULT_CONFIG.SOCKET_URL;
};

// Final configuration
const config = {
  // Environment info
  isDevelopment,
  isProduction,
  hostname: window.location.hostname,

  // API Configuration
  API_URL: getBackendUrl(),
  SOCKET_URL: getSocketUrl(),

  // App Configuration
  APP_NAME: getEnvVar("VITE_APP_NAME", "TalkSpace"),
  APP_VERSION: getEnvVar("VITE_APP_VERSION", "1.0.0"),

  // Features
  ENABLE_SOCKET: getEnvVar("VITE_ENABLE_SOCKET", "true") === "true",
  ENABLE_NOTIFICATIONS:
    getEnvVar("VITE_ENABLE_NOTIFICATIONS", "true") === "true",
};

// Debug logging in development
if (isDevelopment) {
  console.log("🔧 Environment Config:", {
    mode: import.meta.env.MODE,
    apiUrl: config.API_URL,
    socketUrl: config.SOCKET_URL,
    hostname: config.hostname,
  });
}

export default config;
export { DEFAULT_CONFIG, getEnvVar };
