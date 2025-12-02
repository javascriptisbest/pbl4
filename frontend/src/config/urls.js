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
  window.clearURLCache = () => {
    urlCache = null;
    console.log("🗑️ URL cache cleared manually");
  };
}

// Function để get backend URL
export const getBackendURL = () => {
  const now = Date.now();

  // Use cache if recent
  if (urlCache && now - urlCache.timestamp < CACHE_DURATION) {
    console.log("🔄 Using cached backend URL:", urlCache.backend);
    return urlCache.backend;
  }

  const hostname = window?.location?.hostname || "";
  const href = window?.location?.href || "";

  console.log("🌐 Fresh backend URL detection:", { hostname, href });

  let backendURL;

  // Local development (localhost, 127.0.0.1, local IP)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  ) {
    backendURL = LOCAL_URLS.BACKEND_URL;
    console.log("✅ Using local backend:", backendURL);
  } else {
    backendURL = PRODUCTION_URLS.BACKEND_URL;
    console.log("✅ Using production backend:", backendURL);
  }

  // Update cache
  urlCache = {
    timestamp: now,
    backend: backendURL,
    socket: null, // Will be set by getSocketURL
  };

  return backendURL;
};

// Function để get socket URL
export const getSocketURL = () => {
  const now = Date.now();

  // Use cached value if available and recent
  if (
    urlCache &&
    urlCache.socket &&
    now - urlCache.timestamp < CACHE_DURATION
  ) {
    console.log("🔄 Using cached socket URL:", urlCache.socket);
    return urlCache.socket;
  }

  const hostname = window?.location?.hostname || "";
  const href = window?.location?.href || "";
  const origin = window?.location?.origin || "";
  const protocol = window?.location?.protocol || "";

  console.log("🔌 Fresh socket URL detection:", {
    hostname,
    href,
    origin,
    protocol,
    timestamp: now,
    userAgent: navigator.userAgent.includes("Chrome") ? "Chrome" : "Other",
  });

  let socketURL;

  // Local development detection
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  ) {
    socketURL = LOCAL_URLS.SOCKET_URL;
    console.log("✅ Using local socket:", socketURL);
  } else {
    socketURL = PRODUCTION_URLS.SOCKET_URL;
    console.log("✅ Using production socket:", socketURL);
  }

  // Force update cache
  if (!urlCache) {
    urlCache = { timestamp: now, backend: null, socket: socketURL };
  } else {
    urlCache.socket = socketURL;
    urlCache.timestamp = now;
  }

  console.log("💾 Updated socket cache:", urlCache);
  return socketURL;
};

// Function để get full API URL
export const getAPIURL = (endpoint = "") => {
  const backend = getBackendURL();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiUrl = `${backend}/api${cleanEndpoint}`;

  console.log("📡 API URL:", {
    backend,
    endpoint: cleanEndpoint,
    full: apiUrl,
  });

  return apiUrl;
};
