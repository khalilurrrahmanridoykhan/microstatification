import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { BACKEND_URL } from "../../../config"; // Add this line at the top
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";


function CreateProject() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    organization: "",
    description: "",
    organizationType: "",
    organizationWebsite: "",
    password: "",
    location: "",
    activeUser: true,
    receiveUpdates: false,
    species: [], // Array of selected species IDs
  });
  const [errors, setErrors] = useState({});
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    const fetchMyOrganizations = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
        const orgIds = userInfo?.profile?.organizations || [];
        const headers = { Authorization: `Token ${token}` };

        const results = await Promise.allSettled(
          orgIds.map(id =>
            axios
              .get(`${BACKEND_URL}/api/organizations/${id}/`, { headers })
              .then(r => r.data)
          )
        );

        const myOrgs = results
          .filter(r => r.status === "fulfilled")
          .map(r => r.value);

        setOrganizations(myOrgs);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
      }
    };

    fetchMyOrganizations();
  }, []);

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

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});

    try {
      /* 1️⃣  Create the project */
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Token ${token}` };

      const createRes = await axios.post(
        `${BACKEND_URL}/api/projects/`,
        {
          name: form.name,
          organization: form.organization,     // org ID
          description: form.description,
          organization_type: form.organizationType,
          organization_website: form.organizationWebsite,
          password: form.password,
          location: form.location,
          active_user: form.activeUser,
          receive_updates: form.receiveUpdates,
          species: form.species,               // array of IDs
        },
        { headers }
      );

      const projectId = createRes.data.id;     // <-- new ID
      console.log("Project created with ID:", projectId);

      /* 2️⃣  Append the ID to profile.projects */
      const currentInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
      const { username, profile = {} } = currentInfo;

      const updatedProjectIds = [
        ...(profile.projects || []),
        Number(projectId),
      ];

      await axios.patch(
        `${BACKEND_URL}/api/users/${username}/`,
        { profile: { projects: updatedProjectIds } },
        { headers }
      );

      /* Update client cache */
      sessionStorage.setItem(
        "userInfo",
        JSON.stringify({
          ...currentInfo,
          profile: { ...profile, projects: updatedProjectIds },
        })
      );

      toast.success("Project created successfully");
      navigate(`/projects/all`);
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error(
        err.response?.data || "Error creating project"
      );
    }
  };

  return (
    <div className="px-4 py-3">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Create Project
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-black/70">
        <div className="form-group">
          <label htmlFor="name">Project Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter project name"
            value={form.name}
            onChange={handleChange}
            required
          />
          {errors.name && (
            <div className="mt-1 text-sm text-red-500">{errors.name[0]}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Project Description</label>
          <textarea
            id="description"
            placeholder="Enter project description"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            rows="4"

          />
        </div>
        <div className="form-group">
          <label htmlFor="organization">Organization</label>
          <select
            id="organization"
            value={form.organization || ""}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>


        {/* <div className="relative form-group">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Enter project password"
            className="w-full px-3 py-2 border rounded"
            value={form.password}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-[38px] right-8 text-gray-500 focus:outline-none"
          >
            {showPassword ? (
              <FaEye className="w-6 h-6" />
            ) : (
              <FaEyeSlash className="w-6 h-6" />
            )}
          </button>
        </div> */}

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <select id="location" value={form.location} onChange={handleChange}>
            <option value="">Select location</option>
            <option>Bangladesh</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Canada</option>
            <option>Other</option>
          </select>
        </div>


        <MultiSelectDropdown form={form} setForm={setForm} errors={errors} />


        <p className="text-[18px]">Notification</p>
        <div className="notification-item">
          <input
            type="checkbox"
            id="activeUser"
            className="toggle-input"
            checked={form.activeUser}
            onChange={handleChange}
          />
          <label htmlFor="activeUser" className="toggle-switch"></label>
          <label htmlFor="activeUser" className="notification-label">
            Active user for work
          </label>
        </div>


        <div className="button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProject;






function MultiSelectDropdown({ form, setForm, errors }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const speciesOptions = [
    { id: 1, label: "Human" },
    { id: 4, label: "Mosquito" },
    { id: 2, label: "Dog" },
    { id: 3, label: "Cat" },
    { id: 5, label: "parasites" },
    { id: 6, label: "bat" },
    { id: 7, label: "Other" }
  ];
  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (id) => {
    const newSelection = form.species.includes(id)
      ? form.species.filter((item) => item !== id)
      : [...form.species, id];
    setForm((prev) => ({ ...prev, species: newSelection }));
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-group relative" ref={dropdownRef}>
      <label className="block mb-1 font-medium text-gray-700">Surveyed Hosts</label>

      {/* Dropdown box */}
      <div
        className="w-full border rounded px-3 py-2 bg-white cursor-pointer"
        onClick={toggleDropdown}
      >
        {form.species.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {speciesOptions
              .filter((opt) => form.species.includes(opt.id))
              .map((opt) => (
                <span
                  key={opt.id}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  {opt.label}
                </span>
              ))}
          </div>
        ) : (
          <span className="text-gray-400">Select surveyed hosts...</span>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {speciesOptions.map((option) => (
            <div
              key={option.id}
              className={`px-4 py-2 hover:bg-blue-50 flex items-center cursor-pointer ${form.species.includes(option.id) ? "bg-blue-100" : ""
                }`}
              onClick={() => handleSelect(option.id)}
            >
              <input
                type="checkbox"
                className="mr-2"
                readOnly
                checked={form.species.includes(option.id)}
              />
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {errors.species && (
        <div className="mt-1 text-sm text-red-500">{errors.species[0]}</div>
      )}
      <small className="text-gray-500">Select one or more surveyed hosts</small>
    </div>
  );
}

