// src/services/api.js
import axios from "axios";

const LOG_API = import.meta.env.DEV && !import.meta.env.VITE_DISABLE_API_LOGS;

// Smart baseURL detection that works in both development and production
const getBaseURL = () => {
  // First, check if VITE_API_URL is set (at build time or runtime)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('📡 Using VITE_API_URL from environment:', envApiUrl);
    return envApiUrl;
  }
  
  // Runtime detection for production vs development
  const currentOrigin = window.location.origin;
  
  // Check if we're in production (Railway)
  if (currentOrigin.includes('railway') || 
      currentOrigin.includes('weekly-order-system')) {
    console.log('🚀 Detected production environment, using:', currentOrigin);
    return currentOrigin; // Returns: https://weekly-order-system-production.up.railway.app
  }
  
  // Local development
  console.log('💻 Using local development URL');
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: true, // HttpOnly cookies (token + refresh)
  headers: {
    "Content-Type": "application/json",
  },
});

// -------- REQUEST INTERCEPTOR --------
api.interceptors.request.use(
  (config) => {
    if (LOG_API) {
      try {
        const method = (config.method || "GET").toUpperCase();
        console.log(`➡️ API Request: ${method} ${config.baseURL}${config.url}`);
      } catch (_) {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------- RESPONSE INTERCEPTOR --------
api.interceptors.response.use(
  (response) => {
    if (LOG_API) {
      try {
        const method = (response.config?.method || "GET").toUpperCase();
        console.log(`⬅️ API Response: ${response.status} ${method} ${response.config?.baseURL}${response.config?.url}`);
      } catch (_) {}
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.warn("⛔ Unauthorized — redirecting to login");
      window.location.href = "/login";
    }

    if (LOG_API && error?.response) {
      try {
        const method = (error.config?.method || "GET").toUpperCase();
        console.warn(`⬅️ API Error: ${status} ${method} ${error.config?.baseURL}${error.config?.url}`);
      } catch (_) {}
    }

    return Promise.reject(error);
  }
);

export default api;