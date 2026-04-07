import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    is_staff: false, // <-- add this
  });
  const [message, setMessage] = useState("");
  const user = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const isUserAdmin = user.role === 1;

  console.log("form :", form);
  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    axios
      .get(`${BACKEND_URL}/api/users/${id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => setForm({ ...res.data, password: "********" }))
      .catch(() => toast.error("Failed to load user."));
  }, [id]);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e) => {
    const { name, value, type, checked, id } = e.target;
    if (name === "is_staff") {
      setForm({ ...form, is_staff: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("authToken");
    const data = { ...form };
    // If password is blank or "********", remove it from the payload
    if (!data.password || data.password === "********") {
      delete data.password;
    }
    try {
      //updated put to patch tp avoid 404 error from server
      await axios.patch(`${BACKEND_URL}/api/users/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      toast.success("User updated successfully!");
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      toast.error("Failed to update user.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="inline-block mb-4 text-sm border-b-2 border-blue-600 border-solid">
        Edit User
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
            disabled // Username should not be editable
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
            placeholder="Enter new password (leave as ******** to keep old password)"
            className="w-full px-3 py-2 border rounded"
            autoComplete="new-password"
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
          <div className="mt-1 text-xs text-gray-500">
            For security, the old password is not shown. Enter a new password to
            change it.
          </div>
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
            disabled={!isUserAdmin} // Disable if not admin
          >
            <option value="" disabled>
              Select Role
            </option>
            <option value={"1"}>Admin</option>
            {/* <option value={"2"}>Organization</option>
            <option value={"3"}>Project</option> */}
            <option value={"6"}>Officer</option>
            <option value={"4"}>User</option>
          </select>
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

export default EditUser;
