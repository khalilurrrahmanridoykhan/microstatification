import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { GrMapLocation } from "react-icons/gr";
import { RiSpeakLine } from "react-icons/ri";

const FormDetails = ({
  formId,
  projectId,
  formMeta = null,
  summaryStats = null,
  loadingFormMeta = false,
}) => {
  const [form, setForm] = useState(formMeta);
  const [loadingForm, setLoadingForm] = useState(!formMeta);
  const [projectData, setProjectData] = useState(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const userRole = userInfo?.role;
  const isRole4 = userRole === 4;
  const hasProjectAccess = userRole === 1;

  useEffect(() => {
    if (formMeta) {
      setForm(formMeta);
      setLoadingForm(false);
      return;
    }

    if (!formId) {
      setForm(null);
      setLoadingForm(false);
      return;
    }

    let isMounted = true;
    const fetchForm = async () => {
      setLoadingForm(true);
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          params: { include_submissions: "false" },
          headers: { Authorization: `Token ${token}` },
        });
        if (isMounted) {
          setForm(response.data);
        }
      } catch (error) {
        console.error("Error fetching form:", error);
        if (isMounted) {
          setForm(null);
        }
      } finally {
        if (isMounted) {
          setLoadingForm(false);
        }
      }
    };

    fetchForm();
    return () => {
      isMounted = false;
    };
  }, [formId, formMeta]);

  useEffect(() => {
    if (!hasProjectAccess || !projectId) {
      setProjectData(null);
      setLoadingProject(false);
      return;
    }

    let isMounted = true;
    const fetchProject = async () => {
      setLoadingProject(true);
      try {
        const token = sessionStorage.getItem("authToken");
        const projectResponse = await axios.get(
          `${BACKEND_URL}/api/projects/${projectId}/`,
          {
            headers: { Authorization: `Token ${token}` },
            params: { include_forms: "false" },
          }
        );
        if (isMounted) {
          setProjectData(projectResponse.data);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        if (isMounted) {
          setProjectData(null);
        }
      } finally {
        if (isMounted) {
          setLoadingProject(false);
        }
      }
    };

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [projectId, hasProjectAccess]);

  const showLoading = loadingFormMeta || loadingForm;
  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[180px] bg-white border rounded-lg border-black/70">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
          <span>Loading summary details...</span>
        </div>
      </div>
    );
  }

  if (!form) return <p className="text-center text-red-500">Form not found.</p>;

  const hasSummaryTotal =
    summaryStats &&
    Number.isFinite(Number(summaryStats.total_submissions));
  const totalSubmissions = hasSummaryTotal
    ? Number(summaryStats.total_submissions)
    : Number(form?.submission?.length || 0);

  return (
    <div className="w-full p-4 bg-white border lg:p-8 rounded-2xl border-black/70 max-w-none">
      {!isRole4 && (
        <div className="mb-2 border-b">
          <p className="font-medium tracking-wide text-gray-500  text-md">Description</p>
          <p className="text-base leading-relaxed text-gray-600  line-clamp-2">
            {loadingProject
              ? "Loading project details..."
              : projectData?.description || "No description provided"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 pb-2 border-b border-gray-200 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 border-r">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Status
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-2 font-medium border border-blue-200 rounded-lg text-color-custom bg-blue-50 text-md">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11h2a1 1 0 100-2h-2V5a1 1 0 00-2 0v2H7a1 1 0 000 2h2v2a1 1 0 102 0V7z" />
              </svg>
              Deployed
            </span>
          </div>
        </div>

        <div className="space-y-2 border-r">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Questions
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {form?.questions?.length || 0}
          </p>
        </div>

        {isRole4 ? (
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <p className="font-medium tracking-wide text-gray-500  text-md">
              Total Submissions
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-2 font-medium text-indigo-700 border border-indigo-200 rounded-lg bg-indigo-50 text-md">
                {totalSubmissions}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <p className="font-medium tracking-wide text-gray-500  text-md">
              Project Owner
            </p>
            <p className="inline-block border border-indigo-200 px-3 py-2 text-base rounded-lg text-[#1f93f2]  bg-blue-50 ">
              {loadingProject
                ? "Loading..."
                : `@${projectData?.created_by || "UnKnownAdmin"}`}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 border-b border-gray-200 lg:grid-cols-2">
        <div className="mt-2 space-y-3 border-r">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Created At
          </p>
          <div className="p-2 rounded-lg ">
            <p className="text-base font-medium text-gray-800">
              {form?.created_at
                ? new Date(form.created_at).toLocaleString("en-GB", {
                    timeZone: "Asia/Dhaka",
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Not available"}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-3">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Last Updated
          </p>
          <div className="p-2 rounded-lg ">
            <p className="text-base font-medium text-gray-800">
              {form?.updated_at
                ? new Date(form.updated_at).toLocaleString("en-GB", {
                    timeZone: "Asia/Dhaka",
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Not available"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-2 sm:grid-cols-2">
        <div className="space-y-3 border-r">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Language
          </p>
          <div className="flex items-center gap-2">
            <RiSpeakLine className="w-6 h-6" />
            <p className="m-0 text-base font-medium text-gray-800">
              {form?.default_language || "English"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-medium tracking-wide text-gray-500  text-md">
            Location
          </p>
          <div className="flex items-center gap-2">
            <GrMapLocation className="w-6 h-6" />
            <p className="m-0 text-base font-medium text-gray-800">
              {hasProjectAccess
                ? loadingProject
                  ? "Loading..."
                  : projectData?.location || "Not specified"
                : "Anywhere"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormDetails;
