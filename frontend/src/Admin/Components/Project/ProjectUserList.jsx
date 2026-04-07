import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import ProUser from "./ProjectUser/ProjectUserList";
import ProAssignUser from "./ProjectUser/ProjectAssignUser";
import ProCreateUsers from "./ProjectUser/ProjectCreateUser";

function ProjectUserList() {
  const [activeTab, setActiveTab] = useState("userList");

  useEffect(() => {
    //   const $ = window.jQuery;
    let table = new window.DataTable('#ProjectUserTable')

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
        <ProUser />
      )}

      {activeTab === "assignUser" && (
        <ProAssignUser />
      )}

      {activeTab === "createUser" && (
        <ProCreateUsers />
      )}
    </div>
  );
}


export default ProjectUserList;