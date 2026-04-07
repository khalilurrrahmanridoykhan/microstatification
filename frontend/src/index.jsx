import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Toaster } from "sonner";

if (typeof window !== "undefined") {
  const mirroredKeys = ["authToken", "userInfo"];

  try {
    mirroredKeys.forEach((key) => {
      const localValue = window.localStorage.getItem(key);
      const sessionValue = window.sessionStorage.getItem(key);
      if (!sessionValue && localValue) {
        window.sessionStorage.setItem(key, localValue);
      } else if (!localValue && sessionValue) {
        window.localStorage.setItem(key, sessionValue);
      }
    });

    const originalSetItem = window.sessionStorage.setItem.bind(
      window.sessionStorage
    );
    window.sessionStorage.setItem = (key, value) => {
      originalSetItem(key, value);
      if (mirroredKeys.includes(key)) {
        window.localStorage.setItem(key, value);
      }
    };

    const originalRemoveItem = window.sessionStorage.removeItem.bind(
      window.sessionStorage
    );
    window.sessionStorage.removeItem = (key) => {
      originalRemoveItem(key);
      if (mirroredKeys.includes(key)) {
        window.localStorage.removeItem(key);
      }
    };
  } catch (err) {
    console.warn("Storage sync unavailable:", err);
  }
}

axios.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Token ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (session expired)
    if (error.response?.status === 401) {
      console.log("❌ Session expired (401), redirecting to login...");

      // Clear auth data
      window.sessionStorage.removeItem("authToken");
      window.sessionStorage.removeItem("userInfo");
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("userInfo");

      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster position="top-center" richColors />
    </>
  </React.StrictMode>
);
