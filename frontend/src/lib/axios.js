import axios from "axios";

// Auto detect backend URL
const getBackendURL = () => {
  // Nếu có env variable thì dùng
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Auto detect dựa trên hostname
  const hostname = window.location.hostname;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5002";
  } else if (hostname === "pbl4-one.vercel.app") {
    return "https://pbl4-jecm.onrender.com";
  } else if (hostname.includes("vercel.app")) {
    return "https://pbl4-jecm.onrender.com";
  } else if (hostname.includes("onrender.com")) {
    return "https://pbl4-jecm.onrender.com";
  } else {
    // Fallback cho production
    return "https://pbl4-jecm.onrender.com";
  }
};

export const axiosInstance = axios.create({
  baseURL: getBackendURL() + "/api",
  withCredentials: true,
  timeout: 10000,
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});

export const axiosFileInstance = axios.create({
  baseURL: getBackendURL() + "/api",
  withCredentials: true,
  timeout: 600000,
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});
