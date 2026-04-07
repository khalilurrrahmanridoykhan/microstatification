import axios from "axios";
import { BACKEND_URL } from "./config";

const API = axios.create({
  baseURL: `${BACKEND_URL}/api/`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Function to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      // Check if this cookie string begins with the name we want
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  console.log(
    `Cookie ${name}:`,
    cookieValue?.substring(0, 10) + "..." || "NOT_FOUND"
  );
  return cookieValue;
}

// Function to get CSRF token from Django API
export const getCSRFToken = async () => {
  try {
    console.log("Getting CSRF token from", `${BACKEND_URL}/api/csrf-token/`);
    const response = await axios.get(`${BACKEND_URL}/api/csrf-token/`, {
      withCredentials: true,
      timeout: 5000, // 5 seconds timeout
    });
    console.log("CSRF token response:", response.data);
    return response.data.csrfToken; // Note: backend returns csrfToken, not csrf_token
  } catch (error) {
    console.error("Error getting CSRF token:", error);
    return null;
  }
};

// Add CSRF token to all requests with retry logic
API.interceptors.request.use(async (config) => {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    config.headers["Authorization"] = `Token ${token}`;
  }

  // Skip CSRF for login/register endpoints
  if (
    config.url.includes("auth/login") ||
    config.url.includes("auth/register")
  ) {
    return config;
  }

  // Add CSRF token for unsafe methods
  if (["post", "put", "patch", "delete"].includes(config.method)) {
    let csrfToken = getCookie("csrftoken");

    console.log("🔍 CSRF Debug Info:");
    console.log("Method:", config.method);
    console.log(
      "Cookie token:",
      csrfToken?.substring(0, 10) + "..." || "NOT_FOUND"
    );
    console.log("All cookies:", document.cookie);

    // If no cookie CSRF token, get it from the API
    if (!csrfToken) {
      console.log("No CSRF cookie found, fetching from API...");
      csrfToken = await getCSRFToken();
      console.log(
        "API token:",
        csrfToken?.substring(0, 10) + "..." || "FAILED"
      );
    }

    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
      console.log(
        "✅ Adding CSRF token to request:",
        csrfToken.substring(0, 10) + "..."
      );
    } else {
      console.warn("❌ No CSRF token available for request");
    }
  }

  return config;
});

// Enhanced response interceptor with retry logic
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (session expired)
    if (error.response?.status === 401) {
      console.log("❌ Session expired (401), redirecting to login...");

      // Clear auth data
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userInfo");
      localStorage.removeItem("authToken");
      localStorage.removeItem("userInfo");

      // Redirect to login page
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Handle CSRF 403 errors
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.includes("CSRF") &&
      !originalRequest._retry
    ) {
      console.log(
        "CSRF error detected, attempting to refresh token and retry..."
      );
      originalRequest._retry = true;

      try {
        // Get a fresh CSRF token
        const newToken = await getCSRFToken();
        if (newToken) {
          originalRequest.headers["X-CSRFToken"] = newToken;
          return API(originalRequest);
        }
      } catch (retryError) {
        console.error("Failed to refresh CSRF token:", retryError);
      }
    }
    return Promise.reject(error);
  }
);

// Export your API functions
export const fetchForms = () => API.get("forms/");
export const submitForm = (data) => API.post("submissions/", data);
export const fetchProjects = () => API.get("projects/");
export const createProject = (data) => API.post("projects/", data);
export const deleteProject = (projectId) =>
  API.delete(`projects/${projectId}/`);
export const fetchProject = (projectId) => API.get(`projects/${projectId}/`);
export const updateProject = (projectId, data) =>
  API.put(`projects/${projectId}/`, data);
export const updateOrganization = (id, data) =>
  API.put(`organizations/${id}/`, data);

// Add this to your api.js for testing
export const debugCSRF = async () => {
  console.log("=== CSRF Debug Info ===");

  // Check current cookies
  console.log("All cookies:", document.cookie);

  // Check for CSRF cookie
  const cookieToken = getCookie("csrftoken");
  console.log(
    "CSRF cookie:",
    cookieToken?.substring(0, 10) + "..." || "Not found"
  );

  // Get fresh token from API
  const apiToken = await getCSRFToken();
  console.log(
    "API token:",
    apiToken?.substring(0, 10) + "..." || "Failed to get"
  );

  // Test actual request
  try {
    const response = await API.get("projects/");
    console.log("Test GET request: Success");
  } catch (error) {
    console.log("Test GET request: Failed", error.message);
  }

  console.log("=== End Debug Info ===");
};

export default API;
