import React, { useState, useEffect } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { FcGenericSortingAsc, FcGenericSortingDesc } from "react-icons/fc";
import { LuArrowUpDown } from "react-icons/lu";
import { IoCloseOutline } from "react-icons/io5";
import { FaDownload, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";

// This component expects: groupData (object with dataCollection, lookupForms[])
const GroupDataTable = ({ groupData }) => {
  const [visibleFields, setVisibleFields] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showModal, setShowModal] = useState(false);
  const [downloadingAsIs, setDownloadingAsIs] = useState(false);
  const [downloadingCombined, setDownloadingCombined] = useState(false);

  // Collect all fields from data collection and lookup forms
  useEffect(() => {
    if (!groupData) return;
    // Collect all fields, flatten meta fields, remove _id, _version, meta, submission_type
    const extractFields = (data) => {
      if (!data) return [];
      let fields = Object.keys(data);
      // Remove unwanted fields
      fields = fields.filter(
        (f) =>
          f !== "_id" &&
          f !== "_version" &&
          f !== "meta" &&
          f !== "submission_type"
      );
      // Add meta fields if present
      if (data.meta) {
        if (data.meta.instanceID) fields.push("instanceID");
        if (data.meta.submitted_by) fields.push("submitted_by");
      }
      return fields;
    };
    const dcFields = extractFields(groupData.dataCollection?.data);
    const lookupFields = groupData.lookupForms.flatMap((lf) =>
      extractFields(lf.submission?.data)
    );
    const allFields = Array.from(
      new Set(["formType", ...dcFields, ...lookupFields])
    );
    setVisibleFields(allFields);
  }, [groupData]);

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
  // Prepare rows: one for data collection, rest for lookup forms
  const rows = [];
  if (groupData?.dataCollection) {
    rows.push({
      ...flattenMeta(groupData.dataCollection.data),
      formType: "Data Collection",
    });
  }
  groupData?.lookupForms?.forEach((lf) => {
    if (lf.submission) {
      rows.push({
        ...flattenMeta(lf.submission.data),
        formType: `Lookup: ${lf.form.name}`,
      });
    }
  });

  // Filtering
  const filteredData = rows.filter((row) =>
    visibleFields.every((field) => {
      const term = searchTerms[field]?.toLowerCase() || "";
      return String(row[field] ?? "")
        .toLowerCase()
        .includes(term);
    })
  );

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

  // Download functions
  const downloadAsIs = async () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingAsIs(true);
    try {
      // Flatten each row completely
      const flattenedData = filteredData.map((row, index) => {
        const flatRow = { row_number: index + 1 };

        visibleFields.forEach((field) => {
          let value = row[field];

          // Handle complex objects by flattening them
          if (typeof value === "object" && value !== null) {
            // If it's an object, flatten its properties
            if (Array.isArray(value)) {
              flatRow[field] = value.join("; ");
            } else {
              // Flatten object properties
              Object.keys(value).forEach((subKey) => {
                flatRow[`${field}_${subKey}`] = String(value[subKey] || "");
              });
              // Also keep the original as JSON string
              flatRow[field] = JSON.stringify(value);
            }
          } else {
            flatRow[field] = String(value || "");
          }
        });

        return flatRow;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Row_by_Row");
      const fileName = `group_data_rows_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingAsIs(false);
    }
  };

  const downloadPatientCombined = async () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingCombined(true);
    try {
      // Group data by patient/UUID
      const patientGroups = {};

      filteredData.forEach((row) => {
        // Try to identify the patient UUID from different possible fields
        const patientId =
          row.instanceID || row.uuid || row.patient_id || row.id || "unknown";

        if (!patientGroups[patientId]) {
          patientGroups[patientId] = {
            patient_id: patientId,
            data_collection: {},
            lookup_forms: {},
          };
        }

        if (row.formType === "Data Collection") {
          // Add all data collection fields
          visibleFields.forEach((field) => {
            if (field !== "formType") {
              patientGroups[patientId].data_collection[`dc_${field}`] =
                row[field];
            }
          });
        } else if (row.formType && row.formType.startsWith("Lookup:")) {
          // Add lookup form data with prefix
          const formName = row.formType
            .replace("Lookup: ", "")
            .replace(/\s+/g, "_");
          visibleFields.forEach((field) => {
            if (field !== "formType") {
              patientGroups[patientId].lookup_forms[`${formName}_${field}`] =
                row[field];
            }
          });
        }
      });

      // Convert to flat array
      const combinedData = Object.values(patientGroups).map((patient) => ({
        ...patient.data_collection,
        ...patient.lookup_forms,
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(combinedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Combined Data");
      const fileName = `group_data_combined_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingCombined(false);
    }
  };

  return (
    <div className="p-4 bg-white border rounded-lg border-black/70">
      <div className="flex items-center justify-between p-2 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-1 px-3 py-2 text-blue-900 border border-blue-300 rounded hover:bg-blue-50"
          >
            Hide Fields
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredData.length}</span> records
            displayed
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Download Excel:</span>
          <button
            onClick={downloadAsIs}
            disabled={downloadingAsIs || filteredData.length === 0}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors ${
              downloadingAsIs || filteredData.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title="Download data with each submission as a separate row"
          >
            {downloadingAsIs ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FaFileExcel />
            )}
            <span className="text-sm">
              {downloadingAsIs ? "Downloading..." : "Row by Row"}
            </span>
          </button>
          <button
            onClick={downloadPatientCombined}
            disabled={downloadingCombined || filteredData.length === 0}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded transition-colors ${
              downloadingCombined || filteredData.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title="Download with each patient as a single row"
          >
            {downloadingCombined ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <FaFileExcel />
            )}
            <span className="text-sm">
              {downloadingCombined ? "Downloading..." : "Combined"}
            </span>
          </button>
        </div>
      </div>
      <div className="overflow-x-scroll">
        <table className="bg-white border border-collapse border-gray-300 ">
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
                        placeholder="Search..."
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
                      {rows.length === 0
                        ? "No submissions available for this group"
                        : "Try adjusting your search filters"}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={i}>
                  {visibleFields.map((field, j) => (
                    <td key={j} className="border p-2 text-[14px]">
                      {typeof row[field] === "object" && row[field] !== null
                        ? JSON.stringify(row[field])
                        : row[field] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
    </div>
  );
};

export default GroupDataTable;
