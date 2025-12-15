// Production URL Constants - support localhost, Vercel, Render
export const PRODUCTION_URLS = {
  // Backend URL cho production
  BACKEND_URL: "https://pbl4-jecm.onrender.com",

  // Socket URL cho production
  SOCKET_URL: "https://pbl4-jecm.onrender.com",

  // Vercel frontend URL
  FRONTEND_URL: "https://pbl4-one.vercel.app",
};

export const LOCAL_URLS = {
  // Local development URLs
  BACKEND_URL: "http://localhost:5002",
  SOCKET_URL: "http://localhost:5002",
  FRONTEND_URL: "http://localhost:5174",
};

// Cache busting for URL detection
let urlCache = null;
const CACHE_DURATION = 10000; // 10 seconds

// Global cache clear function
if (typeof window !== "undefined") {
  window.clearURLCache = () => { urlCache = null; };
}

// Function để get backend URL
export const getBackendURL = () => {
  const now = Date.now();
  if (urlCache && now - urlCache.timestamp < CACHE_DURATION) {
    return urlCache.backend;
  }

  const hostname = window?.location?.hostname || "";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");
  
  const backendURL = isLocal ? LOCAL_URLS.BACKEND_URL : PRODUCTION_URLS.BACKEND_URL;
  
  urlCache = { timestamp: now, backend: backendURL, socket: null };
  return backendURL;
};

// Function để get socket URL
export const getSocketURL = () => {
  const now = Date.now();
  if (urlCache?.socket && now - urlCache.timestamp < CACHE_DURATION) {
    return urlCache.socket;
  }

  const hostname = window?.location?.hostname || "";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.");
  
  const socketURL = isLocal ? LOCAL_URLS.SOCKET_URL : PRODUCTION_URLS.SOCKET_URL;
  
  if (!urlCache) {
    urlCache = { timestamp: now, backend: null, socket: socketURL };
  } else {
    urlCache.socket = socketURL;
    urlCache.timestamp = now;
  }
  
  return socketURL;
};

// Function để get full API URL
export const getAPIURL = (endpoint = "") => {
  const backend = getBackendURL();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${backend}/api${cleanEndpoint}`;
};
