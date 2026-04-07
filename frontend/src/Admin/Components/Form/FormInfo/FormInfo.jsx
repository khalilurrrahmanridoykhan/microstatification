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

const TabLoading = ({ message }) => (
  <div className="flex items-center justify-center min-h-[220px] bg-white border rounded-lg border-black/70">
    <div className="flex items-center gap-3 text-gray-700">
      <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
      <span>{message}</span>
    </div>
  </div>
);

const FormInfo = () => {
  const { formId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const defaultTab = tabs.some((tab) => tab.key === tabFromUrl)
    ? tabFromUrl
    : "summary";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formMeta, setFormMeta] = useState(null);
  const [loadingFormMeta, setLoadingFormMeta] = useState(true);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loadingSummaryStats, setLoadingSummaryStats] = useState(true);

  useEffect(() => {
    const nextTab = tabs.some((tab) => tab.key === tabFromUrl)
      ? tabFromUrl
      : "summary";
    setActiveTab(nextTab);
  }, [tabFromUrl]);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let isMounted = true;

    const fetchFormMeta = async () => {
      setLoadingFormMeta(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          params: { include_submissions: "false" },
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        if (isMounted) {
          setFormMeta(response.data);
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        if (isMounted) {
          setFormMeta(null);
        }
      } finally {
        if (isMounted) {
          setLoadingFormMeta(false);
        }
      }
    };

    const fetchSummaryStats = async () => {
      setLoadingSummaryStats(true);
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/summary-stats/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        if (isMounted) {
          setSummaryStats(response.data);
        }
      } catch (error) {
        console.error("Error fetching form summary stats:", error);
        if (isMounted) {
          setSummaryStats(null);
        }
      } finally {
        if (isMounted) {
          setLoadingSummaryStats(false);
        }
      }
    };

    fetchFormMeta();
    fetchSummaryStats();

    return () => {
      isMounted = false;
    };
  }, [formId]);

  useEffect(() => {
    if (tabFromUrl === activeTab) {
      return;
    }
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams, tabFromUrl]);

  const renderContent = () => {
    switch (activeTab) {
      case "summary":
        if (loadingFormMeta && !formMeta) {
          return <TabLoading message="Loading summary..." />;
        }
        return (
          <FormSummary
            formMeta={formMeta}
            summaryStats={summaryStats}
            loadingFormMeta={loadingFormMeta}
            loadingSummaryStats={loadingSummaryStats}
          />
        );
      case "form":
        if (loadingFormMeta && !formMeta) {
          return <TabLoading message="Loading form..." />;
        }
        return <Form formMeta={formMeta} />;
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
      <p className="text-[18px] text-center text-gray-500 mb-6">
        Form name:{" "}
        {loadingFormMeta ? (
          <span className="inline-flex items-center gap-2 text-[16px] text-gray-600">
            <span className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin" />
            Loading...
          </span>
        ) : (
          <span className="text-[#1f93f2] text-[18px]">{formMeta?.name || "-"}</span>
        )}
      </p>

      <div className="flex justify-center border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mx-4 pb-2 text-[20px] font-medium transition-all border-b-2 ${
              activeTab === tab.key
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
