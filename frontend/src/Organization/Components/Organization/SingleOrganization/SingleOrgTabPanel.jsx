import React, { useState } from "react";
import SingleOrgUserList from "./SingleOrgUserList";
import SingleOrgAssignUser from "./SingleOrgAssignUser";
import SingleOrgFormList from "./SingleOrgFormList";
import { Link } from "react-router-dom";

function SingleOrgTabPanel() {
  const [activeTab, setActiveTab] = useState("userList");

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="">
        <div className="flex justify-between items-center md:items-start text-[16px] flex-col md:flex-row mb-2 md:mb-6">
          <div className="flex gap-4 flex-col  md:flex-row">
            <button
              className={` tab-button  ${activeTab === "formList" ? "active" : ""}`}
              onClick={() => switchTab("formList")}
            >
              Form List
            </button>

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

          {activeTab === "formList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
            >
              <Link to="/organization/single-org" className='no-underline  text-white'>Create form</Link>
            </button>
          )}

          {activeTab === "userList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
            >
              <Link to="/organization/single-org" className='no-underline text-white'>Create User</Link>
            </button>
          )}


        </div>
      </div>



      {activeTab === "formList" && (
        <SingleOrgFormList />
      )}

      {activeTab === "userList" && (
        <SingleOrgUserList />
      )}

      {activeTab === "assignUser" && (
        <SingleOrgAssignUser />
      )}
    </div>
  );
}


export default SingleOrgTabPanel