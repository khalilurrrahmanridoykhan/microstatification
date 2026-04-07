import React from "react";
import DashboardSidebar from "../Components/Dashboard/DashboardSidebar";

function Sidebar({ setAuthToken, location, isOpen }) {
  return (
    <div>
      <div
        className={`bg-white border border-black/95  ${
          isOpen ? "toggled" : ""
        }`}
        id="sidebar-wrapper"
      >
        <div className="list-group list-group-flush mt-4">
          <DashboardSidebar setAuthToken={setAuthToken} location={location} />
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
