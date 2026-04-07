import React, { useState } from "react";
import axios from "axios";
import "./CreateUser.css";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    type: "",
    website: "",
    email: "",
    location: "",
    active_user: false,
    receive_updates: false,
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [id === "organizationName"
        ? "name"
        : id === "organizationType"
        ? "type"
        : id === "organizationWebsite"
        ? "website"
        : id === "organizationMail"
        ? "email"
        : id === "location"
        ? "location"
        : id === "activeUser"
        ? "active_user"
        : id === "receiveUpdates"
        ? "receive_updates"
        : id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.post(`${BACKEND_URL}/api/organizations/`, form, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      toast.success("Organization created successfully!");
      setForm({
        name: "",
        type: "",
        website: "",
        email: "",
        location: "",
        active_user: false,
        receive_updates: false,
      });
      
    } catch (error) {
      toast.error("Error creating organization");
      
    }
  };

  return (
    <div className="container">
      <h2>Create Organization</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="organizationName">Organization Name</label>
          <input
            type="text"
            id="organizationName"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter organization name"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="organizationType">Organization Type</label>
            <select
              id="organizationType"
              value={form.type}
              onChange={handleChange}
            >
              <option value="">Select type</option>
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
          <div className="form-group">
            <label htmlFor="organizationWebsite">Organization Website</label>
            <input
              type="url"
              id="organizationWebsite"
              value={form.website}
              onChange={handleChange}
              placeholder="Enter website URL"
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="organizationMail">Organization Mail</label>
          <input
            type="email"
            id="organizationMail"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter organization email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <select id="location" value={form.location} onChange={handleChange}>
            <option value="">Select location</option>
            <option>Canada</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Bangladesh</option>
            <option>Other</option>
          </select>
        </div>

        <h3>Notification</h3>
        <div className="notification-item">
          <input
            type="checkbox"
            id="activeUser"
            className="toggle-input"
            checked={form.active_user}
            onChange={handleChange}
          />
          <label htmlFor="activeUser" className="toggle-switch"></label>
          <label htmlFor="activeUser" className="notification-label">
            Active user for work
          </label>
        </div>
        <div className="notification-item">
          <input
            type="checkbox"
            id="receiveUpdates"
            className="toggle-input"
            checked={form.receive_updates}
            onChange={handleChange}
          />
          <label htmlFor="receiveUpdates" className="toggle-switch"></label>
          <label htmlFor="receiveUpdates" className="notification-label">
            I receive all updates
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

export default CreateUser;
