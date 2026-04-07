import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import GroupDataTable from "./GroupDataTable";
import { FaDownload, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { BACKEND_URL } from "../../../config";

const ProjectTemplateGroups = () => {
  const { projectId } = useParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  const [activePopupIndex, setActivePopupIndex] = useState(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingAllRows, setDownloadingAllRows] = useState(false);

  // Helper to flatten meta fields into top-level keys
  const flattenMeta = (data) => {
    if (!data) return {};
    const { meta, _id, _version, submission_type, ...rest } = data;
    let flat = { ...rest };
    if (meta) {
      if (meta.instanceID) flat.instanceID = meta.instanceID;
      if (meta.submitted_by) flat.submitted_by = meta.submitted_by;
    }
    return flat;
  };

  // Download all groups combined
  const downloadAllGroupsCombined = async () => {
    if (groups.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingAll(true);
    try {
      const allPatientData = [];

      groups.forEach((group) => {
        // Get the patient UUID
        const patientId =
          group.dataCollection?.data?.meta?.instanceID || "unknown";

        // Start with data collection data
        const patientRow = {
          patient_uuid: patientId,
          group_name: group.groupName,
          ...flattenMeta(group.dataCollection?.data || {}),
        };

        // Add all lookup form data to the same row with prefixes
        group.lookupForms.forEach((lookupForm) => {
          const formName = lookupForm.form.name.replace(/\s+/g, "_");
          const lookupData = flattenMeta(lookupForm.submission?.data || {});

          // Add each lookup field with form name prefix
          Object.keys(lookupData).forEach((key) => {
            patientRow[`${formName}_${key}`] = lookupData[key];
          });
        });

        // Flatten any remaining complex objects
        Object.keys(patientRow).forEach((key) => {
          if (typeof patientRow[key] === "object" && patientRow[key] !== null) {
            patientRow[key] = JSON.stringify(patientRow[key]);
          }
        });

        allPatientData.push(patientRow);
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(allPatientData);

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "All_Patients_Combined"
      );
      const fileName = `all_followup_groups_combined_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(
        `Successfully downloaded ${allPatientData.length} patient records!`
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  };

  // Download all data as separate rows (like the individual group table)
  const downloadAllGroupsAsRows = async () => {
    if (groups.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingAllRows(true);
    try {
      const allRowsData = [];

      groups.forEach((group) => {
        // Add data collection row
        if (group.dataCollection) {
          allRowsData.push({
            group_name: group.groupName,
            formType: "Data Collection",
            ...flattenMeta(group.dataCollection.data),
          });
        }

        // Add lookup form rows
        group.lookupForms.forEach((lookupForm) => {
          if (lookupForm.submission) {
            allRowsData.push({
              group_name: group.groupName,
              formType: `Lookup: ${lookupForm.form.name}`,
              ...flattenMeta(lookupForm.submission.data),
            });
          }
        });
      });

      // Flatten any complex objects
      const cleanedData = allRowsData.map((row, index) => {
        const cleanRow = { row_number: index + 1 };
        Object.keys(row).forEach((key) => {
          if (typeof row[key] === "object" && row[key] !== null) {
            cleanRow[key] = JSON.stringify(row[key]);
          } else {
            cleanRow[key] = String(row[key] || "");
          }
        });
        return cleanRow;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "All_Submissions_Rows");
      const fileName = `all_followup_submissions_rows_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(
        `Successfully downloaded ${cleanedData.length} submission records!`
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingAllRows(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const fetchTemplateData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/get-project-templates/${projectId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        const data = res.data;
        if (!Array.isArray(data) || data.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }
        // Assume one template per project for now
        const template = data[0];
        const dcForm = template.data_collection_form;
        const dcFormName = dcForm.name;
        const dcSubmissions = dcForm.submission || [];
        const lookupForms = template.generated_lookup_forms || [];

        // Group by submission UUID
        const groupMap = {};
        dcSubmissions.forEach((sub) => {
          const uuid = sub.data?.meta?.instanceID;
          if (!uuid) return;
          groupMap[uuid] = {
            groupName: `${dcFormName} ${uuid}`,
            dataCollection: sub,
            lookupForms: [],
          };
        });
        // For each lookup form, check its submissions for matching uuid
        lookupForms.forEach((lf) => {
          (lf.submission || []).forEach((lfSub) => {
            const uuid = lfSub.data?.data_collection_form_uuid;
            if (uuid && groupMap[uuid]) {
              groupMap[uuid].lookupForms.push({
                form: lf,
                submission: lfSub,
              });
            }
          });
        });
        setGroups(Object.values(groupMap));
      } catch (err) {
        console.error("Error fetching template data:", err);
        setError("Failed to load template data");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplateData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                Loading template data...
              </div>
              <div className="text-sm text-gray-500">
                Please wait while we fetch your project groups
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  if (selectedGroup) {
    return (
      <div className="p-4">
        <button
          className="mb-4 text-blue-600 underline"
          onClick={() => setSelectedGroup(null)}
        >
          ← Back to Groups
        </button>
        <h2 className="mb-2 text-xl font-bold">{selectedGroup.groupName}</h2>
        <GroupDataTable groupData={selectedGroup} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Follow Up Form Groups</h2>
        {groups.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 mr-2">Download Excel:</span>
            <button
              onClick={downloadAllGroupsAsRows}
              disabled={downloadingAllRows}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors ${
                downloadingAllRows
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              title="Download all data with each submission as a separate row"
            >
              {downloadingAllRows ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaFileExcel />
              )}
              <span className="text-sm">
                {downloadingAllRows ? "Downloading..." : "All Rows"}
              </span>
            </button>
            <button
              onClick={downloadAllGroupsCombined}
              disabled={downloadingAll}
              className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors ${
                downloadingAll
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              title="Download all patient data combined in one Excel file (one row per patient)"
            >
              {downloadingAll ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaFileExcel />
              )}
              <span className="text-sm">
                {downloadingAll ? "Downloading..." : "Combined"}
              </span>
            </button>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-gray-500 text-lg">
            No groups found for this project.
          </div>
          <div className="text-gray-400 text-sm mt-1">
            Submit some forms to see groups here.
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups.map((group, idx) => (
            <li key={idx} style={{ position: "relative" }}>
              <button
                className="w-full p-3 font-medium text-left border rounded bg-blue-50 hover:bg-blue-100"
                onClick={() => setSelectedGroup(group)}
                onMouseEnter={() => {
                  setHoveredGroup(idx);
                  setActivePopupIndex(idx);
                  setIsPopupHovered(false);
                }}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {group.groupName}
              </button>
              {/* Small popup on hover */}
              {(hoveredGroup === idx || isPopupHovered) &&
                activePopupIndex === idx && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "110%",
                      zIndex: 50,
                      minWidth: 400,
                      maxWidth: 700,
                      background: "white",
                      border: "1px solid #93c5fd",
                      borderRadius: 8,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      padding: 12,
                      fontSize: 12,
                      overflowX: "auto",
                    }}
                    onMouseEnter={() => setIsPopupHovered(true)}
                    onMouseLeave={() => {
                      setIsPopupHovered(false);
                      setActivePopupIndex(null);
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#2563eb",
                        marginBottom: 4,
                      }}
                    >
                      {group.groupName} (Preview)
                    </div>
                    {group.dataCollection?.data ? (
                      <table style={{ width: "100%", fontSize: 12 }}>
                        <tbody>
                          {Object.entries(group.dataCollection.data)
                            .filter(
                              ([k]) =>
                                k !== "meta" &&
                                k !== "_id" &&
                                k !== "_version" &&
                                k !== "submission_type"
                            )
                            .map(([q, ans], i) => (
                              <tr key={i}>
                                <td
                                  style={{
                                    paddingRight: 8,
                                    fontWeight: 500,
                                    color: "#334155",
                                    verticalAlign: "top",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {q}:
                                </td>
                                <td
                                  style={{
                                    color: "#111827",
                                    wordBreak: "break-all",
                                  }}
                                >
                                  {typeof ans === "object"
                                    ? JSON.stringify(ans)
                                    : String(ans)}
                                </td>
                              </tr>
                            ))}
                          {/* Meta fields */}
                          {group.dataCollection.data?.meta?.instanceID && (
                            <tr>
                              <td
                                style={{
                                  paddingRight: 8,
                                  fontWeight: 500,
                                  color: "#334155",
                                  verticalAlign: "top",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                uuid:
                              </td>
                              <td
                                style={{
                                  color: "#111827",
                                  wordBreak: "break-all",
                                }}
                              >
                                {group.dataCollection.data.meta.instanceID}
                              </td>
                            </tr>
                          )}
                          {group.dataCollection.data?.meta?.submitted_by && (
                            <tr>
                              <td
                                style={{
                                  paddingRight: 8,
                                  fontWeight: 500,
                                  color: "#334155",
                                  verticalAlign: "top",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                submitted_by:
                              </td>
                              <td
                                style={{
                                  color: "#111827",
                                  wordBreak: "break-all",
                                }}
                              >
                                {group.dataCollection.data.meta.submitted_by}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ color: "#64748b" }}>No data</div>
                    )}
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}

      {groups.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-md font-semibold text-blue-800 mb-2">
            📊 Download Options
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              • <strong>All Rows:</strong> Each form submission as a separate
              row (good for detailed analysis)
            </p>
            <p>
              • <strong>Combined:</strong> Each patient as one row with all
              their data combined (good for patient overview)
            </p>
            <p>
              • <strong>Individual Groups:</strong> Click any group above to
              view and download specific patient data
            </p>
          </div>
        </div>
      )}
    </div>
  );
  // Add hoveredGroup state
};

export default ProjectTemplateGroups;
