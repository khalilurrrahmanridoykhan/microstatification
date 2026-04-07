import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { useNavigate } from "react-router-dom";
import { FaTable } from "react-icons/fa";

const UserTemplateTable = ({ setParentLoading }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    if (setParentLoading) setParentLoading(true);
    const token = sessionStorage.getItem("authToken");

    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("UserTemplates")) {
        dataTable = new window.DataTable("#UserTemplates");
      }
    };

    const fetchUserTemplates = async () => {
      try {
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
        const userTemplateIds = userInfo?.profile?.templates || [];

        if (userTemplateIds.length === 0) {
          setTemplates([]);
          setLoading(false);
          if (setParentLoading) setParentLoading(false);
          return;
        }

        // Fetch template details for each assigned template
        const templatePromises = userTemplateIds.map(async (templateId) => {
          try {
            const templateRes = await axios.get(
              `${BACKEND_URL}/api/get-template/${templateId}/`,
              { headers: { Authorization: `Token ${token}` } }
            );
            return templateRes.data;
          } catch (err) {
            console.log(`Error fetching template ${templateId}:`, err);
            return null;
          }
        });

        const templateResults = await Promise.all(templatePromises);
        const validTemplates = templateResults.filter(
          (template) => template !== null
        );

        setTemplates(validTemplates);
        setTimeout(() => {
          initializeDataTable();
        }, 1000);
      } catch (err) {
        console.error("Error fetching user templates:", err);
        setTemplates([]);
        setTimeout(() => {
          initializeDataTable();
        }, 0);
      } finally {
        setLoading(false);
        if (setParentLoading) setParentLoading(false);
      }
    };

    fetchUserTemplates();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No templates assigned to your account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table id="UserTemplates" className="min-w-full bg-white border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left border">Template Name</th>
                  <th className="px-4 py-2 text-left border">Created Date</th>
                  <th className="px-4 py-2 text-left border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template, index) => (
                  <tr key={template.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">
                      {template.name || "Unnamed Template"}
                    </td>
                    <td className="px-4 py-2 border">
                      {template.created_at
                        ? new Date(template.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="action-buttons">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            // Navigate to template data view - for now navigate to forms that belong to this template
                            // We can later create a dedicated template data view
                            navigate(`/template/${template.id}/data`);
                          }}
                          title="View Template Data"
                          className="p-1 text-green-600 transition-colors rounded hover:text-green-800 hover:bg-green-50"
                        >
                          <FaTable size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTemplateTable;
