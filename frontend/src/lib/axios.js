import axios from "axios";
import { getBackendURL } from "../config/urls.js";

export const axiosInstance = axios.create({
  baseURL: `${getBackendURL()}/api`,
  withCredentials: true,
  timeout: 30000, // Tăng timeout lên 30s
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});

// Add request interceptor to include JWT token from localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const axiosFileInstance = axios.create({
  baseURL: `${getBackendURL()}/api`,
  withCredentials: true,
  timeout: 600000,
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});

// Add request interceptor to include JWT token from localStorage
axiosFileInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
