import React from "react";
import DashboardSidebar from "../Components/Dashboard/DashboardSidebar";

function Sidebar({ setAuthToken, location, isOpen, userDetails }) {
  return (
    <div>
      <div
        className={`bg-white border border-black/95 ${isOpen ? "toggled" : ""}`}
        id="sidebar-wrapper"
      >
        <div className="list-group list-group-flush mt-4">
          <DashboardSidebar
            setAuthToken={setAuthToken}
            location={location}
            userDetails={userDetails}
          />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
