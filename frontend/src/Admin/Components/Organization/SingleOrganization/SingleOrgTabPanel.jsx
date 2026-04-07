import React, { useState } from "react";
import SingleOrgUserList from "./SingleOrgUserList";
import SingleOrgAssignUser from "./SingleOrgAssignUser";
import SingleOrgFormList from "./SingleOrgFormList";
import { Link } from "react-router-dom";
import SingleOrgProjectList from "./SingleOrgProjectList";
import SingleOrgCreateProject from "./SingleOrganizationCreateProject";
import SingleOrgCreateForms from "./SingleOrgCreateForm";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import SingleOrgCreateUsers from "./SingleOrgCreateUser";

function SingleOrgTabPanel({ organizationId }) {
  const [activeTab, setActiveTab] = useState("ProjectList");
  const [showPassword, setShowPassword] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allForms, setAllForms] = useState([]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4">
      <div className="">
        <div className="flex justify-between items-center md:items-start text-[16px] flex-col md:flex-row mb-2 md:mb-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <button
              className={` tab-button  ${activeTab === "ProjectList" ? "active" : ""
                }`}
              onClick={() => switchTab("ProjectList")}
            >
              Project List
            </button>

            <button
              className={` tab-button  ${activeTab === "formList" ? "active" : ""
                }`}
              onClick={() => switchTab("formList")}
            >
              Form List
            </button>

            <button
              className={` tab-button  ${activeTab === "userList" ? "active" : ""
                }`}
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
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none  hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""
                }`}
              onClick={() => switchTab("CreateProject")}
            >
              Create Project
            </button>
          )}

          {activeTab === "formList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none  hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""
                }`}
              onClick={() => switchTab("CreateForm")}
            >
              Create Form
            </button>
          )}

          {activeTab === "userList" && (
            <button
              className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none  hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""
                }`}
              onClick={() => switchTab("createUser")}
            >
              Create User
            </button>
          )}
        </div>
      </div>

      {/*  CREATE */}
      {activeTab === "CreateProject" && <SingleOrgCreateProject />}

      {activeTab === "CreateForm" && <SingleOrgCreateForms />}
      {activeTab === "createUser" && <SingleOrgCreateUsers />}

      {/*  LISTS */}

      {activeTab === "ProjectList" && (
        <SingleOrgProjectList
          organizationId={organizationId}
          setAllProjects={setAllProjects}
        />
      )}

      {activeTab === "formList" && (
        <SingleOrgFormList
          allProjects={allProjects}
          setAllProjects={setAllProjects}

        />
      )}

      {activeTab === "userList" && (
        <SingleOrgUserList
          organizationId={organizationId}
          setAllUsers={setAllUsers}
          allProjects={allProjects}
        />
      )}

      {/* {activeTab === "assignUser" && (
        <SingleOrgAssignUser allUsers={allUsers} organizationId={organizationId} allProjects={allProjects} allForms={allForms} />
      )} */}
    </div>
  );
}

export default SingleOrgTabPanel;
