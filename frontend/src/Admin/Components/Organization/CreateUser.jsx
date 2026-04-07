import React, { useState } from "react";
import axios from "axios";
import "./CreateUser.css";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";
import CountryDropdown from "../../../shared/PickCountry";

function CreateUser({ onOrganizationCreated }) {
  const [form, setForm] = useState({
    name: "",
    type: "",
    website: "",
    email: "",
    location: "",
    active_user: true,
    receive_updates: false,
  });
  const [loading, setLoading] = useState(false);

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

    // Validate required fields
    if (!form.name || !form.type || !form.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.post(
        `${BACKEND_URL}/api/organizations/`,
        form,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      toast.success("Organization created and assigned successfully!");
      console.log("Organization created:", response.data);

      // Reset form
      setForm({
        name: "",
        type: "",
        website: "",
        email: "",
        location: "",
        active_user: true,
        receive_updates: false,
      });

      // Notify parent component to refresh organization list
      if (onOrganizationCreated) {
        onOrganizationCreated(response.data);
      }

      // Dispatch custom event for other components to listen
      window.dispatchEvent(
        new CustomEvent("organizationCreated", {
          detail: response.data,
        })
      );
    } catch (error) {
      console.error("Error creating organization:", error);

      if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else if (error.response?.data) {
        // Handle validation errors
        const errors = Object.values(error.response.data).flat();
        toast.error(`Error: ${errors.join(", ")}`);
      } else {
        toast.error("Error creating organization");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-3">
      <h2 className="inline-block mb-4  text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Create Organizations
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg border border-black/70"
      >
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
        <CountryDropdown form={form} handleChange={handleChange} />

        <p className="text-[18px]">Notification</p>
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
        {/* <div className="notification-item">
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
        </div> */}

        <div className="button-container">
          <button
            type="submit"
            className="save-button"
            disabled={loading}
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateUser;
