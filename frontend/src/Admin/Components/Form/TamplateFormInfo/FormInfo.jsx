import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

import FormSummary from "../FormSummary";
import Form from "./Form";
import FormData from "../FormData";
import DataProfile from "./DataProfile";
// import Settings from "./Settings";

const tabs = [
  { key: "summary", label: "Summary" },
  { key: "form", label: "Form" },
  { key: "data", label: "Data" },
  // { key: "profile", label: "Data Profile" },
];

const FormInfo = () => {
  const { formId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({});
  const tabFromUrl = searchParams.get("tab") || "summary";
  const [activeTab, setActiveTab] = useState(tabFromUrl);


  useEffect(() => {
    const fetchForm = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          params: { include_submissions: "false" },
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setForm(response.data);
      } catch (error) {
        console.error("Error fetching form:", error);
      }
    };

    fetchForm();
  }, [formId]);

  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);


  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        return <FormSummary />;
      case "form":
        return <Form formMeta={form} />;
      case "data":
        return <FormData />;
      case "profile":
        return <DataProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 py-2">
      <p className="bg-slate-200 p-2 rounded-xl text-center  text-[18px]">Template Form</p>
      <p className="text-[18px] text-center text-gray-500 mb-6">
        Form name: <span className="text-[#1f93f2] text-[18px]">{form.name}</span>
      </p>

      <div className="flex justify-center border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mx-4 pb-2 text-[20px] font-medium transition-all border-b-2 ${activeTab === tab.key
              ? "border-[#1f93f2] text-[#1f93f2] font-semibold"
              : "border-transparent text-gray-800 hover:text-blue-500"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="">{renderContent()}</div>
    </div>
  );
};

export default FormInfo;
