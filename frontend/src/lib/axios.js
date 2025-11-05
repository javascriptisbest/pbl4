import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5002/api",
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout cho các API calls thông thường
  maxContentLength: 200 * 1024 * 1024, // 200MB max content
  maxBodyLength: 200 * 1024 * 1024, // 200MB max body
});

// Riêng cho file upload thì dùng timeout lớn hơn
export const axiosFileInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5002/api",
  withCredentials: true,
  timeout: 600000, // 10 minutes timeout for large files
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});
