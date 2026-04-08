import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../index.css";
import { MdEditLocationAlt } from "react-icons/md";
import { CiAt } from "react-icons/ci";
import { CiLock } from "react-icons/ci";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { BACKEND_URL, BRAC_DOWNLOAD_USERNAME } from "../config";

const MALARIA_TOKEN_KEY = "malaria_auth_token";

const getMicroRole = (user) =>
  String(user?.profile?.micro_role || "").toLowerCase();

const isMalariaFieldUser = (user) => {
  const role = Number(user?.role || 0);
  const microRole = getMicroRole(user);
  return role === 8 || role === 9 || microRole === "sk" || microRole === "shw";
};

const hasMalariaWorkspaceAccess = (user) => {
  const role = Number(user?.role || 0);
  const microRole = getMicroRole(user);
  return (
    role === 1 ||
    role === 7 ||
    role === 8 ||
    role === 9 ||
    microRole === "micro_admin" ||
    microRole === "sk" ||
    microRole === "shw"
  );
};

const Login = ({ setAuthToken }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    console.log("🔍 Login attempt:");
    console.log("Backend URL:", BACKEND_URL);
    console.log("Username:", username);
    console.log("Current location:", window.location.href);

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

        console.log("✅ Login response:", response.data);
        const token = response.data.token;
        const user = response.data.user;

        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("userInfo", JSON.stringify(user));
        setAuthToken(token);

        const nextPath =
          isMalariaFieldUser(user)
            ? "/malaria/"
            : user?.username === BRAC_DOWNLOAD_USERNAME
            ? "/projects/55/all-rows"
            : "/dashboard";

        if (hasMalariaWorkspaceAccess(user)) {
          localStorage.setItem(MALARIA_TOKEN_KEY, token);
        } else {
          localStorage.removeItem(MALARIA_TOKEN_KEY);
        }

        // Navigate first, then reload to avoid any race conditions
        if (nextPath === "/malaria/") {
          window.location.replace(nextPath);
        } else {
          navigate(nextPath);
          setTimeout(() => window.location.reload(), 100);
        }
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
      <div className="flex items-center justify-center h-screen md:h-screen">
        <form
          onSubmit={handleSubmit}
          className="md:w-[506px] lg:w-[506px] bg-white  p-4 rounded-[12px] border-2 border-gray-900  lg:mt-[5%] mb-4 drop-shadow-[var(--svgMapBackgroundColor)] "
          style={{
            background:
              "linear-gradient(to bottom, var(--gradientStart) 0%, var(--gradientEnd) 30%)",
          }}
        >
          <div className="mb-4 text-center">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-blue-300/50">
              <MdEditLocationAlt className="w-8 h-8 text-blue-600" />
            </div>
            <hr className="mt-4" />
          </div>

          <div className="mb-3 inputForm">
            <CiAt className="w-6 h-6 " />
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
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

          <div className="flex items-center justify-start gap-2 mb-2">
            <input
              id="checkboxLogin"
              type="checkbox"
              checked={remember}
              className="custom-checkbox"
              onChange={() => setRemember(!remember)}
            />

            <label htmlFor="checkboxLogin" className="m-0 text-sm text-muted">
              Remember me
            </label>
          </div>

          {error && <p className="text-danger">{error}</p>}
          <button type="submit" className="w-full btn btn-primaryColor">
            Login
          </button>
          <p className="mt-2 text-sm text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold linkTag">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
