import React, { useState } from "react";
import "./CreateUser.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

const RequiredMark = () => (
  <span className="ml-1 text-red-500" aria-hidden="true">
    *
  </span>
);

function CreateUsers() {
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const isMicroAdminUser = Number(userInfo?.role) === 7;
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "4",
    is_staff: false,
  });
  const [message, setMessage] = useState("");
  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    if (id === "activeUser") {
      setForm({ ...form, is_staff: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("authToken");
      const payload = {
        username: form.username.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        role: Number(form.role) || 4,
        is_staff: isMicroAdminUser ? false : form.is_staff,
      };

      await axios.post(`${BACKEND_URL}/api/users/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("User created successfully!");
      setForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "4",
        is_staff: false,
      });
      setMessage("");
    } catch (err) {
      const errorData = err.response?.data || {};
      const firstError =
        Object.values(errorData)?.flat?.()?.[0] ||
        errorData?.detail ||
        "Failed to create user.";
      setMessage(String(firstError));
      toast.error(String(firstError));
    }
  };

  return (
    <div className="">
      <p className="inline-block mb-4 text-[22px] border-b-2 border-blue-400 border-solid">
        Create User
      </p>
      <form
        className="bg-white rounded-lg p-4 border border-black/70 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="first_name">
            First Name
            <RequiredMark />
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="First Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_name">
            Last Name
            <RequiredMark />
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="username">
            Username
            <RequiredMark />
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div className="relative form-group">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
            <RequiredMark />
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
            required
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-[38px] right-6 text-gray-500 focus:outline-none"
          >
            {showPassword ? (
              <FaEye className="w-5 h-5" />
            ) : (
              <FaEyeSlash className="w-5 h-5" />
            )}
          </button>
        </div>
        {isMicroAdminUser && (
          <div className="form-group">
            <label htmlFor="role">
              Role
              <RequiredMark />
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="4">User</option>
              <option value="8">SK</option>
              <option value="9">SHW</option>
            </select>
          </div>
        )}
        <div className="col-span-2">
          {isMicroAdminUser ? (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
              Microstatification admins can create only `User`, `SK`, and `SHW`
              accounts here. Location assignment can be completed from `Assign User`.
            </div>
          ) : (
            <>
              <h3 className="mt-6 mb-2 text-[18px]">Notification</h3>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="activeUser"
                  className="mr-2 toggle-input"
                  checked={form.is_staff}
                  onChange={handleChange}
                />
                <label htmlFor="activeUser" className="mr-2 toggle-switch"></label>
                <label htmlFor="activeUser" className="notification-label">
                  Active user for work
                </label>
              </div>
            </>
          )}
        </div>
        <div className="col-span-2 mt-6 button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
        {message && (
          <div className="col-span-2 mt-2 text-center text-red-500">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CreateUsers;
