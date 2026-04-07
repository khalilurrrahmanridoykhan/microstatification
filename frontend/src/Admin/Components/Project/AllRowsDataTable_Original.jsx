import React, { useState, useEffect } from "react";
import axios from "axios";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { BACKEND_URL } from "../../../config";
import { FcGenericSortingAsc, FcGenericSortingDesc } from "react-icons/fc";
import { LuArrowUpDown } from "react-icons/lu";
import { FaFileExcel, FaSearch, FaTimes } from "react-icons/fa";
import * as XLSX from "xlsx";

const AllRowsDataTable = ({ projectId }) => {
  const [allRowsData, setAllRowsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleFields, setVisibleFields] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showModal, setShowModal] = useState(false);
  const [downloadingRows, setDownloadingRows] = useState(false);

  // New state for group details modal
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  const [groupDetailsSearch, setGroupDetailsSearch] = useState("");
  const [groupDetailsSearchTerms, setGroupDetailsSearchTerms] = useState({});
  const [groupDetailsSortConfig, setGroupDetailsSortConfig] = useState({
    key: null,
    direction: null,
  });
  const [groupDetailsFields, setGroupDetailsFields] = useState([]);
  const [rawGroupData, setRawGroupData] = useState(null);

  // Helper to flatten meta fields into top-level keys
  const flattenMeta = (data) => {
    if (!data || typeof data !== "object") return {};
    const { meta, _id, _version, submission_type, ...rest } = data;
    let flat = { ...rest };
    if (meta && typeof meta === "object") {
      if (meta.instanceID) flat.instanceID = meta.instanceID;
      if (meta.submitted_by) flat.submitted_by = meta.submitted_by;
    }
    return flat;
  };

  useEffect(() => {
    const fetchAllRowsData = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(
          `${BACKEND_URL}/api/get-project-templates/${projectId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        const data = res.data;
        console.log("Raw API response data:", data);

        if (!Array.isArray(data) || data.length === 0) {
          console.log("No data array or empty array");
          setAllRowsData([]);
          setLoading(false);
          return;
        }

        // Process all groups and create rows
        const allRows = [];

        // Assume one template per project for now
        const template = data[0];
        console.log("Template data:", template);

        if (!template) {
          console.warn("No template found");
          setAllRowsData([]);
          setLoading(false);
          return;
        }

        if (!template.data_collection_form) {
          console.warn("No data collection form found in template");
          setAllRowsData([]);
          setLoading(false);
          return;
        }

        const dcForm = template?.data_collection_form;
        const dcFormName = dcForm?.name || "Unknown Form";
        const dcSubmissions = dcForm?.submission || [];
        const lookupForms = template?.generated_lookup_forms || [];

        console.log("DC Form:", dcForm);
        console.log("DC Submissions count:", dcSubmissions.length);
        console.log("Lookup Forms count:", lookupForms.length);

        // Group by submission UUID first
        const groupMap = {};

        if (dcSubmissions && dcSubmissions.length > 0) {
          dcSubmissions.forEach((sub) => {
            if (!sub || !sub.data) {
              console.log("Skipping submission with no data:", sub);
              return;
            }

            const uuid = sub.data?.meta?.instanceID || sub.data?.instanceID;
            if (!uuid) {
              console.log("Skipping submission with no UUID:", sub.data);
              return;
            }

            // Extract patient_name from the submission data
            const patientName =
              sub.data?.patient_name ||
              sub.data?.name ||
              sub.data?.patient ||
              sub.data?.administrative
                ?.name_of_the_person_with_suspected_case ||
              sub.data?.hh_head_name ||
              "Unknown Patient";

            groupMap[uuid] = {
              groupName: `${dcFormName} - ${patientName}`,
              dataCollection: sub,
              lookupForms: [],
            };
          });
        } else {
          console.log("No dcSubmissions found");
        }

        // Add lookup forms to groups
        lookupForms.forEach((lf) => {
          if (!lf || !lf.submission) return;

          (lf.submission || []).forEach((lfSub) => {
            const uuid = lfSub?.data?.data_collection_form_uuid;
            if (uuid && groupMap[uuid]) {
              groupMap[uuid].lookupForms.push({
                form: lf,
                submission: lfSub,
              });
            }
          });
        });

        // Create joined rows data
        Object.values(groupMap).forEach((group) => {
          if (group?.dataCollection?.data) {
            // Start with data collection form data
            const baseRow = {
              group_name: group.groupName || "Unknown Group",
              formType: "Data Collection",
              row_number: allRows.length + 1,
              ...flattenMeta(group.dataCollection.data),
            };

            // Join lookup form data into the same row
            group.lookupForms.forEach((lookupForm, index) => {
              if (lookupForm.submission && lookupForm.form?.name) {
                const lookupData = flattenMeta(lookupForm.submission.data);
                const formName = lookupForm.form.name.replace(/\s+/g, "_");

                // Prefix lookup form fields to avoid conflicts
                Object.keys(lookupData).forEach((key) => {
                  // Skip meta fields that are already in base row
                  if (
                    key !== "instanceID" &&
                    key !== "submitted_by" &&
                    key !== "data_collection_form_uuid"
                  ) {
                    baseRow[`${formName}_${key}`] = lookupData[key];
                  }
                });

                // Add form type information
                if (index === 0) {
                  baseRow.formType = `Data Collection + ${group.lookupForms.length} Lookup Form(s)`;
                }
              }
            });

            allRows.push(baseRow);
          }
        });

        // If we have a template but no rows, still show template info
        if (allRows.length === 0 && template) {
          console.log("No submission data found, creating placeholder row");
          allRows.push({
            row_number: 1,
            group_name: "No Submissions",
            formType: "Template Available",
            form_name: dcFormName,
            status: "No submissions found for this project",
          });
        }

        setAllRowsData(allRows);
        setRawGroupData(groupMap); // Store raw group data for detailed view

        console.log("Final allRows:", allRows);
        console.log("GroupMap:", groupMap);

        // Extract all unique fields
        const allFields = new Set(["row_number", "group_name", "formType"]);
        allRows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (
              key !== "row_number" &&
              key !== "group_name" &&
              key !== "formType"
            ) {
              allFields.add(key);
            }
          });
        });
        setVisibleFields(Array.from(allFields));
      } catch (err) {
        console.error("Error fetching all rows data:", err);

        // More specific error handling
        if (err.response?.status === 404) {
          setError("Project not found");
        } else if (err.response?.status === 403) {
          setError("Access denied");
        } else if (err.response?.status === 500) {
          setError("Server error");
        } else if (err.message?.includes("Cannot read properties of null")) {
          setError("Data structure error - some required fields are missing");
        } else {
          setError("Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchAllRowsData();
    }
  }, [projectId]);

  // Apply filters
  const filteredData = allRowsData.filter((row) => {
    // Global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchesGlobal = visibleFields.some((field) =>
        String(row[field] || "")
          .toLowerCase()
          .includes(searchLower)
      );
      if (!matchesGlobal) return false;
    }

    // Column-specific search
    return visibleFields.every((field) => {
      const term = searchTerms[field]?.toLowerCase() || "";
      if (!term) return true;
      return String(row[field] || "")
        .toLowerCase()
        .includes(term);
    });
  });

  // Handle group name click to show detailed view
  const handleGroupClick = (groupName) => {
    if (!rawGroupData) return;

    // Find the group data
    const group = Object.values(rawGroupData).find(
      (g) => g.groupName === groupName
    );
    if (!group) return;

    // Create detailed rows - data collection first, then lookup forms
    const detailedRows = [];

    // Add data collection row
    if (group.dataCollection) {
      detailedRows.push({
        row_number: 1,
        formType: "Data Collection Form",
        form_name: group.dataCollection.data?._version || "Data Collection",
        ...flattenMeta(group.dataCollection.data),
      });
    }

    // Add lookup form rows
    group.lookupForms.forEach((lookupForm, index) => {
      if (lookupForm.submission && lookupForm.form?.name) {
        detailedRows.push({
          row_number: detailedRows.length + 1,
          formType: "Lookup Form",
          form_name: lookupForm.form.name,
          ...flattenMeta(lookupForm.submission.data),
        });
      }
    });

    // Get all unique fields for the detailed view
    const detailFields = new Set(["row_number", "formType", "form_name"]);
    detailedRows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "row_number" && key !== "formType" && key !== "form_name") {
          detailFields.add(key);
        }
      });
    });

    setSelectedGroupData(detailedRows);
    setGroupDetailsFields(Array.from(detailFields));
    setShowGroupDetails(true);
    setGroupDetailsSearch("");
    setGroupDetailsSearchTerms({});
    setGroupDetailsSortConfig({ key: null, direction: null });
  };

  // Sorting
  if (sortConfig.key && sortConfig.direction) {
    filteredData.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      return (
        String(valA).localeCompare(String(valB), undefined, { numeric: true }) *
        (sortConfig.direction === "asc" ? 1 : -1)
      );
    });
  }

  // Download function
  const downloadAllRows = async () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingRows(true);
    try {
      const cleanedData = filteredData.map((row) => {
        const cleanRow = {};
        visibleFields.forEach((field) => {
          cleanRow[field] =
            typeof row[field] === "object" && row[field] !== null
              ? JSON.stringify(row[field])
              : String(row[field] || "");
        });
        return cleanRow;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "All_Submissions_Rows");
      const fileName = `all_submissions_filtered_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`Successfully downloaded ${cleanedData.length} records!`);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingRows(false);
    }
  };

  // Group details filtering and sorting
  const filteredGroupDetails = selectedGroupData
    ? selectedGroupData.filter((row) => {
        // Global search for group details
        if (groupDetailsSearch) {
          const searchLower = groupDetailsSearch.toLowerCase();
          const matchesGlobal = groupDetailsFields.some((field) =>
            String(row[field] || "")
              .toLowerCase()
              .includes(searchLower)
          );
          if (!matchesGlobal) return false;
        }

        // Column-specific search for group details
        return groupDetailsFields.every((field) => {
          const term = groupDetailsSearchTerms[field]?.toLowerCase() || "";
          if (!term) return true;
          return String(row[field] || "")
            .toLowerCase()
            .includes(term);
        });
      })
    : [];

  // Sorting for group details
  if (
    groupDetailsSortConfig.key &&
    groupDetailsSortConfig.direction &&
    filteredGroupDetails.length > 0
  ) {
    filteredGroupDetails.sort((a, b) => {
      const valA = a[groupDetailsSortConfig.key];
      const valB = b[groupDetailsSortConfig.key];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      return (
        String(valA).localeCompare(String(valB), undefined, { numeric: true }) *
        (groupDetailsSortConfig.direction === "asc" ? 1 : -1)
      );
    });
  }

  // Download function for group details
  const downloadGroupDetails = async () => {
    if (filteredGroupDetails.length === 0) {
      alert("No data to download");
      return;
    }

    try {
      const cleanedData = filteredGroupDetails.map((row) => {
        const cleanRow = {};
        groupDetailsFields.forEach((field) => {
          cleanRow[field] =
            typeof row[field] === "object" && row[field] !== null
              ? JSON.stringify(row[field])
              : String(row[field] || "");
        });
        return cleanRow;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Group_Details");
      const fileName = `group_details_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(`Successfully downloaded ${cleanedData.length} records!`);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                Loading all submissions...
              </div>
              <div className="text-sm text-gray-500">
                Please wait while we fetch all data
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 border border-red-200 rounded-lg bg-red-50">
        <div className="mb-2 text-2xl">⚠️</div>
        <div className="text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border rounded-lg border-black/70">
      {/* Header with search and controls */}
      <div className="flex items-center justify-between p-2 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-1 px-3 py-2 text-blue-900 border border-blue-300 rounded hover:bg-blue-50"
          >
            Hide Fields
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredData.length}</span> of{" "}
            <span className="font-medium">{allRowsData.length}</span> records
            displayed
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadAllRows}
            disabled={downloadingRows || filteredData.length === 0}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors ${
              downloadingRows || filteredData.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title="Download filtered data as Excel"
          >
            {downloadingRows ? (
              <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <FaFileExcel />
            )}
            <span className="text-sm">
              {downloadingRows ? "Downloading..." : "Download Filtered"}
            </span>
          </button>
        </div>
      </div>

      {/* Global Search */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Search across all fields..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch("")}
              className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-scroll">
        <table className="bg-white border border-collapse border-gray-300">
          <thead>
            <tr>
              {visibleFields.map((field, idx) => (
                <th
                  key={idx}
                  className="p-2 bg-gray-100 border text-md"
                  style={{ width: columnWidths[field] || 200 }}
                >
                  <ResizableBox
                    width={columnWidths[field] || 200}
                    height={60}
                    axis="x"
                    resizeHandles={["e"]}
                    onResizeStop={(e, data) =>
                      setColumnWidths((prev) => ({
                        ...prev,
                        [field]: data.size.width,
                      }))
                    }
                    handle={
                      <span className="absolute top-0 right-0 z-10 w-8 h-full bg-transparent cursor-col-resize" />
                    }
                    className="relative"
                  >
                    <div className="flex flex-col px-2">
                      <div className="flex items-center justify-between">
                        <span className="whitespace-nowrap text-[14px] font-bold truncate">
                          {field}
                        </span>
                        <button
                          onClick={() =>
                            setSortConfig((prev) =>
                              prev.key === field
                                ? {
                                    key: field,
                                    direction:
                                      prev.direction === "asc" ? "desc" : "asc",
                                  }
                                : { key: field, direction: "asc" }
                            )
                          }
                          className="ml-1 text-xs"
                        >
                          {sortConfig.key === field ? (
                            sortConfig.direction === "asc" ? (
                              <FcGenericSortingAsc className="w-4 h-4" />
                            ) : (
                              <FcGenericSortingDesc className="w-4 h-4" />
                            )
                          ) : (
                            <LuArrowUpDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <input
                        className="mt-1 text-xs border rounded px-1 py-0.5"
                        type="text"
                        placeholder="Filter..."
                        value={searchTerms[field] || ""}
                        onChange={(e) =>
                          setSearchTerms((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </ResizableBox>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleFields.length}
                  className="p-8 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-4xl">📊</div>
                    <div className="text-lg font-medium">No data found</div>
                    <div className="text-sm">
                      {allRowsData.length === 0
                        ? "No submissions available for this project"
                        : "Try adjusting your search filters"}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  {visibleFields.map((field, j) => (
                    <td key={j} className="border p-2 text-[14px]">
                      {field === "group_name" ? (
                        <button
                          onClick={() => handleGroupClick(row[field])}
                          className="text-blue-600 underline cursor-pointer hover:text-blue-800"
                          title="Click to view detailed breakdown"
                        >
                          {String(row[field] || "")}
                        </button>
                      ) : typeof row[field] === "object" &&
                        row[field] !== null ? (
                        JSON.stringify(row[field])
                      ) : (
                        String(row[field] || "")
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Field Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Visible Fields</h2>
              <button
                onClick={() => setShowModal(false)}
                className="font-bold text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">X</span>
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {visibleFields.map((field) => (
                <label
                  key={field}
                  className="flex items-center p-2 space-x-2 border rounded-lg border-black/60"
                >
                  <input
                    type="checkbox"
                    checked={visibleFields.includes(field)}
                    onChange={() => {
                      setVisibleFields((prev) =>
                        prev.includes(field)
                          ? prev.filter((f) => f !== field)
                          : [...prev, field]
                      );
                    }}
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showGroupDetails && selectedGroupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full p-6 overflow-hidden bg-white rounded-lg shadow-lg max-w-7xl h-5/6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Group Details Breakdown</h2>
              <button
                onClick={() => setShowGroupDetails(false)}
                className="font-bold text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">X</span>
              </button>
            </div>

            {/* Group Details Controls */}
            <div className="flex items-center justify-between p-2 mb-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">
                  {filteredGroupDetails.length}
                </span>{" "}
                of{" "}
                <span className="font-medium">{selectedGroupData.length}</span>{" "}
                records displayed
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadGroupDetails}
                  className="flex items-center gap-2 px-3 py-2 text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                  title="Download group details as Excel"
                >
                  <FaFileExcel />
                  <span className="text-sm">Download Details</span>
                </button>
              </div>
            </div>

            {/* Group Details Global Search */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Search across all fields..."
                  value={groupDetailsSearch}
                  onChange={(e) => setGroupDetailsSearch(e.target.value)}
                  className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {groupDetailsSearch && (
                  <button
                    onClick={() => setGroupDetailsSearch("")}
                    className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Group Details Table */}
            <div className="flex-1 overflow-auto border border-black/70">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    {groupDetailsFields.map((field) => (
                      <th
                        key={field}
                        className="p-2 bg-gray-200 border border-black/40"
                      >
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-[14px]">
                              {field}
                            </span>
                            <button
                              onClick={() => {
                                const newDirection =
                                  groupDetailsSortConfig.key === field &&
                                  groupDetailsSortConfig.direction === "asc"
                                    ? "desc"
                                    : "asc";
                                setGroupDetailsSortConfig({
                                  key: field,
                                  direction: newDirection,
                                });
                              }}
                              className="p-1 rounded hover:bg-gray-300"
                            >
                              {groupDetailsSortConfig.key === field ? (
                                groupDetailsSortConfig.direction === "asc" ? (
                                  <FcGenericSortingAsc size={16} />
                                ) : (
                                  <FcGenericSortingDesc size={16} />
                                )
                              ) : (
                                <LuArrowUpDown
                                  size={16}
                                  className="text-gray-400"
                                />
                              )}
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder={`Search ${field}...`}
                            value={groupDetailsSearchTerms[field] || ""}
                            onChange={(e) =>
                              setGroupDetailsSearchTerms((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredGroupDetails.length === 0 ? (
                    <tr>
                      <td
                        colSpan={groupDetailsFields.length}
                        className="p-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-4xl">📋</div>
                          <div className="text-lg font-medium">
                            No details found
                          </div>
                          <div className="text-sm">
                            Try adjusting your search filters
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredGroupDetails.map((row, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        {groupDetailsFields.map((field, j) => (
                          <td key={j} className="border p-2 text-[14px]">
                            {field === "formType" ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  row[field] === "Data Collection Form"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {String(row[field] || "")}
                              </span>
                            ) : typeof row[field] === "object" &&
                              row[field] !== null ? (
                              JSON.stringify(row[field])
                            ) : (
                              String(row[field] || "")
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRowsDataTable;
