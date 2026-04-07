import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdEditLocationAlt } from "react-icons/md";
import { CiAt, CiLock } from "react-icons/ci";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BACKEND_URL, ENKETO_URL } from "../config";
import {
  BRAND_ACRONYM,
  BRAND_FULL_TITLE,
  BRAND_TAGLINE,
} from "../shared/BrandHeading";

const EnketoLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const returnUrl = searchParams.get("return") || "";

  console.log("EnketoLogin - returnUrl:", returnUrl);
  console.log("All URL params:", Object.fromEntries(searchParams));

  // Check if user is already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (token && returnUrl) {
      // User is already authenticated, set cookie and redirect
      setCookieAndRedirect(token, returnUrl);
    }
  }, [returnUrl]);

  const setCookieAndRedirect = async (token, returnUrl) => {
    try {
      console.log("Setting cookie for authenticated user...");

      // Make a request to set the authentication cookie
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/set-enketo-cookie/`,
        {},
        {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true, // This is crucial for cross-domain cookies
        }
      );

      console.log("Cookie set successfully:", response.data);

      // Wait a moment for cookie to be set, then redirect
      setTimeout(() => {
        if (returnUrl) {
          const decodedUrl = decodeURIComponent(returnUrl);
          console.log("Redirecting to:", decodedUrl);
          window.location.href = decodedUrl;
        } else {
          console.log("No return URL, redirecting to Enketo homepage");
          window.location.href = `${ENKETO_URL}/`;
        }
      }, 2000); // Increase timeout to ensure cookie propagation
    } catch (error) {
      console.error("Error setting cookie:", error);
      // Fallback: just redirect anyway
      if (returnUrl) {
        window.location.href = decodeURIComponent(returnUrl);
      } else {
        navigate("/dashboard");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    console.log("🔍 EnketoLogin attempt:");
    console.log("Backend URL:", BACKEND_URL);
    console.log("Username:", username);
    console.log("Return URL:", returnUrl);

    // First, try to fetch the CSRF token
    try {
      console.log("Fetching CSRF token...");
      const csrfResponse = await axios.get(`${BACKEND_URL}/api/csrf-token/`, {
        withCredentials: true,
        timeout: 5000, // 5 second timeout
      });

      console.log("CSRF token received:", csrfResponse.data);

      // Now proceed with login using the received token
      try {
        const response = await axios.post(
          `${BACKEND_URL}/api/auth/login/`,
          {
            username,
            password,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "X-CSRFToken": csrfResponse.data.csrfToken,
            },
            timeout: 8000, // 8 second timeout
          }
        );

        console.log("✅ EnketoLogin response:", response.data);
        const token = response.data.token;
        const user = response.data.user;

        // Save to session storage
        sessionStorage.setItem("authToken", token);
        if (user) {
          sessionStorage.setItem("userInfo", JSON.stringify(user));
        }

        console.log("Login successful, token:", token);
        console.log("Return URL:", returnUrl);

        // Set cookie and redirect
        await setCookieAndRedirect(token, returnUrl);
      } catch (loginErr) {
        console.error("❌ Login error details:", loginErr);
        handleError(loginErr);
      }
    } catch (csrfErr) {
      console.error("❌ CSRF token error:", csrfErr);
      handleError(csrfErr);
    }
  };

  // Helper function to handle various error types
  const handleError = (err) => {
    console.error("Error details:", err);
    console.error("Response:", err.response?.data);
    console.error("Status:", err.response?.status);

    if (err.code === "ERR_NETWORK") {
      setError(
        "Network error. Please check if the backend server is running at " +
          BACKEND_URL
      );
    } else if (err.response?.status === 404) {
      setError("Login endpoint not found. Please check backend configuration.");
    } else if (err.response?.status >= 500) {
      setError("Server error. Please try again later.");
    } else if (err.response?.status === 400) {
      setError("Invalid credentials. Please check your username and password.");
    } else if (err.response?.status === 403) {
      setError("CSRF verification failed. Please try refreshing the page.");
    } else if (err.code === "ECONNABORTED") {
      setError("Request timed out. Server might be slow or unreachable.");
    } else {
      setError("Login failed: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div
      className="h-screen bg-cover bg-center bg-no-repeat bg-[var(--svgMapBackgroundColor)]"
      style={{ backgroundImage: "url('/svg_earth.svg')" }}
    >
      <div className="flex items-center justify-center h-screen">
        <form
          onSubmit={handleSubmit}
          className="md:w-[506px] lg:w-[506px] bg-white p-4 rounded-[12px] border-2 border-gray-900 drop-shadow-[var(--svgMapBackgroundColor)]"
          style={{
            background:
              "linear-gradient(to bottom, var(--gradientStart) 0%, var(--gradientEnd) 30%)",
          }}
        >
          <div className="mb-4 text-center">
            <div className="inline-block p-1 rounded-md bg-blue-300/50">
              <MdEditLocationAlt className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{BRAND_FULL_TITLE}</h3>
            <p className="text-sm text-muted">{BRAND_TAGLINE}</p>
            <p className="text-xs text-gray-600">
              Secure {BRAND_ACRONYM} authentication for Enketo forms
            </p>
            {returnUrl && (
              <div className="p-2 mt-2 text-xs text-gray-600 bg-gray-100 rounded">
                <strong>Will redirect to:</strong> <br />
                <span className="text-blue-600 break-all">
                  {decodeURIComponent(returnUrl)}
                </span>
              </div>
            )}
            <hr />
          </div>

          <div className="mb-3 inputForm">
            <CiAt className="w-6 h-6" />
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="mb-3 inputForm">
            <CiLock className="w-5 h-5 mr-2" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="flex-1 bg-transparent outline-none"
              required
            />
            <div
              onClick={() => setShowPassword(!showPassword)}
              className="pr-4 cursor-pointer"
            >
              {showPassword ? (
                <FiEye className="w-5 h-5" />
              ) : (
                <FiEyeOff className="w-5 h-5" />
              )}
            </div>
          </div>

          {error && <p className="mb-3 text-danger">{error}</p>}

          <button type="submit" className="w-full btn btn-primaryColor">
            Login to Continue
          </button>

          <div className="mt-3 text-center">
            <p className="text-sm text-muted">
              This will authenticate you for Enketo form access
            </p>
            {!returnUrl && (
              <p className="mt-2 text-xs text-orange-600">
                No return URL provided. You'll be redirected to dashboard.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnketoLogin;
