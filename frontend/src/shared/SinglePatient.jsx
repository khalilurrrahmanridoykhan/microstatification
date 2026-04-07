import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSearch,
  FaDownload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaChevronDown,
  FaChevronRight,
  FaEye,
  FaTable,
  FaChartBar,
} from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../config";
import * as XLSX from "xlsx";

export default function SinglePatientTable() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // State management
  const [patient, setPatient] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleFields, setVisibleFields] = useState([]);
  const [searchTerms, setSearchTerms] = useState({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState("summary"); // 'summary', 'table', 'timeline'
  const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Fetch patient and submission data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = sessionStorage.getItem("authToken");

        // First, try to get the basic patient info
        const patientResponse = await axios.get(
          `${BACKEND_URL}/api/patients/${patientId}/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        setPatient(patientResponse.data);

        // Then try to get submissions
        const submissionsResponse = await axios.get(
          `${BACKEND_URL}/api/patients/${patientId}/submissions/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        setSubmissions(submissionsResponse.data.submissions || []);

        // Set visible fields based on submission data
        if (
          submissionsResponse.data.submissions &&
          submissionsResponse.data.submissions.length > 0
        ) {
          const allFields = new Set();
          submissionsResponse.data.submissions.forEach((submission) => {
            Object.keys(submission).forEach((key) => allFields.add(key));
          });
          setVisibleFields(Array.from(allFields));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setError(
          error.response?.data?.error ||
            error.response?.data?.detail ||
            "Failed to load patient data"
        );
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    } else {
      setError("No patient ID provided");
      setLoading(false);
    }
  }, [patientId]);

  // Helper functions to categorize and analyze data
  const categorizeFields = (submission) => {
    const categories = {
      identification: [],
      demographics: [],
      location: [],
      medical: [],
      administrative: [],
      other: [],
    };

    Object.entries(submission).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();

      if (
        keyLower.includes("id") ||
        keyLower.includes("nid") ||
        keyLower.includes("identifier")
      ) {
        categories.identification.push({ key, value });
      } else if (
        keyLower.includes("name") ||
        keyLower.includes("age") ||
        keyLower.includes("gender") ||
        keyLower.includes("phone") ||
        keyLower.includes("email") ||
        keyLower.includes("nationality")
      ) {
        categories.demographics.push({ key, value });
      } else if (
        keyLower.includes("division") ||
        keyLower.includes("district") ||
        keyLower.includes("upazila") ||
        keyLower.includes("ward") ||
        keyLower.includes("address") ||
        keyLower.includes("location") ||
        keyLower.includes("gps") ||
        keyLower.includes("coordinate")
      ) {
        categories.location.push({ key, value });
      } else if (
        keyLower.includes("disease") ||
        keyLower.includes("symptom") ||
        keyLower.includes("treatment") ||
        keyLower.includes("diagnosis") ||
        keyLower.includes("medical") ||
        keyLower.includes("health") ||
        keyLower.includes("fever") ||
        keyLower.includes("test") ||
        keyLower.includes("result") ||
        keyLower.includes("positive") ||
        keyLower.includes("negative") ||
        keyLower.includes("malaria") ||
        keyLower.includes("dengue") ||
        keyLower.includes("rdt")
      ) {
        categories.medical.push({ key, value });
      } else if (
        keyLower.includes("submission") ||
        keyLower.includes("created") ||
        keyLower.includes("updated") ||
        keyLower.includes("user") ||
        keyLower.includes("admin") ||
        keyLower.includes("xml")
      ) {
        categories.administrative.push({ key, value });
      } else {
        categories.other.push({ key, value });
      }
    });

    return categories;
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "")
      return "Not specified";
    if (
      typeof value === "string" &&
      value.includes("T") &&
      value.includes(":")
    ) {
      // Likely a datetime string
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    if (
      typeof value === "string" &&
      value.includes(" ") &&
      value.split(" ").length === 4
    ) {
      // Likely GPS coordinates
      const parts = value.split(" ");
      if (parts.every((part) => !isNaN(parseFloat(part)))) {
        return `Lat: ${parts[0]}, Lng: ${parts[1]}`;
      }
    }
    return String(value);
  };

  const getSubmissionSummary = () => {
    if (submissions.length === 0) return null;

    const latest = submissions[0];
    const oldest = submissions[submissions.length - 1];

    // Count unique diseases/conditions mentioned
    const diseases = new Set();
    const locations = new Set();

    submissions.forEach((sub) => {
      Object.entries(sub).forEach(([key, value]) => {
        if (
          key.toLowerCase().includes("disease") ||
          key.toLowerCase().includes("dengue") ||
          key.toLowerCase().includes("malaria") ||
          key.toLowerCase().includes("fever")
        ) {
          if (value && value !== "-" && value !== "") diseases.add(value);
        }
        if (
          key.toLowerCase().includes("district") ||
          key.toLowerCase().includes("upazila")
        ) {
          if (value && value !== "-" && value !== "") locations.add(value);
        }
      });
    });

    return {
      total: submissions.length,
      latest: latest,
      oldest: oldest,
      diseases: Array.from(diseases),
      locations: Array.from(locations),
      dateRange: {
        from: oldest.created_at || oldest.submission_date,
        to: latest.created_at || latest.submission_date,
      },
    };
  };

  const toggleSubmissionExpansion = (index) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSubmissions(newExpanded);
  };

  // Filter submissions based on search terms
  const filteredSubmissions = submissions.filter((submission) => {
    // Global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchesGlobal = Object.values(submission).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
      if (!matchesGlobal) return false;
    }

    // Column-specific search
    for (const [field, searchTerm] of Object.entries(searchTerms)) {
      if (searchTerm && submission[field]) {
        const fieldValue = String(submission[field]).toLowerCase();
        const searchValue = searchTerm.toLowerCase();
        if (!fieldValue.includes(searchValue)) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort submissions
  let sortedSubmissions = [...filteredSubmissions];
  if (sortConfig.key && sortConfig.direction) {
    sortedSubmissions.sort((a, b) => {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";

      // Handle different data types
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }

  // Handle sorting
  const handleSort = (field) => {
    let direction = "asc";
    if (sortConfig.key === field && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: field, direction });
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortConfig.key !== field) {
      return <FaSort className="opacity-30" />;
    }
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // Handle field visibility toggle
  const toggleFieldVisibility = (field) => {
    setVisibleFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Download submissions as Excel
  const downloadSubmissions = async () => {
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(
        `${BACKEND_URL}/api/patients/${patientId}/submissions_csv/`,
        {
          headers: { Authorization: `Token ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `patient_${patient?.patient_id}_submissions.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading submissions:", error);
      alert("Failed to download submissions");
    } finally {
      setDownloading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <div>
              <div className="text-lg font-semibold text-gray-700">
                Loading patient data...
              </div>
              <div className="text-sm text-gray-500">
                Please wait while we fetch submission data
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="text-red-800">{error}</div>
          <button
            onClick={() => navigate("/patients/all")}
            className="mt-2 text-red-600 underline"
          >
            Back to All Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/patients/all")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft />
            Back to All Patients
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {patient?.name || "Unknown Patient"}
            </h2>
            <p className="text-gray-600">
              Patient ID:{" "}
              <span className="font-medium">{patient?.patient_id}</span>
              {patient?.email && (
                <span className="ml-4">
                  Email: <span className="font-medium">{patient.email}</span>
                </span>
              )}
              {patient?.phone && (
                <span className="ml-4">
                  Phone: <span className="font-medium">{patient.phone}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={downloadSubmissions}
            disabled={downloading || submissions.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              downloading || submissions.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
          >
            {downloading ? (
              <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
            ) : (
              <FaDownload />
            )}
            {downloading ? "Downloading..." : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search all fields..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFieldSelector(!showFieldSelector)}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
          >
            Show/Hide Fields
          </button>
        </div>

        {/* Field Selector */}
        {showFieldSelector && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Visible Fields:
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {submissions.length > 0 &&
                Object.keys(submissions[0]).map((field) => (
                  <label key={field} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={visibleFields.includes(field)}
                      onChange={() => toggleFieldVisibility(field)}
                      className="rounded"
                    />
                    <span
                      className="text-xs text-gray-600 truncate"
                      title={field}
                    >
                      {field}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <div className="flex overflow-hidden border border-gray-300 rounded-lg">
          <button
            onClick={() => setViewMode("summary")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "summary"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaChartBar className="inline mr-2" />
            Summary
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              viewMode === "timeline"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaCalendarAlt className="inline mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
              viewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaTable className="inline mr-2" />
            Raw Data
          </button>
        </div>
      </div>

      {/* Summary View */}
      {viewMode === "summary" && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Total Submissions
                  </h3>
                  <p className="text-3xl font-bold">{submissions.length}</p>
                </div>
                <FaCalendarAlt className="text-3xl opacity-80" />
              </div>
            </div>

            <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Latest Submission
                  </h3>
                  <p className="text-lg font-medium">
                    {submissions.length > 0
                      ? new Date(
                          submissions[0].created_at ||
                            submissions[0].submission_date
                        ).toLocaleDateString()
                      : "No data"}
                  </p>
                </div>
                <FaEye className="text-3xl opacity-80" />
              </div>
            </div>

            <div className="p-6 text-white rounded-lg shadow-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Data Points
                  </h3>
                  <p className="text-3xl font-bold">
                    {submissions.length > 0
                      ? Object.keys(submissions[0]).length
                      : 0}
                  </p>
                </div>
                <FaChartBar className="text-3xl opacity-80" />
              </div>
            </div>
          </div>

          {/* Latest Submission Details */}
          {submissions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Latest Submission Details
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on{" "}
                  {new Date(
                    submissions[0].created_at || submissions[0].submission_date
                  ).toLocaleString()}
                </p>
              </div>
              <div className="p-6">
                {(() => {
                  const categories = categorizeFields(submissions[0]);
                  return (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Demographics */}
                      {categories.demographics.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="flex items-center text-sm font-semibold tracking-wide text-gray-700 uppercase">
                            <FaUser className="mr-2 text-blue-500" />
                            Demographics
                          </h4>
                          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
                            {categories.demographics.map(({ key, value }) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                  {formatFieldName(key)}:
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatFieldValue(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {categories.location.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="flex items-center text-sm font-semibold tracking-wide text-gray-700 uppercase">
                            <FaMapMarkerAlt className="mr-2 text-red-500" />
                            Location
                          </h4>
                          <div className="p-4 space-y-2 rounded-lg bg-gray-50">
                            {categories.location.map(({ key, value }) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-sm text-gray-600">
                                  {formatFieldName(key)}:
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatFieldValue(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medical Information */}
                      {categories.medical.length > 0 && (
                        <div className="space-y-3 lg:col-span-2">
                          <h4 className="flex items-center text-sm font-semibold tracking-wide text-gray-700 uppercase">
                            <FaCalendarAlt className="mr-2 text-green-500" />
                            Medical Information
                          </h4>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {categories.medical.map(({ key, value }) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-sm text-gray-600">
                                    {formatFieldName(key)}:
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatFieldValue(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Submission Timeline
              </h3>
              <p className="text-sm text-gray-600">
                {submissions.length} submissions chronologically ordered
              </p>
            </div>
            <div className="p-6">
              {submissions.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No submissions found
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission, index) => (
                    <div
                      key={submission.submission_id || index}
                      className="border border-gray-200 rounded-lg"
                    >
                      <div
                        className="p-4 transition-colors cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleSubmissionExpansion(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {expandedSubmissions.has(index) ? (
                              <FaChevronDown className="text-gray-500" />
                            ) : (
                              <FaChevronRight className="text-gray-500" />
                            )}
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <span className="text-sm font-medium text-blue-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                Submission #
                                {submission.submission_id || index + 1}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {new Date(
                                  submission.created_at ||
                                    submission.submission_date
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {Object.keys(submission).length} fields
                          </div>
                        </div>
                      </div>

                      {expandedSubmissions.has(index) && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          {(() => {
                            const categories = categorizeFields(submission);
                            return (
                              <div className="space-y-4">
                                {Object.entries(categories).map(
                                  ([categoryName, fields]) =>
                                    fields.length > 0 && (
                                      <div key={categoryName}>
                                        <h5 className="mb-2 text-sm font-semibold text-gray-700 capitalize">
                                          {categoryName
                                            .replace(/([A-Z])/g, " $1")
                                            .trim()}
                                        </h5>
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                          {fields.map(({ key, value }) => (
                                            <div
                                              key={key}
                                              className="p-2 bg-white border rounded"
                                            >
                                              <div className="text-xs text-gray-500">
                                                {formatFieldName(key)}
                                              </div>
                                              <div
                                                className="text-sm font-medium text-gray-900 truncate"
                                                title={formatFieldValue(value)}
                                              >
                                                {formatFieldValue(value)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Table View */}
      {viewMode === "table" && (
        <div>
          {/* Summary */}
          <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  Raw Data Table
                </h3>
                <p className="text-blue-600">
                  Total Submissions: {submissions.length} | Filtered Results:{" "}
                  {filteredSubmissions.length}
                  {patient?.created_at && (
                    <span className="ml-4">
                      Patient Created:{" "}
                      {new Date(patient.created_at).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
            {sortedSubmissions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mb-4 text-4xl">📋</div>
                <div className="mb-2 text-xl font-medium text-gray-600">
                  {submissions.length === 0
                    ? "No Submissions Found"
                    : "No Results Match Your Search"}
                </div>
                <div className="text-gray-500">
                  {submissions.length === 0
                    ? "This patient has not submitted any forms yet."
                    : "Try adjusting your search criteria to see results."}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b">
                        #
                      </th>
                      {visibleFields.map((field) => (
                        <th
                          key={field}
                          className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-b cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort(field)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="truncate" title={field}>
                                {field.replace(/_/g, " ")}
                              </span>
                              <input
                                type="text"
                                placeholder="Filter..."
                                value={searchTerms[field] || ""}
                                onChange={(e) =>
                                  setSearchTerms((prev) => ({
                                    ...prev,
                                    [field]: e.target.value,
                                  }))
                                }
                                className="px-2 py-1 mt-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="ml-2">{getSortIcon(field)}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedSubmissions.map((submission, index) => (
                      <tr
                        key={submission.submission_id || index}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 border-b whitespace-nowrap">
                          {index + 1}
                        </td>
                        {visibleFields.map((field) => (
                          <td
                            key={field}
                            className="px-4 py-3 text-sm text-gray-900 border-b"
                          >
                            <div
                              className="max-w-xs truncate"
                              title={String(submission[field] || "")}
                            >
                              {submission[field] !== null &&
                              submission[field] !== undefined
                                ? String(submission[field])
                                : "-"}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
