import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import SingleProjectForm from './SingleProjectForm';
import SingleProjectUser from './SingleProjectUser';
import SingleProjectFormTamplate from './SingleProjectFormTamplate';

function SingleProTabPanel({ projectId, projectData }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const tabFromUrl = searchParams.get("tab") || "FormList";
    const [activeTab, setActiveTab] = useState(tabFromUrl);

    const switchTab = (tabId) => {
        setActiveTab(tabId);
    };

    const tabs = [
        { key: "FormList", label: "Form" },
        { key: "UserList", label: "User" },
        { key: "Template", label: "Template" },
        // { key: "profile", label: "Data Profile" },
    ];



    useEffect(() => {
        setSearchParams({ tab: activeTab }, { replace: true });
    }, [activeTab, setSearchParams]);

    return (
        <div className="p-4">
            {/* Tab buttons */}
            <div className="flex justify-between items-center flex-col md:flex-row mb-6 gap-4">
                <div className="flex flex-wrap gap-4 text-[16px]">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`mx-4 pb-2 text-[15px] font-medium transition-all border-b-2 ${activeTab === tab.key
                                ? "border-[#1f93f2] text-[#1f93f2] font-semibold"
                                : "border-transparent text-gray-800 hover:text-blue-500"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Create Buttons */}
                {activeTab === "FormList" && (
                    <button
                        className="bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)]"
                        onClick={() => navigate(`/forms/create-form/${projectId}`)}
                    >
                        Create Form
                    </button>
                )}

                {activeTab === "UserList" && (
                    <button
                        className="bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)]"
                        onClick={() => navigate(`/user/create`)}
                    >
                        Create User
                    </button>
                )}

                {/* {activeTab === "Template" && (
                    <button
                        className="bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)]"
                        onClick={() => switchTab("CreateTemplate")}
                    >
                        Create Template
                    </button>
                )} */}
            </div>

            {/* CREATE PANELS */}
            {/* {activeTab === "CreateForm" && (
                <CreateProjectForm projectId={projectId} projectData={projectData} />
            )}
            {activeTab === "CreateUser" && (
                <CreateProjectUser projectId={projectId} projectData={projectData} />
            )}
            {activeTab === "CreateTemplate" && (
                <CreateProjectTemplate projectId={projectId} projectData={projectData} />
            )} */}

            {/* LIST PANELS */}
            {activeTab === "FormList" && (
                <SingleProjectForm projectId={projectId} projectData={projectData} />
            )}
            {activeTab === "UserList" && (
                <SingleProjectUser projectId={projectId} projectData={projectData} />
            )}
            {activeTab === "Template" && (
                <SingleProjectFormTamplate projectId={projectId} projectData={projectData} />
            )}
        </div>
    );
}

export default SingleProTabPanel;

