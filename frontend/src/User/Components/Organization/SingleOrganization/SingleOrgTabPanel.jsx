import React, { useState } from "react";
import SingleOrgUserList from "./SingleOrgUserList";
import SingleOrgAssignUser from "./SingleOrgAssignUser";
import SingleOrgFormList from "./SingleOrgFormList";
import { Link, useParams } from "react-router-dom";
import SingleOrgProjectList from "./SingleOrgProjectList";
import SingleOrgCreateProject from "./SingleOrganizationCreateProject";
import SingleOrgCreateForms from "./SingleOrgCreateForm";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SingleOrgCreateUsers from "./SingleOrgCreateUser";

function SingleOrgTabPanel({ organizationId }) {
  const [activeTab, setActiveTab] = useState("ProjectList");
  const [allUsers, setAllUsers] = useState([]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="">
        <div className="flex justify-between items-center md:items-start text-[16px] flex-col md:flex-row mb-2 md:mb-6">
          <div className="flex gap-4 flex-col  md:flex-row">
            <button
              className={` tab-button  ${activeTab === "ProjectList" ? "active" : ""}`}
              onClick={() => switchTab("ProjectList")}
            >
              Project List
            </button>

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
            {/* <button
              className={`tab-button  ${activeTab === "assignUser" ? "active" : ""}`}
              onClick={() => switchTab("assignUser")}
            >
              Assign User
            </button> */}


          </div>


          {activeTab === "ProjectList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
              onClick={() => switchTab("CreateProject")}
            >
              Create Project
            </button>
          )}


          {activeTab === "formList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
              onClick={() => switchTab("CreateForm")}
            >
              Create Form
            </button>
          )}

          {activeTab === "userList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
              onClick={() => switchTab("createUser")}
            >
              Create User
            </button>
          )}




        </div>
      </div>


      {activeTab === "ProjectList" && (
        <SingleOrgProjectList organizationId={organizationId} />
      )}

      {activeTab === "CreateProject" && (
        <SingleOrgCreateProject />
      )}

      {/* form */}

      {activeTab === "CreateForm" && (
        <SingleOrgCreateForms />
      )}


      {activeTab === "formList" && (
        <SingleOrgFormList />
      )}

      {/* userz */}
      {activeTab === "userList" && (
        <SingleOrgUserList organizationId={organizationId} setAllUsers={setAllUsers} />
      )}

      {/* assign user  + get all user list from userlist */}

      {/* {activeTab === "assignUser" && (
        <SingleOrgAssignUser allUsers={allUsers} />
      )} */}

      {activeTab === "createUser" && (
        <SingleOrgCreateUsers />
      )}
    </div>
  );
}


export default SingleOrgTabPanel