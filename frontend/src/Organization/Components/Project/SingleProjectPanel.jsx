import React, { useState } from "react";
import SingleProjectTemplateList from "./SingleProjectTemplateList";
import { Link } from "react-router-dom";
import OrgProjectFormsList from "../../Pages/Project/OrganizationSingleProjectList";

function SingleProjectTabPanel() {
    const [activeTab, setActiveTab] = useState("formList");
    const [projectName, setProjectName] = useState("");

    const switchTab = (tabId) => {
        setActiveTab(tabId);
    };

    return (
        <div className="">
            <div className="mb-3 d-flex justify-content-between align-items-center ">

                <h2 className="inline-block mb-4 text-black text-[22px]  border-b-2 border-blue-400 border-solid">
                    Project forms: <span className="text-[22px] text-blue-500">{projectName}</span>
                </h2>


                <button className="btn save-button" onClick={handleCreateForm}>
                    Create Form
                </button>
            </div>


            <div className="flex justify-between items-center md:items-start text-[16px] flex-col md:flex-row mb-2 md:mb-6">
                <div className="flex gap-4 flex-col md:flex-row">
                    <button
                        className={`tab-button ${activeTab === "formList" ? "active" : ""}`}
                        onClick={() => switchTab("formList")}
                    >
                        Form List
                    </button>

                    <button
                        className={`tab-button ${activeTab === "templateList" ? "active" : ""}`}
                        onClick={() => switchTab("templateList")}
                    >
                        Template List
                    </button>

                    {/* <button
                        className={`tab-button ${activeTab === "assignUser" ? "active" : ""}`}
                        onClick={() => switchTab("assignUser")}
                    >
                        User List
                    </button> */}
                </div>

                {activeTab === "formList" && (
                    <button className="bg-[var(--primary2)] text-white px-5 py-2 rounded-lg hover:bg-[#1814f3cb] hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] transition-all mt-btn">
                        <Link to="/project/single-project" className="no-underline text-white">
                            Create Form
                        </Link>
                    </button>
                )}

                {/* {activeTab === "templateList" && (
                    <button className="bg-[var(--primary2)] text-white px-5 py-2 rounded-lg hover:bg-[#1814f3cb] hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] transition-all mt-btn">
                        <Link to="/project/single-project" className="no-underline text-white">
                            Create Template
                        </Link>
                    </button>
                )} */}
            </div>

            {activeTab === "formList" && <OrgProjectFormsList />}
            {activeTab === "templateList" && <SingleProjectTemplateList />}
            {/* {activeTab === "assignUser" && <SingleProjectAssignUser />} */}
        </div>
    );
}

export default SingleProjectTabPanel;
