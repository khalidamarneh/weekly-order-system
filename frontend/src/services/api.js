// src/services/api.js
import axios from "axios";

const LOG_API = import.meta.env.DEV && !import.meta.env.VITE_DISABLE_API_LOGS;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
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
        console.log(`➡️ API Request: ${method} ${config.url}`);
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
        console.log(`⬅️ API Response: ${response.status} ${method} ${response.config?.url}`);
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
        console.warn(`⬅️ API Error: ${status} ${method} ${error.config?.url}`);
      } catch (_) {}
    }

    return Promise.reject(error);
  }
);

export default api;
