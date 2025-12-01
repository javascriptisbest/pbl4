// Production URL Constants - support localhost, Vercel, Render
export const PRODUCTION_URLS = {
  // Backend URL cho production
  BACKEND_URL: "https://pbl4-jecm.onrender.com",
  
  // Socket URL cho production  
  SOCKET_URL: "https://pbl4-jecm.onrender.com",
  
  // Vercel frontend URL
  FRONTEND_URL: "https://pbl4-one.vercel.app"
};

export const LOCAL_URLS = {
  // Local development URLs
  BACKEND_URL: "http://localhost:5002",
  SOCKET_URL: "http://localhost:5002",
  FRONTEND_URL: "http://localhost:5174"
};

// Function để get backend URL  
export const getBackendURL = () => {
  const hostname = window?.location?.hostname || "";
  
  console.log("🌐 Detecting backend URL for hostname:", hostname);
  
  // Local development (localhost, 127.0.0.1, local IP)
  if (
    hostname === "localhost" || 
    hostname === "127.0.0.1" || 
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  ) {
    console.log("✅ Using local backend");
    return LOCAL_URLS.BACKEND_URL;
  }
  
  // Production (any other domain)
  console.log("✅ Using production backend");
  return PRODUCTION_URLS.BACKEND_URL;
};

// Function để get socket URL  
export const getSocketURL = () => {
  const hostname = window?.location?.hostname || "";
  
  console.log("🔌 Socket URL detection for hostname:", hostname);
  
  // Local development (localhost, 127.0.0.1, local IP)
  if (
    hostname === "localhost" || 
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  ) {
    console.log("✅ Using local socket");
    return LOCAL_URLS.SOCKET_URL;
  }
  
  // Production (any other domain)
  console.log("✅ Using production socket");
  return PRODUCTION_URLS.SOCKET_URL;
};

// Function để get full API URL
export const getAPIURL = (endpoint = "") => {
  const backend = getBackendURL();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const apiUrl = `${backend}/api${cleanEndpoint}`;
  
  console.log("📡 API URL:", { backend, endpoint: cleanEndpoint, full: apiUrl });
  
  return apiUrl;
};