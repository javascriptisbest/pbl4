import axios from "axios";
import { getBackendURL } from "../config/urls.js";

// Debug function
const logAxiosConfig = () => {
  const backendURL = getBackendURL();
  const apiBase = `${backendURL}/api`;

  console.log("🔗 Axios Config:", {
    hostname: window.location.hostname,
    backendURL: backendURL,
    baseURL: apiBase,
    sampleLoginURL: `${apiBase}/auth/login`,
    sampleCheckURL: `${apiBase}/auth/check`,
  });
};

// Log config on load
logAxiosConfig();

export const axiosInstance = axios.create({
  baseURL: `${getBackendURL()}/api`,
  withCredentials: true,
  timeout: 10000,
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});

export const axiosFileInstance = axios.create({
  baseURL: `${getBackendURL()}/api`,
  withCredentials: true,
  timeout: 600000,
  maxContentLength: 200 * 1024 * 1024,
  maxBodyLength: 200 * 1024 * 1024,
});

// Request interceptor để debug URLs
axiosInstance.interceptors.request.use(
  (config) => {
    console.log("📤 Axios Request:", {
      method: config.method?.toUpperCase(),
      baseURL: config.baseURL,
      url: config.url,
      fullURL: config.baseURL + config.url,
    });
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor để debug responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("📥 Axios Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ Axios Error:", {
      status: error.response?.status,
      url: error.config?.url,
      fullURL: error.config?.baseURL + error.config?.url,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
