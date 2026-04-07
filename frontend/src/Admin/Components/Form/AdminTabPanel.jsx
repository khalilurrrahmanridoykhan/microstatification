import React, { useState } from "react";
// import FormLists from "./FormLists";
import FormSummary from "./AdminFormSummary";
import FormData from "./AdminFormData";
import SingleFormPanel from "./SingleFormData/AdminSingleFormPanel";

function TabPanel() {
  const [activeTab, setActiveTab] = useState("Summary");

  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4 rounded-lg -mt-4">
      <div className="flex-col md:flex-row ">
        <div className="flex justify-center items-center text-[16px] font-semibold text-gray-700 mb-4">
          <div className="text-[18px] border-b-2 border-gray-300 flex gap-4 md:gap-8 lg:gap-12  flex-col md:flex-row">
            <button
              className={` tab-button  ${
                activeTab === "Summary" ? "active" : ""
              }`}
              onClick={() => switchTab("Summary")}
            >
              Sumamry
            </button>
            <button
              className={`tab-button  ${
                activeTab === "Forms" ? "active" : ""
              }`}
              onClick={() => switchTab("Forms")}
            >
              Form
            </button>
            <button
              className={`tab-button  ${
                activeTab === "Data" ? "active" : ""
              }`}
              onClick={() => switchTab("Data")}
            >
              Data
            </button>
          </div>
        </div>
      </div>

      {activeTab === "Summary" && <FormSummary/>}

      {activeTab === "Forms" && <SingleFormPanel/>}

      {activeTab === "Data" && <FormData/>}
    </div>
  );
}

export default TabPanel;
