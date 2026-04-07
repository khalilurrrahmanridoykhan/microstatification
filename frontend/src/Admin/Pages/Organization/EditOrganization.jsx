import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function EditOrganization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    type: "",
    website: "",
    email: "",
    location: "",
    active_user: false,
    receive_updates: false,
  });

  useEffect(() => {
    const fetchOrg = async () => {
      const token = sessionStorage.getItem("authToken");
      const res = await axios.get(`${BACKEND_URL}/api/organizations/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setForm(res.data);
    };
    fetchOrg();
  }, [id]);

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
      await axios.put(`${BACKEND_URL}/api/organizations/${id}/`, form, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("Organization updated successfully!");
      navigate("/organization/all");
    } catch (error) {
      toast.error("Error updating organization");
    }
  };

  return (
    <div className="px-4 py-3">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Edit Organization
      </h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg">
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

        <div className="button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditOrganization;
