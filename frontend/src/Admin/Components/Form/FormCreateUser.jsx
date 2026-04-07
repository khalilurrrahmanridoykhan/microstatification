import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from 'sonner';
import { BACKEND_URL } from "../../../config";

function FormCreateUsers() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    is_staff: false, // Add this field
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
      await axios.post(`${BACKEND_URL}/api/auth/register/`, form);
     toast.success("User created successfully!");
      setForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        role: "",
        is_staff: false, // Reset this field
      });
    } catch (err) {
      toast.error("Failed to create user.");
    }
  };

  return (
    <div className="p-4 bg-white ">
      <h2 className="inline-block mb-4 text-sm border-b-2 border-blue-600 border-solid">
        Create User
      </h2>
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
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
          <label htmlFor="last_name">Last Name</label>
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
          <label htmlFor="username">Username</label>
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
            required
          />
        </div>
        <div className="relative form-group">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
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
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            required
          >
            <option value="" disabled>
              Select Role
            </option>
            <option value={"1"}>Admin</option>
            <option value={"2"}>Organization</option>
            <option value={"3"}>Project</option>
            <option value={"5"}>Form</option>
            <option value={"4"}>User</option>
          </select>
        </div>
        <div className="col-span-2">
          <h3 className="mt-6 mb-2 text-lg font-semibold">Notification</h3>
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="receiveUpdates"
              className="mr-2 toggle-input"
            />
            <label
              htmlFor="receiveUpdates"
              className="mr-2 toggle-switch"
            ></label>
            <label htmlFor="receiveUpdates" className="notification-label">
              I receive all updates
            </label>
          </div>
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

export default FormCreateUsers;
