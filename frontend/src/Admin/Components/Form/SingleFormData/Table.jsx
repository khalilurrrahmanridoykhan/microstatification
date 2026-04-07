// Updated Table component based on your instruction
// Data is now sourced from formMetaData.submission directly

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { FcGenericSortingAsc } from "react-icons/fc";
import { FcGenericSortingDesc } from "react-icons/fc";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { FiEyeOff, FiImage, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import { IoEye } from "react-icons/io5";
import { MdDownload, MdEdit, MdDelete } from "react-icons/md";
import { IoPrintSharp } from "react-icons/io5";
import { toast } from "sonner";
import { RxCross2 } from "react-icons/rx";
import { FaTrashAlt } from "react-icons/fa";
import { MdEditDocument } from "react-icons/md";
import { LuArrowUpDown } from "react-icons/lu";

function Table() {
  const { formId } = useParams();
  const [formMetaData, setFormMetaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibleFields, setVisibleFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [sortPopupOpenFor, setSortPopupOpenFor] = useState(null);
  const [rowValidation, setRowValidation] = useState({});
  const [validationFilter, setValidationFilter] = useState("Show All");
  const [viewModalData, setViewModalData] = useState(null);
  const [fullView, setFullView] = useState(false);
  const [allImages, setAllImages] = useState([]);
  const [imageModalData, setImageModalData] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("en"); // Default to English
  const [availableLanguages, setAvailableLanguages] = useState([]);

  // Helper function to get translated text
  const getTranslatedText = (item, field, fallback = "") => {
    if (currentLanguage === "en") {
      return item[field] || fallback;
    }

    // Check if the item has translations
    if (item.translations && item.translations[currentLanguage]) {
      return item.translations[currentLanguage];
    }

    // Fallback to English
    return item[field] || fallback;
  };

  // Helper function to get option label in current language
  const getOptionLabel = (question, optionName) => {
    if (!question || !question.options) return optionName;

    const option = question.options.find((opt) => opt.name === optionName);
    if (!option) return optionName;

    if (currentLanguage === "en") {
      return option.label || optionName;
    }

    // Check for translation
    if (option.translations && option.translations[currentLanguage]) {
      return option.translations[currentLanguage];
    }

    // Fallback to English label
    return option.label || optionName;
  };

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const resImage = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/media/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        setAllImages(resImage.data);

        setFormMetaData(res.data);

        // Extract available languages from the form
        const languages = [{ code: "en", name: "English" }]; // Default English

        // Check if there are translations in questions
        const translationKeys = new Set();
        res.data.questions.forEach((question) => {
          if (question.translations) {
            Object.keys(question.translations).forEach((lang) => {
              translationKeys.add(lang);
            });
          }
          // Also check options for translations
          if (question.options) {
            question.options.forEach((option) => {
              if (option.translations) {
                Object.keys(option.translations).forEach((lang) => {
                  translationKeys.add(lang);
                });
              }
            });
          }
        });

        // Add discovered languages
        translationKeys.forEach((lang) => {
          languages.push({ code: lang, name: lang });
        });

        setAvailableLanguages(languages);

        // Get all question fields as table columns
        const allQuestionFields = [];

        // Add standard fields first
        allQuestionFields.push("start", "end");

        // Get all actual questions (non-group questions) from the form definition
        const formQuestions = res.data.questions.filter(
          (q) =>
            q.type !== "begin_group" &&
            q.type !== "end_group" &&
            q.type !== "begin_repeat" &&
            q.type !== "end_repeat" &&
            q.name &&
            q.name.trim() !== ""
        );

        // Add all question field names - this ensures we have all columns based on form definition
        formQuestions.forEach((question) => {
          allQuestionFields.push(question.name);
        });

        // Add meta fields that appear in submissions
        allQuestionFields.push("meta.submitted_by", "meta.submission_type");

        setVisibleFields(allQuestionFields);

        const validationStates = {};
        res.data.submission.forEach((s) => {
          // Safety check for s and s.data
          if (s && s.data) {
            const instanceID = s.data?.meta?.instanceID;
            if (instanceID) {
              validationStates[instanceID] = s.data?.meta?.validation || "-";
            }
          }
        });
        setRowValidation(validationStates);
      } catch (error) {
        console.error("Failed to fetch form metadata:", error);
        toast.error("Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [formId]);

  useEffect(() => {
    if (formMetaData && formMetaData.submission) {
      const initialValidation = {};
      formMetaData.submission.forEach((sub) => {
        // Safety check for sub and sub.data
        if (sub && sub.data) {
          const instanceId = sub.data?.meta?.instanceID;
          const validation = sub.data?.Validation;
          if (instanceId && validation) {
            initialValidation[instanceId] = validation;
          }
        }
      });
      // console.log("Initial rowValidation:", initialValidation); // <-- Show in console
      setRowValidation(initialValidation);
    }
  }, [formMetaData]);

  // Helper function to flatten group objects
  const flattenRow = (row) => {
    // Safety check: ensure row exists
    if (!row || typeof row !== "object") {
      return {};
    }

    const flat = {};

    const flattenObject = (obj, prefix = "") => {
      for (const key in obj) {
        const value = obj[key];
        const finalKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          if (value.length === 0) {
            flat[finalKey] = [];
            continue;
          }

          // Keep scalar arrays directly and also expand indexed entries.
          const hasComplexItems = value.some(
            (item) => item && typeof item === "object"
          );
          if (!hasComplexItems) {
            flat[finalKey] = value;
          }

          value.forEach((item, index) => {
            const indexedKey = `${finalKey}[${index}]`;
            if (item && typeof item === "object") {
              flattenObject(item, indexedKey);
            } else {
              flat[indexedKey] = item;
            }
          });
        } else if (value && typeof value === "object") {
          flattenObject(value, finalKey);
        } else {
          flat[finalKey] = value;
        }
      }
    };

    flattenObject(row);

    return flat;
  };

  const normalizeDisplayValue = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      return value
        .map((item) => normalizeDisplayValue(item))
        .filter((item) => item !== "")
        .join(", ");
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const collapseDisplayValues = (values, delimiter = " | ") => {
    if (!Array.isArray(values) || values.length === 0) return "";
    const uniqueValues = [];
    const seen = new Set();

    values.forEach((rawValue) => {
      const normalized = normalizeDisplayValue(rawValue);
      if (!normalized) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      uniqueValues.push(normalized);
    });

    if (uniqueValues.length === 0) return "";
    if (uniqueValues.length === 1) return uniqueValues[0];
    return uniqueValues.join(delimiter);
  };

  const resolveRawValuesForField = (flattened, fieldName) => {
    if (!flattened || typeof flattened !== "object") return [];
    const values = [];

    const addValue = (value) => {
      if (value === null || value === undefined) return;
      if (typeof value === "string" && value.trim() === "") return;
      values.push(value);
    };

    // 1) direct key
    if (flattened[fieldName] !== undefined) {
      addValue(flattened[fieldName]);
    }

    // 2) legacy grouped paths
    if (values.length === 0) {
      const possiblePaths = [
        `_.${fieldName}`,
        `_._1.${fieldName}`,
        `_._2.${fieldName}`,
        `_._3.${fieldName}`,
        `address.${fieldName}`,
      ];
      possiblePaths.forEach((path) => {
        if (flattened[path] !== undefined) {
          addValue(flattened[path]);
        }
      });
    }

    // 3) partial match including repeat indexed keys (repeat[0].field)
    const matchingKeys = Object.keys(flattened)
      .filter((key) => {
        const keyBase =
          key
            .split(".")
            .pop()
            ?.replace(/\[\d+\]/g, "") || "";
        return (
          keyBase === fieldName ||
          key.endsWith(`.${fieldName}`) ||
          (fieldName.includes("_") &&
            keyBase.includes("_") &&
            keyBase.toLowerCase() === fieldName.toLowerCase())
        );
      })
      .sort();

    matchingKeys.forEach((key) => addValue(flattened[key]));

    return values;
  };

  const convertQuestionValue = (question, rawValue) => {
    if (!question) return rawValue;

    const questionType = question.type || "";

    if (questionType.includes("select_multiple")) {
      if (Array.isArray(rawValue)) {
        const optionLabels = rawValue
          .map((item) => getOptionLabel(question, item))
          .filter((label) => label !== "");
        return optionLabels.join(", ");
      }

      if (typeof rawValue === "string") {
        const selectedOptions = rawValue.split(" ").filter(Boolean);
        if (selectedOptions.length > 1) {
          return selectedOptions
            .map((optionName) => getOptionLabel(question, optionName))
            .join(", ");
        }
      }
      return getOptionLabel(question, rawValue);
    }

    if (questionType.includes("select_one")) {
      if (Array.isArray(rawValue)) {
        return collapseDisplayValues(
          rawValue.map((item) => getOptionLabel(question, item))
        );
      }
      return getOptionLabel(question, rawValue);
    }

    return rawValue;
  };

  // Helper function to get field label
  const getFieldLabel = (fieldName) => {
    // Handle special cases first
    if (fieldName === "start") return "Start Time";
    if (fieldName === "end") return "End Time";
    if (fieldName === "meta.instanceID") return "Instance ID";
    if (fieldName === "meta.submitted_by") return "Submitted By";
    if (fieldName === "meta.submission_type") return "Submission Type";
    if (fieldName === "_version") return "Version";
    if (fieldName === "_id") return "Id";
    if (fieldName === "Validation") return "Validation";

    // Handle specific duplicate field cases
    if (fieldName === "designation_1") return "Designation (BRAC)";
    if (fieldName === "designation") return "Designation (Govt)";

    // Check if it's a direct question field
    const question = formMetaData?.questions.find((q) => q.name === fieldName);
    if (question && question.label) {
      return getTranslatedText(question, "label", question.label);
    }

    // For nested fields, try to find the original question by the last part of the path
    const baseName = fieldName.split(".").pop();
    const baseQuestion = formMetaData?.questions.find(
      (q) => q.name === baseName
    );
    if (baseQuestion && baseQuestion.label) {
      return getTranslatedText(baseQuestion, "label", baseQuestion.label);
    }

    // Fallback to formatted field name
    return baseName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const rows =
    formMetaData?.submission?.map((s, idx) => {
      // Safety check: ensure s and s.data exist
      if (!s || !s.data) {
        return {
          uuid: `missing-${idx}`,
          _index: idx,
        };
      }

      // Get flattened data from submission
      const flattened = flattenRow(s.data);

      // Create row data mapped to question fields
      const rowData = {};

      // Map each visible field to its data from the submission
      visibleFields.forEach((fieldName) => {
        let value = null;

        // Handle special fields first
        if (fieldName === "start") {
          value = s.data.start;
        } else if (fieldName === "end") {
          value = s.data.end;
        } else if (fieldName === "meta.submitted_by") {
          value = s.data.meta?.submitted_by;
        } else if (fieldName === "meta.submission_type") {
          value = s.data.meta?.submission_type;
        } else {
          const rawValues = resolveRawValuesForField(flattened, fieldName);
          const question = formMetaData?.questions?.find(
            (q) => q.name === fieldName
          );

          if (
            question &&
            question.options &&
            question.options.length > 0 &&
            rawValues.length > 0
          ) {
            const converted = rawValues.map((rawValue) =>
              convertQuestionValue(question, rawValue)
            );
            value = collapseDisplayValues(converted);
          } else {
            value = collapseDisplayValues(rawValues);
          }
        }

        rowData[fieldName] = value;
      });

      return {
        ...rowData,
        uuid: s.data?.meta?.instanceID || `unknown-${idx}`,
        _index: idx,
      };
    }) || [];

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
        .format(date)
        .toLowerCase(); // e.g., "07 Jul 2025, 4:33 pm"
    } catch {
      return "";
    }
  };

  const filteredData = rows.filter((row) => {
    const matchValidation =
      validationFilter === "Show All" ||
      rowValidation[row.uuid] === validationFilter;

    const matchSearch = visibleFields.every((fieldName) => {
      const term = searchTerms[fieldName]?.toLowerCase() || "";
      if (!term) return true; // No search term for this field

      const fieldValue = row[fieldName];

      // Handle special date formatting for start/end fields
      if (fieldName === "start" || fieldName === "end") {
        return formatDateTime(fieldValue).toLowerCase().includes(term);
      }

      // Handle regular field search
      return String(fieldValue ?? "")
        .toLowerCase()
        .includes(term);
    });

    return matchValidation && matchSearch;
  });
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

  const handleDownload = async (filename) => {
    const response = await fetch(imageModalData.url);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleDeleteSelected = async () => {
    if (
      !window.confirm("Are you sure you want to delete selected submissions?")
    )
      return;

    try {
      const token = sessionStorage.getItem("authToken");
      await Promise.all(
        selectedRows.map((uuid) =>
          axios.delete(`${BACKEND_URL}/api/submissions/${uuid}/`, {
            headers: { Authorization: `Token ${token}` },
          })
        )
      );
      toast.success("Selected submissions deleted.");
      // Optionally refetch data here
      window.location.reload(); // or use fetchMetaData()
    } catch (error) {
      toast.error("Failed to delete submissions.");
      console.error(error);
    }
  };

  const handleEditSelected = () => {
    if (selectedRows.length !== 1) {
      toast.warning("Please select exactly one submission to edit.");
      return;
    }

    const submission = rows.find((r) => r.uuid === selectedRows[0]);
    setViewModalData(submission); // reuse your existing modal
  };

  const handleEditSubmission = async (row) => {
    const instanceId = row?.["meta.instanceID"] || row?.uuid;

    if (!instanceId) {
      toast.error("Instance ID not found for this submission.");
      return;
    }

    try {
      // Call the backend API to get Enketo edit URL (similar to KoboToolbox pattern)
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(
        `${BACKEND_URL}/api/forms/${formId}/data/${instanceId}/enketo/edit/?return_url=false`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.data.url) {
        // Open the Enketo edit URL in a new tab
        window.open(response.data.url, "_blank");
        toast.success("Opening edit form...");
      } else {
        toast.error("Failed to get edit URL");
      }
    } catch (error) {
      console.error("Error getting Enketo edit URL:", error);

      if (error.response?.status === 400) {
        toast.error(
          "Enketo ID not available. Please fetch Enketo data first from the Form tab."
        );
      } else {
        toast.error("Failed to open edit form. Please try again.");
      }
    }
  };

  const handleDeleteSubmission = async (row) => {
    const instanceId = row?.["meta.instanceID"] || row?.uuid;

    if (!instanceId) {
      toast.error("Instance ID not found for this submission.");
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.delete(
        `${BACKEND_URL}/api/forms/${formId}/submissions/${instanceId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Remove the submission from local state
        setFormMetaData((prev) => ({
          ...prev,
          submission: prev.submission.filter(
            (sub) => sub.data?.meta?.instanceID !== instanceId
          ),
        }));

        // Update row validation state
        setRowValidation((prev) => {
          const newState = { ...prev };
          delete newState[instanceId];
          return newState;
        });

        toast.success("Submission deleted successfully");
        setDeleteConfirm(null);
      } else {
        toast.error("Failed to delete submission");
      }
    } catch (error) {
      console.error("Error deleting submission:", error);
      toast.error("Failed to delete submission. Please try again.");
      setDeleteConfirm(null);
    }
  };

  // console.log("filteredData", filteredData);
  // console.log("formdataMeta-full", formMetaData);
  // console.log("Column -- ", columnWidths);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-4 bg-white border rounded-lg border-black/70">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg text-gray-600">Loading submissions...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-1 text-blue-900 rounded hover:underline"
              >
                <FiEyeOff className="items-center" />{" "}
                <span className="m-0 text-[14px]">Hide Fields</span>
              </button>

              {/* Language Switcher */}
              {availableLanguages.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-[14px] font-medium text-gray-700">
                    Language:
                  </label>
                  <select
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value)}
                    className="px-2 py-1 text-[14px] border rounded"
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <select
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1); // reset to first page when size changes
                }}
                className="px-2 py-1 text-sm border rounded"
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setFullView((prev) => !prev)}
              className="text-blue-900 text-[14px] rounded flex items-center gap-1 hover:underline"
            >
              {fullView ? <FiMinimize2 /> : <FiMaximize2 />}
              <span>{fullView ? "Collapse View" : "Full View"}</span>
            </button>
          </div>

          <div
            className={`${
              fullView
                ? "w-screen fixed top-0 left-0 z-50 h-screen bg-white p-4 overflow-auto"
                : "w-full"
            }`}
          >
            {fullView && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-blue-900 rounded flex justify-center text-[14px] items-center gap-1 hover:underline"
                  >
                    <FiEyeOff className="items-center" />{" "}
                    <span className="m-0 text-[14px]">Hide Fields</span>
                  </button>

                  {/* Language Switcher for Full View */}
                  {availableLanguages.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-[14px] font-medium text-gray-700">
                        Language:
                      </label>
                      <select
                        value={currentLanguage}
                        onChange={(e) => setCurrentLanguage(e.target.value)}
                        className="px-2 py-1 text-[14px] border rounded"
                      >
                        {availableLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setFullView((prev) => !prev)}
                  className="text-blue-900 text-[14px] rounded flex items-center gap-1 hover:underline text-xl"
                >
                  <FiMaximize2 />
                  <span>Collapse View</span>
                </button>
              </div>
            )}
            <div className="overflow-x-scroll text-md">
              <table className="bg-white border border-collapse border-gray-300 ">
                <thead>
                  <tr>
                    <th className="w-[100px] bg-gray-100 border text-left">
                      <span className="text-[14px] font-bold ">
                        {rows.length} results
                      </span>
                    </th>

                    <th
                      className="p-2 text-left bg-gray-100 border"
                      style={{ width: columnWidths.validation || 120 }}
                    >
                      <ResizableBox
                        width={columnWidths.validation || 120}
                        height={60}
                        axis="x"
                        resizeHandles={["e"]}
                        onResizeStop={(e, data) =>
                          setColumnWidths((prev) => ({
                            ...prev,
                            validation: data.size.width,
                          }))
                        }
                        handle={
                          <span className="absolute top-0 right-0 z-10 w-8 h-full bg-transparent cursor-col-resize" />
                        }
                        className="relative"
                      >
                        <div className="flex flex-col justify-center h-full px-2">
                          <label className="text-[14px] font-bold mb-1 truncate">
                            Validation
                          </label>
                          <select
                            className="text-[12px] rounded border px-2 py-1"
                            value={validationFilter}
                            onChange={(e) =>
                              setValidationFilter(e.target.value)
                            }
                          >
                            {[
                              "Show All",
                              "-",
                              "Approved",
                              "Not approved",
                              "On hold",
                            ].map((opt) => (
                              <option
                                key={opt}
                                className="text-[14px]"
                                value={opt}
                              >
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </ResizableBox>
                    </th>

                    {/* Start Time */}
                    <th
                      className="p-2 text-left bg-gray-100 border"
                      style={{ width: columnWidths.start || 150 }}
                    >
                      <ResizableBox
                        width={columnWidths.start || 150}
                        height={60}
                        axis="x"
                        resizeHandles={["e"]}
                        onResizeStop={(e, data) =>
                          setColumnWidths((prev) => ({
                            ...prev,
                            start: data.size.width,
                          }))
                        }
                        handle={
                          <span className="absolute top-0 right-0 z-10 w-8 h-full bg-transparent cursor-col-resize" />
                        }
                        className="relative"
                      >
                        <div className="flex flex-col justify-center h-full px-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold truncate">
                              Start Time
                            </span>
                            <button
                              onClick={() =>
                                setSortPopupOpenFor((prev) =>
                                  prev === "start" ? null : "start"
                                )
                              }
                              className="ml-1 text-xs"
                            >
                              {sortConfig.key === "start" ? (
                                sortConfig.direction === "asc" ? (
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                ) : (
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                )
                              ) : (
                                <LuArrowUpDown className="w-4 h-4" />
                              )}
                            </button>
                            {sortPopupOpenFor === "start" && (
                              <div className="absolute right-0 z-50 p-1 mt-2 text-xs bg-white border rounded shadow w-38">
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "start",
                                      direction: "asc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                  <span className="ml-1">Oldest First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "start",
                                      direction: "desc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                  <span className="ml-1">Newest First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: null,
                                      direction: null,
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 text-red-600 hover:bg-gray-100"
                                >
                                  <IoCloseOutline className="w-4 h-4" />
                                  <span className="ml-1">Clear Sort</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <input
                            className="mt-1 text-xs border rounded px-1 py-0.5"
                            type="text"
                            placeholder="Search..."
                            value={searchTerms.start || ""}
                            onChange={(e) =>
                              setSearchTerms((prev) => ({
                                ...prev,
                                start: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </ResizableBox>
                    </th>

                    {/* End Time */}
                    <th
                      className="p-2 text-left bg-gray-100 border"
                      style={{ width: columnWidths.end || 150 }}
                    >
                      <ResizableBox
                        width={columnWidths.end || 150}
                        height={60}
                        axis="x"
                        resizeHandles={["e"]}
                        onResizeStop={(e, data) =>
                          setColumnWidths((prev) => ({
                            ...prev,
                            end: data.size.width,
                          }))
                        }
                        handle={
                          <span className="absolute top-0 right-0 z-10 w-8 h-full bg-transparent cursor-col-resize" />
                        }
                        className="relative"
                      >
                        <div className="flex flex-col justify-center h-full px-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold truncate">
                              End Time
                            </span>
                            <button
                              onClick={() =>
                                setSortPopupOpenFor((prev) =>
                                  prev === "end" ? null : "end"
                                )
                              }
                              className="ml-1 text-xs"
                            >
                              {sortConfig.key === "end" ? (
                                sortConfig.direction === "asc" ? (
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                ) : (
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                )
                              ) : (
                                <LuArrowUpDown className="w-4 h-4" />
                              )}
                            </button>
                            {sortPopupOpenFor === "end" && (
                              <div className="absolute right-0 z-50 p-1 mt-2 text-xs bg-white border rounded shadow w-38">
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "end",
                                      direction: "asc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                  <span className="ml-1">Oldest First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "end",
                                      direction: "desc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                  <span className="ml-1">Newest First</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: null,
                                      direction: null,
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 text-red-600 hover:bg-gray-100"
                                >
                                  <IoCloseOutline className="w-4 h-4" />
                                  <span className="ml-1">Clear Sort</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <input
                            className="mt-1 text-xs border rounded px-1 py-0.5"
                            type="text"
                            placeholder="Search..."
                            value={searchTerms.end || ""}
                            onChange={(e) =>
                              setSearchTerms((prev) => ({
                                ...prev,
                                end: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </ResizableBox>
                    </th>

                    {visibleFields
                      .filter(
                        (fieldName) =>
                          fieldName !== "start" &&
                          fieldName !== "end" &&
                          fieldName !== "uuid" &&
                          !fieldName.includes("meta.instanceID")
                      )
                      .map((fieldName, idx) => (
                        <th
                          key={idx}
                          className="p-2 bg-gray-100 border text-md"
                        >
                          <ResizableBox
                            width={columnWidths[fieldName] || 200}
                            height={60}
                            axis="x"
                            resizeHandles={["e"]}
                            onResizeStop={(e, data) =>
                              setColumnWidths((prev) => ({
                                ...prev,
                                [fieldName]: data.size.width,
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
                                  {getFieldLabel(fieldName)}
                                </span>
                                <button
                                  onClick={() =>
                                    setSortPopupOpenFor((prev) =>
                                      prev === fieldName ? null : fieldName
                                    )
                                  }
                                  className="ml-1 text-xs"
                                >
                                  {sortConfig.key === fieldName ? (
                                    sortConfig.direction === "asc" ? (
                                      <FcGenericSortingAsc className="w-4 h-4" />
                                    ) : sortConfig.direction === "desc" ? (
                                      <FcGenericSortingDesc className="w-4 h-4" />
                                    ) : (
                                      <LuArrowUpDown className="w-4 h-4" />
                                    )
                                  ) : (
                                    <LuArrowUpDown className="w-4 h-4" />
                                  )}
                                </button>
                                {sortPopupOpenFor === fieldName && (
                                  <div className="absolute right-0 z-50 p-1 mt-2 text-xs bg-white border rounded shadow w-38">
                                    <button
                                      onClick={() => {
                                        setSortConfig({
                                          key: fieldName,
                                          direction: "asc",
                                        });
                                        setSortPopupOpenFor(null);
                                      }}
                                      className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                    >
                                      <FcGenericSortingAsc className="w-4 h-4" />
                                      <span className="ml-1">Sort A-Z</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSortConfig({
                                          key: fieldName,
                                          direction: "desc",
                                        });
                                        setSortPopupOpenFor(null);
                                      }}
                                      className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                    >
                                      <FcGenericSortingDesc className="w-4 h-4" />
                                      <span className="ml-1">Sort Z-A</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSortConfig({
                                          key: null,
                                          direction: null,
                                        });
                                        setSortPopupOpenFor(null);
                                      }}
                                      className="flex items-center w-full px-2 py-1 text-red-600 hover:bg-gray-100"
                                    >
                                      <IoCloseOutline className="w-4 h-4" />
                                      <span className="ml-1">Clear Sort</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <input
                                className="mt-1 text-xs border rounded px-1 py-0.5"
                                type="text"
                                placeholder="Search..."
                                value={searchTerms[fieldName] || ""}
                                onChange={(e) =>
                                  setSearchTerms((prev) => ({
                                    ...prev,
                                    [fieldName]: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </ResizableBox>
                        </th>
                      ))}
                    <th
                      className="p-2 text-left bg-gray-100 border"
                      style={{ width: columnWidths.uuid || 200 }}
                    >
                      <ResizableBox
                        width={columnWidths.uuid || 200}
                        height={60}
                        axis="x"
                        resizeHandles={["e"]}
                        onResizeStop={(e, data) =>
                          setColumnWidths((prev) => ({
                            ...prev,
                            uuid: data.size.width,
                          }))
                        }
                        handle={
                          <span className="absolute top-0 right-0 z-10 w-8 h-full bg-transparent cursor-col-resize" />
                        }
                        className="relative"
                      >
                        <div className="flex flex-col px-2">
                          <div className="flex items-center justify-between">
                            <label className="m-0 text-[14px] font-bold truncate">
                              uuid
                            </label>
                            <button
                              onClick={() =>
                                setSortPopupOpenFor((prev) =>
                                  prev === "uuid" ? null : "uuid"
                                )
                              }
                              className="ml-1 text-xs"
                            >
                              {sortConfig.key === "uuid" ? (
                                sortConfig.direction === "asc" ? (
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                ) : (
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                )
                              ) : (
                                <LuArrowUpDown className="w-4 h-4" />
                              )}
                            </button>

                            {sortPopupOpenFor === "uuid" && (
                              <div className="absolute right-0 z-50 p-1 mt-2 text-xs bg-white border rounded shadow w-38">
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "uuid",
                                      direction: "asc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingAsc className="w-4 h-4" />
                                  <span className="ml-1">Sort A-Z</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: "uuid",
                                      direction: "desc",
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 hover:bg-gray-100"
                                >
                                  <FcGenericSortingDesc className="w-4 h-4" />
                                  <span className="ml-1">Sort Z-A</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSortConfig({
                                      key: null,
                                      direction: null,
                                    });
                                    setSortPopupOpenFor(null);
                                  }}
                                  className="flex items-center w-full px-2 py-1 text-red-600 hover:bg-gray-100"
                                >
                                  <IoCloseOutline className="w-4 h-4" />
                                  <span className="ml-1">Clear Sort</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Search input */}
                          <input
                            className="mt-1 text-xs border rounded px-1 py-0.5"
                            type="text"
                            placeholder="Search..."
                            value={searchTerms.uuid || ""}
                            onChange={(e) =>
                              setSearchTerms((prev) => ({
                                ...prev,
                                uuid: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </ResizableBox>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr key={i}>
                      <td className="border p-2 max-w-[150px]  flex justify-center  bg-white items-center gap-2">
                        <div className="flex gap-2 ">
                          <button
                            type="button"
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => setViewModalData(row)}
                          >
                            <IoEye className="w-6 h-6 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            className="text-gray-600 hover:text-gray-800"
                            onClick={() => handleEditSubmission(row)}
                          >
                            <MdEdit className="w-5 h-5 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => setDeleteConfirm(row)}
                            title="Delete submission"
                          >
                            <MdDelete className="w-5 h-5 text-red-600" />
                          </button>

                          {/* <span>{console.log(row)}</span> */}
                        </div>
                      </td>
                      <td className="p-2 border">
                        <select
                          className={`text-[14px] px-2 py-1 rounded border font-medium ${
                            rowValidation[row.uuid] === "Approved"
                              ? "bg-green-100 text-green-600"
                              : rowValidation[row.uuid] === "Not approved"
                              ? "bg-red-100 text-red-600"
                              : rowValidation[row.uuid] === "On hold"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                          value={rowValidation[row.uuid] || "-"}
                          onChange={async (e) => {
                            const newValue = e.target.value;
                            setRowValidation((prev) => ({
                              ...prev,
                              [row.uuid]: newValue,
                            }));

                            // Send PATCH request to backend
                            try {
                              await axios.patch(
                                `${BACKEND_URL}/api/submissions/${row.uuid}/validation/`,
                                { validation: newValue },
                                {
                                  headers: {
                                    Authorization: `Token ${sessionStorage.getItem(
                                      "authToken"
                                    )}`,
                                  },
                                }
                              );
                              toast.success("validation is updated");
                            } catch (err) {
                              console.error("Failed to update validation", err);
                            }
                          }}
                        >
                          {["-", "Approved", "Not approved", "On hold"].map(
                            (opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td
                        style={{
                          width: `${columnWidths.start || 200}px`,
                          minWidth: `${columnWidths.start || 200}px`,
                          maxWidth: `${columnWidths.start || 200}px`,
                        }}
                        className="p-2 overflow-hidden border whitespace-nowrap text-ellipsis"
                      >
                        <div className="w-full text-[14px] truncate">
                          {new Date(row.start).toLocaleString("en-GB", {
                            timeZone: "Asia/Dhaka",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>

                      <td
                        style={{
                          width: `${columnWidths.end || 200}px`,
                          minWidth: `${columnWidths.end || 200}px`,
                          maxWidth: `${columnWidths.end || 200}px`,
                        }}
                        className="p-2 overflow-hidden border whitespace-nowrap text-ellipsis"
                      >
                        <div className="w-full text-[14px] truncate">
                          {new Date(row.end).toLocaleString("en-GB", {
                            timeZone: "Asia/Dhaka",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </div>
                      </td>

                      {visibleFields
                        .filter(
                          (fieldName) =>
                            fieldName !== "start" &&
                            fieldName !== "end" &&
                            fieldName !== "uuid" &&
                            !fieldName.includes("meta.instanceID")
                        )
                        .map((fieldName, j) => {
                          const question = formMetaData?.questions.find(
                            (q) => q.name === fieldName
                          );
                          const isImageField = question?.type === "image";

                          return (
                            <td
                              key={j}
                              style={{
                                width: `${columnWidths[fieldName] || 200}px`,
                                minWidth: `${columnWidths[fieldName] || 200}px`,
                                maxWidth: `${columnWidths[fieldName] || 200}px`,
                              }}
                              className="border text-[14px] p-2 whitespace-nowrap overflow-hidden text-ellipsis"
                            >
                              {isImageField && row[fieldName] ? (
                                <button
                                  className="flex text-[14px] items-center gap-1 text-blue-600 hover:underline"
                                  onClick={() => {
                                    const matched = allImages.find(
                                      (img) => img.filename === row[fieldName]
                                    );
                                    console.log("Matched Image:", matched);
                                    if (matched) {
                                      setImageModalData({
                                        url: `${BACKEND_URL}${matched.url}`,
                                        filename: matched.filename,
                                      });
                                    } else {
                                      toast.error("Image not found.");
                                    }
                                  }}
                                >
                                  <FiImage className="w-4 h-4" />
                                  View Image
                                </button>
                              ) : typeof row[fieldName] === "object" &&
                                row[fieldName] !== null ? (
                                Object.entries(row[fieldName])
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ")
                              ) : (
                                row[fieldName] ?? ""
                              )}
                            </td>
                          );
                        })}

                      <td
                        style={{
                          width: `${columnWidths.uuid || 200}px`,
                          minWidth: `${columnWidths.uuid || 200}px`,
                          maxWidth: `${columnWidths.uuid || 200}px`,
                        }}
                        className="p-2 overflow-hidden border whitespace-nowrap text-ellipsis"
                      >
                        <div className="w-full text-[14px] truncate">
                          {row["meta.instanceID"] || row.uuid || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan={visibleFields.length + 2}
                        className="p-4 text-gray-500 text-start text-[16px]"
                      >
                        No submission found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 mt-4 md:flex-row">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className="px-3 text-[16px] py-1 border rounded bg-white disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className="px-3 py-1 text-[16px] border rounded bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Select Visible Fields
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="font-bold text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-2xl">X</span>
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {/* Add standard fields */}
                  {["start", "end"].map((fieldName) => (
                    <label
                      key={fieldName}
                      className="flex items-center p-2 space-x-2 border rounded-lg border-black/60"
                    >
                      <input
                        type="checkbox"
                        checked={visibleFields.includes(fieldName)}
                        onChange={() => {
                          setVisibleFields((prev) =>
                            prev.includes(fieldName)
                              ? prev.filter((f) => f !== fieldName)
                              : [...prev, fieldName]
                          );
                        }}
                      />
                      <span>{getFieldLabel(fieldName)}</span>
                    </label>
                  ))}

                  {/* Add all available fields from the data, excluding duplicates */}
                  {visibleFields
                    .filter(
                      (fieldName) =>
                        fieldName !== "start" &&
                        fieldName !== "end" &&
                        fieldName !== "uuid" &&
                        !fieldName.includes("meta.instanceID")
                    )
                    .sort((a, b) =>
                      getFieldLabel(a).localeCompare(getFieldLabel(b))
                    )
                    .map((fieldName) => (
                      <label
                        key={fieldName}
                        className="flex items-center p-2 space-x-2 border rounded-lg border-black/60"
                      >
                        <input
                          type="checkbox"
                          checked={visibleFields.includes(fieldName)}
                          onChange={() => {
                            setVisibleFields((prev) =>
                              prev.includes(fieldName)
                                ? prev.filter((f) => f !== fieldName)
                                : [...prev, fieldName]
                            );
                          }}
                        />
                        <span className="truncate">
                          {getFieldLabel(fieldName)}
                        </span>
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

          {viewModalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                id="printable-submission"
                className="bg-white rounded-lg shadow-lg p-6 max-w-5xl w-full max-h-[80vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Submission Details</h2>
                  <button
                    onClick={() => setViewModalData(null)}
                    className="text-lg font-bold text-gray-500 hover:text-gray-700"
                  >
                    <RxCross2 className="w-8 h-8" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const content = document.getElementById(
                          "printable-submission"
                        ).innerHTML;
                        const printWindow = window.open(
                          "",
                          "",
                          "height=600,width=800"
                        );
                        printWindow.document.write(
                          "<html><head><title>Submission Print</title>"
                        );
                        printWindow.document.write(
                          "<style>body{font-family:sans-serif;padding:20px;}div{margin-bottom:10px;}</style>"
                        );
                        printWindow.document.write(`
                        <html>
                          <head>
                            <title>Submission Print</title>
                            <style>
                              body {
                                font-family: sans-serif;
                                padding: 20px;
                                background-color: white;
                              }
                              table {
                                width: 100%;
                                border-collapse: collapse;
                                font-size: 14px;
                              }
   td {
  padding: 10px;
  vertical-align: top;
  border: 1px solid #ccc;
  word-break: break-word;
}

td:nth-child(1) {
  background-color: #f0f0f0; /* light gray */
}
                            </style>
                          </head>
                          <body>
                      `);

                        printWindow.document.write(content);
                        printWindow.document.write("</body></html>");
                        printWindow.document.close();
                        printWindow.print();
                      }}
                      className="flex items-center justify-center px-2 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      <IoPrintSharp /> <span>Print</span>
                    </button>
                    <button
                      onClick={() => setViewModalData(null)}
                      className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Form Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-collapse border-gray-300 table-auto">
                    <tbody>
                      {/* Standard fields */}
                      <tr className="border-b">
                        <td className="p-2 font-bold text-gray-600 border-r max-w-[350px] break-words whitespace-normal align-top">
                          Start Time
                        </td>
                        <td className="p-2 text-gray-900">
                          {formatDateTime(viewModalData?.start) || ""}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-bold text-gray-600 border-r max-w-[350px] break-words whitespace-normal align-top">
                          End Time
                        </td>
                        <td className="p-2 text-gray-900">
                          {formatDateTime(viewModalData?.end) || ""}
                        </td>
                      </tr>

                      {/* Question fields */}
                      {visibleFields
                        .filter(
                          (fieldName) =>
                            fieldName !== "start" &&
                            fieldName !== "end" &&
                            fieldName !== "uuid" &&
                            !fieldName.includes("meta.instanceID")
                        )
                        .map((fieldName) => (
                          <tr key={fieldName} className="border-b">
                            <td className="p-2 font-bold text-gray-600 border-r max-w-[350px] break-words whitespace-normal align-top">
                              {getFieldLabel(fieldName)}
                            </td>
                            <td className="p-2 text-gray-900">
                              {typeof viewModalData[fieldName] === "object" &&
                              viewModalData[fieldName] !== null
                                ? Object.entries(viewModalData[fieldName])
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")
                                : viewModalData[fieldName] ?? ""}
                            </td>
                          </tr>
                        ))}

                      <tr className="border-b">
                        <td className="p-2 font-bold text-gray-600 border-r">
                          UUID
                        </td>
                        <td className="p-2 text-gray-900">
                          {viewModalData?.["meta.instanceID"] ||
                            viewModalData?.uuid ||
                            "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {imageModalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="flex flex-col w-full max-w-xl gap-2 p-4 bg-white rounded shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-800">
                    {imageModalData.filename}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(imageModalData.filename)}
                      className="flex items-center justify-center p-2 text-xl text-blue-600 bg-blue-200 rounded-lg hover:text-blue-900"
                      title="Download"
                    >
                      <MdDownload className="w-7 h-7" />{" "}
                      <span className="text-[16px]">Download</span>
                    </button>
                    <button
                      onClick={() => setImageModalData(null)}
                      className="p-2 text-xl text-red-700 bg-red-200 rounded-lg hover:text-red-900"
                      title="Close"
                    >
                      <RxCross2 className="w-7 h-7" />
                    </button>
                  </div>
                </div>
                <img
                  src={imageModalData.url}
                  alt="Submission"
                  className="w-full h-auto max-h-[80vh] object-contain rounded"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal - outside loading check */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm p-6 m-4 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <RxCross2 className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600">
                Are you sure you want to delete this submission? This action
                cannot be undone.
              </p>
              <div className="p-3 mt-3 rounded bg-gray-50">
                <p className="text-sm text-gray-700">
                  <strong>Instance ID:</strong>{" "}
                  {deleteConfirm?.["meta.instanceID"] ||
                    deleteConfirm?.uuid ||
                    "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 transition-colors bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubmission(deleteConfirm)}
                className="px-4 py-2 text-white transition-colors bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
