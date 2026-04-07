import React, { useState } from "react";
import "./CreateUser.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { BACKEND_URL } from "../../../config"; // Add this line at the top
import { useNavigate } from "react-router-dom";

function CreateProjectUser() {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organizationType: "",
    organizationWebsite: "",
    password: "",
    location: "",
    activeUser: false,
    receiveUpdates: false,
    species: [], // Array of selected species IDs
  });
  const [errors, setErrors] = useState({});

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e) => {
    const { id, value, type, checked, multiple, options } = e.target;
    if (id === "species") {
      // For multi-select, collect selected values as array of numbers
      const selected = Array.from(options)
        .filter((opt) => opt.selected)
        .map((opt) => Number(opt.value));
      setForm((prev) => ({
        ...prev,
        species: selected,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [id]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.post(
        `${BACKEND_URL}/api/projects/`,
        {
          name: form.name,
          description: "",
          organization_type: form.organizationType,
          organization_website: form.organizationWebsite,
          password: form.password,
          location: form.location,
          active_user: form.activeUser,
          receive_updates: form.receiveUpdates,
          species: form.species, // This will be an array of IDs
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      alert("Project created successfully");
      navigate("/projects/all");
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        alert("Error creating project");
      }
      console.error(error);
    }
  };
  return (
    <div class="container">
      <h2 className="text-[20px] border-b-2 border-blue-600 border-solid inline-block">
        Create
      </h2>
      <form>
        <div class="form-group">
          <label for="organizationName">Project Name</label>
          <input
            type="text"
            id="organizationName"
            placeholder="Enter project name"
          />
        </div>
        <div class="form-group">
          <label className="block font-medium text-sm text-gray-800 mb-1">Description</label>
          <textarea
            placeholder="Enter short description here"
            className="w-full border border-gray-300 rounded px-4 py-2 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="organizationType">Organization Type</label>
            <select id="organizationType">
              <option>Government Organizations</option>
              <option>Autonomous & Semi-Autonomous Bodies</option>
              <option>Non-Governmental Organizations (NGOs)</option>
              <option>International Organizations / UN Agencies</option>
              <option>Private Sector Organizations</option>
              <option>Academic & Research Institutions</option>
              <option>Local Government Institutions</option>
              <option>Community-Based Organizations (CBOs)</option>
              <option>Social Enterprises & Foundations</option>
            </select>
          </div>
          <div class="form-group">
            <label for="organizationWebsite">Organization Website</label>
            <input
              type="url"
              id="organizationWebsite"
              placeholder="Enter website URL"
            />
          </div>
        </div>


        <div className="form-group relative">
          <label htmlFor="projectPassword" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="projectPassword"
            placeholder="Enter project password"
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-[38px] right-8 text-gray-500 focus:outline-none"
          >
            {showPassword ? <FaEye className="w-6 h-6" /> : <FaEyeSlash className="w-6 h-6" />}
          </button>
        </div>


        <div class="form-group">
          <label for="location">Location</label>
          <select id="location">
            <option>Bangladesh</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>canada</option>
            <option>Other</option>
          </select>
        </div>

        <h3>Notification</h3>
        <div class="notification-item">
          <input type="checkbox" id="activeUser" class="toggle-input" />
          <label for="activeUser" class="toggle-switch"></label>
          <label for="activeUser" class="notification-label">
            Active user for work
          </label>
        </div>
        <div class="notification-item">
          <input type="checkbox" id="receiveUpdates" class="toggle-input" />
          <label for="receiveUpdates" class="toggle-switch"></label>
          <label for="receiveUpdates" class="notification-label">
            I receive all updates
          </label>
        </div>

        <div class="button-container">
          <button type="submit" class="save-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProjectUser;
