import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import "./UserOrganizations.css";

function UserOrganizations({ refreshTrigger = 0 }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(
        `${BACKEND_URL}/api/get-current-user-profile/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setUserProfile(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [refreshTrigger]);

  // Listen for organization creation events
  useEffect(() => {
    const handleOrganizationCreated = () => {
      fetchUserProfile();
    };

    const handleOrganizationListRefresh = () => {
      fetchUserProfile();
    };

    window.addEventListener("organizationCreated", handleOrganizationCreated);
    window.addEventListener(
      "organizationListRefresh",
      handleOrganizationListRefresh
    );

    return () => {
      window.removeEventListener(
        "organizationCreated",
        handleOrganizationCreated
      );
      window.removeEventListener(
        "organizationListRefresh",
        handleOrganizationListRefresh
      );
    };
  }, []);

  if (loading) {
    return (
      <div className="user-organizations-loading">Loading organizations...</div>
    );
  }

  if (error) {
    return <div className="user-organizations-error">{error}</div>;
  }

  if (
    !userProfile ||
    !userProfile.organizations ||
    userProfile.organizations.length === 0
  ) {
    return (
      <div className="user-organizations-empty">
        <p>No organizations assigned to your profile.</p>
        <p>Create an organization to get started!</p>
      </div>
    );
  }

  return (
    <div className="user-organizations">
      <h3>My Organizations</h3>
      <div className="organizations-list">
        {userProfile.organizations.map((org) => (
          <div key={org.id} className="organization-card">
            <div className="organization-header">
              <h4>{org.name}</h4>
              <span className="organization-type">{org.type}</span>
            </div>
            <div className="organization-details">
              {org.email && (
                <p className="organization-email">
                  <strong>Email:</strong> {org.email}
                </p>
              )}
              {org.website && (
                <p className="organization-website">
                  <strong>Website:</strong>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {org.website}
                  </a>
                </p>
              )}
              {org.location && (
                <p className="organization-location">
                  <strong>Location:</strong> {org.location}
                </p>
              )}
              <p className="organization-status">
                <strong>Active:</strong> {org.active_user ? "Yes" : "No"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserOrganizations;
