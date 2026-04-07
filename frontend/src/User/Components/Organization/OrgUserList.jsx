import React, { useEffect, useState } from "react";
import "./OrgUserList.css";
import { FaEdit, FaTrash } from "react-icons/fa";
import CreateUser from "./CreateUser";
import CreateUsers from "../User/CreateUsers";
import OrgCreateUsers from "./OrganizationUser/OrgCreateUser";
import OrgUser from "./OrganizationUser/OrgUser";
import OrgAssignUser from "./OrganizationUser/OrgAssignUser";

function OrgUserList() {
  const [activeTab, setActiveTab] = useState("userList");
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    // const $ = window.jQuery;
    let table = new window.DataTable('#orgUserTable')

    return () => {
      if (table) {
        table.destroy();
      }

    };
  }, []);



  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="">
        <div className="flex justify-between items-start text-[16px] flex-col md:flex-row">
          <div className="flex gap-4 flex-col md:flex-row">
            <button
              className={` tab-button  ${activeTab === "userList" ? "active" : ""}`}
              onClick={() => switchTab("userList")}
            >
              User List
            </button>
            <button
              className={`tab-button  ${activeTab === "assignUser" ? "active" : ""}`}
              onClick={() => switchTab("assignUser")}
            >
              Assign User
            </button>
          </div>

          <button
            className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
            onClick={() => switchTab("createUser")}
          >
            Create User
          </button>
        </div>
      </div>

      {activeTab === "userList" && (
        <OrgUser setAllUsers={setAllUsers} />
      )}

      {activeTab === "assignUser" && (
        <OrgAssignUser allUsers={allUsers} />
      )}

      {activeTab === "createUser" && (
        <OrgCreateUsers />
      )}
    </div>
  );
}

export default OrgUserList;
