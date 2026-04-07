import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { FcGenericSortingAsc, FcGenericSortingDesc } from "react-icons/fc";
import { LuArrowUpDown } from "react-icons/lu";
import {
  FaFileExcel,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { BACKEND_URL } from "../../../config";

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
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [allAvailableFields, setAllAvailableFields] = useState([]);
  const [followupFilter, setFollowupFilter] = useState("all");
  const [availableFollowupForms, setAvailableFollowupForms] = useState([]);
  const [selectedFollowupForms, setSelectedFollowupForms] = useState([]);
  const [fieldLabels, setFieldLabels] = useState({});
  const [selectedInstanceIds, setSelectedInstanceIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fullDownloadResetTimerRef = useRef(null);
  const FULL_DOWNLOAD_MAX_WAIT_MS = 12 * 60 * 1000;

  const SUSPECTED_DISEASE_SPLIT_FIELDS = [
    "suspected_disease_dengue",
    "suspected_disease_awd",
    "suspected_disease_malaria",
  ];

  const WHAT_TYPES_SPLIT_FIELDS = [
    "what_types_flood",
    "what_types_cyclone",
    "what_types_heavy_rainfall",
    "what_types_drought",
    "what_types_landslides",
    "what_types_others",
  ];

  const FOLLOWUP_DISEASE_SPLIT_FIELDS = [
    "followup_disease_dengue",
    "followup_disease_awd",
    "followup_disease_malaria",
    "followup_disease_others",
    "followup_disease_not_diagonosd",
  ];

  // Default table/download columns in the exact order requested for All Rows.
  const defaultSelectedColumns = [
    "row_number",
    "date",
    "start",
    "end",
    "name_of_staff",
    "organization",
    "designation_1",
    "reporting_sites",
    "total_reporting_sites",
    "division",
    "district",
    "upazila",
    "union",
    "city_corporation",
    "ward",
    "ward_1",
    "area",
    "location",
    "hh_id",
    "hh_head_name",
    "suspected_in_the_disease",
    "name_of_the_person_with_suspected_case",
    "mobile_number",
    "patient_id_type",
    "user_identification_11_9943_01976848561",
    "age_year",
    "age_month",
    "age",
    "sex",
    "pregnent",
    "suspected_disease_dengue",
    "suspected_disease_awd",
    "suspected_disease_malaria",
    "no._of_already_diagnosed_cases_of_dengue_in_the_hh_1",
    "no._of_already_diagnosed_cases_of_malaria_in_the_hh",
    "no._of_already_diagnosed_cases_of_awd_in_the_hh",
    "referred",
    "referral_place",
    "if_referred_to_govt",
    "bed_net_use_practice_during_sleep",
    "handwashing_practice_with_soap__water",
    "type_latrine_use",
    "presence_of_stagnant_water_mosquito_breeding_sites",
    "presence_of_mosquito_larvae",
    "did_any_disaster_occur_in_last_7_days_",
    ...WHAT_TYPES_SPLIT_FIELDS,
    "remarks",
    "followup_follow_up_date",
    "followup_start",
    "followup_end",
    "followup_follow_up_status_2472_h",
    "followup_suspected_in_the_disease",
    ...FOLLOWUP_DISEASE_SPLIT_FIELDS,
    "followup_hh_head_name",
    "followup_hh_id",
    "_id",
    "_version",
    "group_name",
    "formType",
    "submitted_by",
  ];

  // Keep requested columns first; show any other fields after these.
  const dataCollectionFieldOrder = [
    ...defaultSelectedColumns,
    "Validation",
    "has_followup",
    "followup_count",
    "followup_forms",
    "followup_details",
    "instanceID",
    "start",
    "end",
  ];

  const REQUIRED_VISIBLE_LOGICAL_COLUMNS = [
    "mobile_number",
    "patient_id_type",
    "user_identification_11_9943_01976848561",
    "age_year",
    "age_month",
    "sex",
  ];

  const requestedColumnLabels = {
    row_number: "Row Number",
    date: "date",
    start: "start",
    end: "end",
    name_of_staff: "name of staff",
    organization: "organization",
    designation_1: "designation 1",
    reporting_sites: "reporting sites",
    total_reporting_sites: "total reporting sites",
    division: "division",
    district: "district",
    upazila: "upazila",
    union: "union",
    ward: "ward",
    city_corporation: "city corporation",
    ward_1: "ward 1",
    area: "area",
    location: "location",
    hh_id: "hh id",
    hh_head_name: "hh head name",
    suspected_in_the_disease: "suspected in the disease",
    name_of_the_person_with_suspected_case:
      "name of the person with suspected case",
    mobile_number: "mobile number",
    patient_id_type: "patient id type",
    user_identification_11_9943_01976848561: "user identification",
    age_year: "Year",
    age_month: "Month",
    age: "age",
    sex: "sex",
    pregnent: "pregnent",
    suspected_disease_dengue: "Suspected Disease: Dengue",
    suspected_disease_awd: "Suspected Disease: AWD",
    suspected_disease_malaria: "Suspected Disease: Malaria",
    "no._of_already_diagnosed_cases_of_dengue_in_the_hh_1":
      "No. of already diagnosed cases of Dengue in the HH",
    "no._of_already_diagnosed_cases_of_malaria_in_the_hh":
      "No. of already diagnosed cases of Malaria in the HH",
    "no._of_already_diagnosed_cases_of_awd_in_the_hh":
      "No. of already diagnosed cases of AWD in the HH",
    referred: "referred",
    referral_place: "referral place",
    if_referred_to_govt: "if referred to govt",
    bed_net_use_practice_during_sleep: "bed net use practice during sleep",
    handwashing_practice_with_soap__water:
      "handwashing practice with soap  water",
    type_latrine_use: "type latrine use",
    presence_of_stagnant_water_mosquito_breeding_sites:
      "presence of stagnant water mosquito breeding sites",
    presence_of_mosquito_larvae: "presence of mosquito larvae",
    did_any_disaster_occur_in_last_7_days_:
      "did any disaster occur in last 7 days",
    what_types_flood: "What Types: Flood",
    what_types_cyclone: "What Types: Cyclone",
    what_types_heavy_rainfall: "What Types: Heavy rainfall",
    what_types_drought: "What Types: Drought",
    what_types_landslides: "What Types: Landslides",
    what_types_others: "What Types: Others",
    remarks: "Remarks",
    followup_follow_up_date: "Follow-up Date",
    followup_start: "Follow-up start",
    followup_end: "Follow-up end",
    followup_follow_up_status_2472_h: "Follow-up Status (24-72h)",
    followup_suspected_in_the_disease: "Follow-up: Suspected Disease",
    followup_disease_dengue: "Follow-up Disease: Dengue",
    followup_disease_awd: "Follow-up Disease: AWD",
    followup_disease_malaria: "Follow-up Disease: Malaria",
    followup_disease_others: "Follow-up Disease: Others",
    followup_disease_not_diagonosd: "Follow-up Disease: Not diagnosed",
    followup_hh_head_name: "Follow-up: Household Head Name",
    followup_hh_id: "Follow-up: Household ID",
    _id: "ID",
    _version: "Version",
    group_name: "Group Name",
    formType: "Form Type",
    submitted_by: "Submitted By",
  };

  const resolveFieldAlias = (allFields, logicalField) => {
    if (!Array.isArray(allFields) || !logicalField) {
      return null;
    }

    if (allFields.includes(logicalField)) {
      return logicalField;
    }

    const suffix = `_${logicalField}`;
    const matches = allFields.filter((field) => {
      if (typeof field !== "string" || !field.endsWith(suffix)) {
        return false;
      }
      if (!logicalField.startsWith("followup_") && field.startsWith("followup_")) {
        return false;
      }
      return true;
    });

    if (matches.length === 0) {
      return null;
    }
    if (matches.length === 1) {
      return matches[0];
    }

    return [...matches].sort(
      (a, b) => a.length - b.length || a.localeCompare(b)
    )[0];
  };

  // Function to order fields properly: data collection fields first, then followup fields
  const getOrderedFields = (allFields) => {
    const uniqueFields = [...new Set(allFields)];
    const orderedFields = [];

    // Add data collection fields in the specified order
    for (const field of dataCollectionFieldOrder) {
      const resolvedField = resolveFieldAlias(uniqueFields, field);
      if (resolvedField && !orderedFields.includes(resolvedField)) {
        orderedFields.push(resolvedField);
      }
    }

    // Add any remaining data collection fields that weren't in the predefined list
    const remainingDcFields = uniqueFields.filter(
      (f) => !orderedFields.includes(f) && !f.startsWith("followup_")
    );
    orderedFields.push(...remainingDcFields.sort());

    // Add followup fields at the end, sorted by form name
    const followupFields = uniqueFields.filter(
      (f) => !orderedFields.includes(f) && f.startsWith("followup_")
    );
    orderedFields.push(...followupFields.sort());

    return orderedFields;
  };

  // Table must stop at "Submitted By" and not render trailing follow-up helper columns.
  const getTableFields = (allFields) => {
    const ordered = getOrderedFields(allFields);
    const submittedByIndex = ordered.indexOf("submitted_by");
    if (submittedByIndex === -1) {
      return ordered;
    }
    return ordered.slice(0, submittedByIndex + 1);
  };

  const resolveRequiredVisibleFields = (allFields) =>
    REQUIRED_VISIBLE_LOGICAL_COLUMNS.map((logicalField) =>
      resolveFieldAlias(allFields, logicalField)
    ).filter(Boolean);

  const ensureRequiredVisibleFields = (fields, allFields) => {
    const availableFields = Array.isArray(allFields) ? allFields : [];
    const merged = [...new Set((fields || []).filter((field) => availableFields.includes(field)))];

    resolveRequiredVisibleFields(availableFields).forEach((requiredField) => {
      if (!merged.includes(requiredField)) {
        merged.push(requiredField);
      }
    });

    return getOrderedFields(merged);
  };

  // Function to get field label for display, fallback to field name
  const getFieldLabel = (fieldName) => {
    if (
      typeof fieldName === "string" &&
      fieldName.includes("user_identification_11_9943_01976848561")
    ) {
      return "user identification";
    }
    if (requestedColumnLabels[fieldName]) {
      return requestedColumnLabels[fieldName];
    }
    return fieldLabels[fieldName] || fieldName.replace(/_/g, " ");
  };

  const estimateWidthFromHeader = (fieldName) => {
    const label = String(getFieldLabel(fieldName) || fieldName || "");
    const words = label.split(/\s+/).filter(Boolean);
    const longestWordLength = words.reduce(
      (max, word) => Math.max(max, word.length),
      0
    );

    const textWidthEstimate = Math.ceil(label.length * 7.2) + 48;
    const longestWordWidthEstimate = Math.ceil(longestWordLength * 8.4) + 56;

    return Math.min(
      700,
      Math.max(140, textWidthEstimate, longestWordWidthEstimate)
    );
  };

  const getColumnWidth = (fieldName) => {
    const autoWidth = estimateWidthFromHeader(fieldName);
    const manualWidth = columnWidths[fieldName];

    if (typeof manualWidth === "number" && !Number.isNaN(manualWidth)) {
      // Do not allow shrinking below header text width to prevent overlap.
      return Math.max(manualWidth, autoWidth);
    }

    return autoWidth;
  };

  const normalizeBinary = (value) => {
    const normalized = String(value ?? "")
      .trim()
      .toLowerCase();

    if (!normalized) return "";
    if (
      normalized === "yes" ||
      normalized === "true" ||
      normalized === "1" ||
      normalized === "y" ||
      normalized === "হ্যাঁ"
    ) {
      return "yes";
    }
    if (
      normalized === "no" ||
      normalized === "false" ||
      normalized === "0" ||
      normalized === "n" ||
      normalized === "না"
    ) {
      return "no";
    }
    return "";
  };

  const isAffirmative = (value) => normalizeBinary(value) === "yes";

  const resolveFirstNonEmpty = (sourceRow, candidateKeys) =>
    candidateKeys
      .map((key) => sourceRow[key])
      .find((value) => String(value ?? "").trim() !== "");

  const resolveValueBySuffix = (sourceRow, logicalField) => {
    const suffix = `_${logicalField}`;
    const dynamicCandidateKeys = Object.keys(sourceRow || {})
      .filter((key) => {
        if (typeof key !== "string" || key === logicalField) {
          return false;
        }
        if (!key.endsWith(suffix)) {
          return false;
        }
        // Avoid mixing follow-up values into data-collection columns.
        if (!logicalField.startsWith("followup_") && key.startsWith("followup_")) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.length - b.length || a.localeCompare(b));

    return resolveFirstNonEmpty(sourceRow, dynamicCandidateKeys);
  };

  const resolveCanonicalValue = (sourceRow, logicalField, extraCandidates = []) => {
    const directValue = resolveFirstNonEmpty(sourceRow, [
      logicalField,
      ...extraCandidates,
    ]);
    if (String(directValue ?? "").trim() !== "") {
      return directValue;
    }
    return resolveValueBySuffix(sourceRow, logicalField);
  };

  const setIfPresent = (targetRow, fieldName, fieldValue) => {
    if (String(fieldValue ?? "").trim() !== "") {
      targetRow[fieldName] = fieldValue;
    }
  };

  const matchesAny = (text, markers) =>
    Boolean(text) && markers.some((marker) => text.includes(marker));

  const applyDerivedColumns = (row) => {
    const nextRow = { ...row };
    const divisionValue = String(nextRow.division ?? "").trim();
    const cityCorporationValue = String(nextRow.city_corporation ?? "").trim();
    nextRow.total_reporting_sites = [divisionValue, cityCorporationValue]
      .filter(Boolean)
      .join(" / ");

    const diseaseSourceCandidates = [
      "suspected_disease",
      "suspected_patient-related_information_suspected_disease",
      "if_yes__name_of_the_diseases_1",
      "administrative_suspected_disease",
    ];

    const dynamicDiseaseKey = Object.keys(nextRow).find(
      (key) =>
        key !== "suspected_disease" &&
        key.endsWith("_suspected_disease") &&
        nextRow[key]
    );
    if (dynamicDiseaseKey) {
      diseaseSourceCandidates.push(dynamicDiseaseKey);
    }

    const diseaseValue = resolveFirstNonEmpty(nextRow, diseaseSourceCandidates);
    const diseaseText = String(diseaseValue ?? "").toLowerCase();

    const currentFlags = {
      dengue: normalizeBinary(nextRow.suspected_disease_dengue),
      awd: normalizeBinary(nextRow.suspected_disease_awd),
      malaria: normalizeBinary(nextRow.suspected_disease_malaria),
    };

    const inferredFlags = { dengue: "", awd: "", malaria: "" };
    if (String(diseaseValue ?? "").trim()) {
      inferredFlags.dengue = matchesAny(diseaseText, [
        "dengue",
        "ডেঙ্গু",
      ])
        ? "yes"
        : "no";
      inferredFlags.awd = matchesAny(diseaseText, [
        "awd",
        "acute watery diarrhea",
        "diarrhea",
        "diarrhoea",
        "ডায়রিয়া",
        "ডায়রিয়া",
        "ডায়রিয়া",
        "ডায়রিয়া",
      ])
        ? "yes"
        : "no";
      inferredFlags.malaria = matchesAny(diseaseText, [
        "malaria",
        "ম্যালেরিয়া",
        "ম্যালেরিয়া",
      ])
        ? "yes"
        : "no";
    }

    const suspectedYes = isAffirmative(nextRow.suspected_in_the_disease);
    const resolvedFlags = {
      dengue: inferredFlags.dengue || currentFlags.dengue,
      awd: inferredFlags.awd || currentFlags.awd,
      malaria: inferredFlags.malaria || currentFlags.malaria,
    };

    nextRow.suspected_disease_dengue =
      resolvedFlags.dengue || (suspectedYes ? "" : "no");
    nextRow.suspected_disease_awd = resolvedFlags.awd || (suspectedYes ? "" : "no");
    nextRow.suspected_disease_malaria =
      resolvedFlags.malaria || (suspectedYes ? "" : "no");

    const whatTypeSourceCandidates = [
      "what_types",
      "administrative_what_types",
    ];
    Object.keys(nextRow).forEach((key) => {
      if (
        key !== "what_types" &&
        key.endsWith("_what_types") &&
        String(nextRow[key] ?? "").trim()
      ) {
        whatTypeSourceCandidates.push(key);
      }
    });

    const whatTypesValue = resolveFirstNonEmpty(nextRow, whatTypeSourceCandidates);
    const whatTypesText = String(whatTypesValue ?? "").toLowerCase();
    const currentWhatTypeFlags = {
      flood: normalizeBinary(nextRow.what_types_flood),
      cyclone: normalizeBinary(nextRow.what_types_cyclone),
      heavy_rainfall: normalizeBinary(nextRow.what_types_heavy_rainfall),
      drought: normalizeBinary(nextRow.what_types_drought),
      landslides: normalizeBinary(nextRow.what_types_landslides),
      others: normalizeBinary(nextRow.what_types_others),
    };
    const inferredWhatTypeFlags = { ...currentWhatTypeFlags };
    if (String(whatTypesValue ?? "").trim()) {
      inferredWhatTypeFlags.flood = matchesAny(whatTypesText, ["flood", "বন্যা"])
        ? "yes"
        : "no";
      inferredWhatTypeFlags.cyclone = matchesAny(whatTypesText, [
        "cyclone",
        "সাইক্লোন",
      ])
        ? "yes"
        : "no";
      inferredWhatTypeFlags.heavy_rainfall = matchesAny(whatTypesText, [
        "heavy_rainfall",
        "heavy rainfall",
        "অতিবৃষ্টি",
      ])
        ? "yes"
        : "no";
      inferredWhatTypeFlags.drought = matchesAny(whatTypesText, ["drought", "খরা"])
        ? "yes"
        : "no";
      inferredWhatTypeFlags.landslides = matchesAny(whatTypesText, [
        "landslides",
        "landslide",
        "ভূমিধ্বস",
      ])
        ? "yes"
        : "no";
      inferredWhatTypeFlags.others = matchesAny(whatTypesText, [
        "others",
        "other",
        "অন্যান্য",
      ])
        ? "yes"
        : "no";
    }

    const disasterYes = isAffirmative(nextRow.did_any_disaster_occur_in_last_7_days_);
    nextRow.what_types_flood = inferredWhatTypeFlags.flood || (disasterYes ? "" : "no");
    nextRow.what_types_cyclone =
      inferredWhatTypeFlags.cyclone || (disasterYes ? "" : "no");
    nextRow.what_types_heavy_rainfall =
      inferredWhatTypeFlags.heavy_rainfall || (disasterYes ? "" : "no");
    nextRow.what_types_drought =
      inferredWhatTypeFlags.drought || (disasterYes ? "" : "no");
    nextRow.what_types_landslides =
      inferredWhatTypeFlags.landslides || (disasterYes ? "" : "no");
    nextRow.what_types_others =
      inferredWhatTypeFlags.others || (disasterYes ? "" : "no");

    const followupDiseaseSourceCandidates = [
      "followup_if_yes__name_of_the_diseases_1",
      "if_yes__name_of_the_diseases_1",
    ];
    Object.keys(nextRow).forEach((key) => {
      if (
        key !== "followup_if_yes__name_of_the_diseases_1" &&
        key.startsWith("followup_") &&
        key.endsWith("_if_yes__name_of_the_diseases_1") &&
        String(nextRow[key] ?? "").trim()
      ) {
        followupDiseaseSourceCandidates.push(key);
      }
    });

    const followupDiseaseValue = resolveFirstNonEmpty(
      nextRow,
      followupDiseaseSourceCandidates
    );
    const followupDiseaseText = String(followupDiseaseValue ?? "").toLowerCase();
    const currentFollowupDiseaseFlags = {
      dengue: normalizeBinary(nextRow.followup_disease_dengue),
      awd: normalizeBinary(nextRow.followup_disease_awd),
      malaria: normalizeBinary(nextRow.followup_disease_malaria),
      others: normalizeBinary(nextRow.followup_disease_others),
      not_diagonosd: normalizeBinary(nextRow.followup_disease_not_diagonosd),
    };
    const inferredFollowupDiseaseFlags = { ...currentFollowupDiseaseFlags };
    if (String(followupDiseaseValue ?? "").trim()) {
      inferredFollowupDiseaseFlags.dengue = matchesAny(followupDiseaseText, [
        "dengue",
        "ডেঙ্গু",
      ])
        ? "yes"
        : "no";
      inferredFollowupDiseaseFlags.awd = matchesAny(followupDiseaseText, [
        "awd",
        "acute watery diarrhea",
        "diarrhea",
        "diarrhoea",
        "ডায়রিয়া",
        "ডায়রিয়া",
        "ডায়রিয়া",
        "ডায়রিয়া",
      ])
        ? "yes"
        : "no";
      inferredFollowupDiseaseFlags.malaria = matchesAny(followupDiseaseText, [
        "malaria",
        "ম্যালেরিয়া",
        "ম্যালেরিয়া",
      ])
        ? "yes"
        : "no";
      inferredFollowupDiseaseFlags.others = matchesAny(followupDiseaseText, [
        "others",
        "other",
        "অন্যান্য",
      ])
        ? "yes"
        : "no";
      inferredFollowupDiseaseFlags.not_diagonosd = matchesAny(
        followupDiseaseText,
        ["not_diagonosd", "not diagonosd", "not diagnosed", "নির্ণয়"]
      )
        ? "yes"
        : "no";
    }

    const followupSuspectedYes = isAffirmative(
      nextRow.followup_suspected_in_the_disease
    );
    nextRow.followup_disease_dengue =
      inferredFollowupDiseaseFlags.dengue || (followupSuspectedYes ? "" : "no");
    nextRow.followup_disease_awd =
      inferredFollowupDiseaseFlags.awd || (followupSuspectedYes ? "" : "no");
    nextRow.followup_disease_malaria =
      inferredFollowupDiseaseFlags.malaria || (followupSuspectedYes ? "" : "no");
    nextRow.followup_disease_others =
      inferredFollowupDiseaseFlags.others || (followupSuspectedYes ? "" : "no");
    nextRow.followup_disease_not_diagonosd =
      inferredFollowupDiseaseFlags.not_diagonosd ||
      (followupSuspectedYes ? "" : "no");

    // Normalize patient-related fields so mandatory columns can read values from
    // grouped keys (e.g. suspected_patient-related_information_*).
    setIfPresent(
      nextRow,
      "mobile_number",
      resolveCanonicalValue(nextRow, "mobile_number", [
        "suspected_patient-related_information_mobile_number",
      ])
    );
    setIfPresent(
      nextRow,
      "patient_id_type",
      resolveCanonicalValue(nextRow, "patient_id_type", [
        "suspected_patient-related_information_patient_id_type",
      ])
    );
    setIfPresent(
      nextRow,
      "user_identification_11_9943_01976848561",
      resolveCanonicalValue(
        nextRow,
        "user_identification_11_9943_01976848561",
        [
          "suspected_patient-related_information_user_identification_11_9943_01976848561",
        ]
      )
    );
    setIfPresent(
      nextRow,
      "sex",
      resolveCanonicalValue(nextRow, "sex", [
        "suspected_patient-related_information_sex",
      ])
    );
    setIfPresent(
      nextRow,
      "age",
      resolveCanonicalValue(nextRow, "age", [
        "suspected_patient-related_information_age",
      ])
    );
    setIfPresent(
      nextRow,
      "age_year",
      resolveCanonicalValue(nextRow, "age_year", [
        "suspected_patient-related_information_age_year",
      ])
    );
    setIfPresent(
      nextRow,
      "age_month",
      resolveCanonicalValue(nextRow, "age_month", [
        "suspected_patient-related_information_age_month",
      ])
    );

    // Older forms store only a single "age" field. Backfill age_year from it.
    if (
      String(nextRow.age_year ?? "").trim() === "" &&
      String(nextRow.age ?? "").trim() !== ""
    ) {
      nextRow.age_year = nextRow.age;
    }
    if (
      String(nextRow.age ?? "").trim() === "" &&
      String(nextRow.age_year ?? "").trim() !== ""
    ) {
      nextRow.age = nextRow.age_year;
    }

    return nextRow;
  };

  const processRowsForView = (rows = []) =>
    rows.map((row) => applyDerivedColumns(row));

  const withDerivedFieldLabels = (labels = {}) => {
    const updatedLabels = { ...labels };
    updatedLabels.suspected_disease_dengue = "Suspected Disease: Dengue";
    updatedLabels.suspected_disease_awd = "Suspected Disease: AWD";
    updatedLabels.suspected_disease_malaria = "Suspected Disease: Malaria";
    updatedLabels.what_types_flood = "What Types: Flood";
    updatedLabels.what_types_cyclone = "What Types: Cyclone";
    updatedLabels.what_types_heavy_rainfall = "What Types: Heavy rainfall";
    updatedLabels.what_types_drought = "What Types: Drought";
    updatedLabels.what_types_landslides = "What Types: Landslides";
    updatedLabels.what_types_others = "What Types: Others";
    updatedLabels.followup_disease_dengue = "Follow-up Disease: Dengue";
    updatedLabels.followup_disease_awd = "Follow-up Disease: AWD";
    updatedLabels.followup_disease_malaria = "Follow-up Disease: Malaria";
    updatedLabels.followup_disease_others = "Follow-up Disease: Others";
    updatedLabels.followup_disease_not_diagonosd =
      "Follow-up Disease: Not diagnosed";
    delete updatedLabels.suspected_disease;
    delete updatedLabels.what_types;
    delete updatedLabels.followup_if_yes__name_of_the_diseases_1;
    return updatedLabels;
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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

  // Flatten nested object data
  const flattenFormData = (data, prefix = "") => {
    const flat = {};

    if (typeof data !== "object" || data === null) {
      return flat;
    }

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Skip meta object for now, handle it separately
          if (key !== "meta") {
            Object.assign(flat, flattenFormData(value, newKey));
          }
        } else {
          flat[newKey] = Array.isArray(value) ? JSON.stringify(value) : value;
        }
      }
    }

    // Handle meta separately
    if (data.meta) {
      const meta = data.meta;
      if (meta.instanceID) flat.instanceID = meta.instanceID;
      if (meta.submitted_by) flat.submitted_by = meta.submitted_by;
    }
    return flat;
  };

  useEffect(() => {
    const fetchAllRowsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(
          `${BACKEND_URL}/api/get-project-templates-paginated/${projectId}/`,
          {
            headers: { Authorization: `Token ${token}` },
            params: {
              page: currentPage,
              page_size: pageSize,
              followup_filter: followupFilter,
              ...(selectedFollowupForms.length > 0
                ? { followup_forms: selectedFollowupForms.join(",") }
                : {}),
            },
          }
        );

        const data = res.data;
        console.log("Paginated API response:", data);

        if (!data || !data.data) {
          console.log("No data in response");
          setAllRowsData([]);
          setTotalCount(0);
          setTotalPages(0);
          setVisibleFields([]);
          return;
        }

        // Set pagination info
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 0);

        // Keep the same row formatting as Full Data download.
        const processedData = processRowsForView(data.data || []);

        // Set the processed paginated data
        setAllRowsData(processedData);

        // Set field labels from API response
        if (data.field_labels) {
          setFieldLabels(withDerivedFieldLabels(data.field_labels));
        }

        const serverFollowupForms = Array.isArray(data.followup_forms)
          ? data.followup_forms.map((item) => ({
              id: Number(item.id),
              name: item.name,
            }))
          : [];
        setAvailableFollowupForms(serverFollowupForms);
        setSelectedFollowupForms((prev) => {
          const allowedIds = new Set(
            serverFollowupForms.map((item) => item.id)
          );
          const filtered = prev.filter((id) => allowedIds.has(id));
          if (
            filtered.length === prev.length &&
            filtered.every((value, idx) => value === prev[idx])
          ) {
            return prev;
          }
          return filtered;
        });

        // Set visible fields from processed data.
        let fieldsToSet = [];
        if (data.visible_fields) {
          fieldsToSet = [...data.visible_fields];
          const replaceFieldWithColumns = (
            sourceFields,
            originalField,
            replacementFields
          ) => {
            const nextFields = [...sourceFields];
            const index = nextFields.indexOf(originalField);
            if (index !== -1) {
              nextFields.splice(index, 1, ...replacementFields);
            }
            return nextFields;
          };

          fieldsToSet = replaceFieldWithColumns(
            fieldsToSet,
            "suspected_disease",
            SUSPECTED_DISEASE_SPLIT_FIELDS
          );
          fieldsToSet = replaceFieldWithColumns(
            fieldsToSet,
            "what_types",
            WHAT_TYPES_SPLIT_FIELDS
          );
          fieldsToSet = replaceFieldWithColumns(
            fieldsToSet,
            "followup_if_yes__name_of_the_diseases_1",
            FOLLOWUP_DISEASE_SPLIT_FIELDS
          );
        } else {
          // Fallback: Extract fields from processed rows.
          const allFields = new Set(["row_number", "group_name", "formType"]);
          processedData.forEach((row) => {
            Object.keys(row).forEach((key) => {
              allFields.add(key);
            });
          });
          fieldsToSet = Array.from(allFields);
        }

        [
          "total_reporting_sites",
          "division",
          "district",
          "upazila",
          "union",
          "city_corporation",
        ].forEach((field) => {
          if (!fieldsToSet.includes(field)) {
            fieldsToSet.push(field);
          }
        });

        // Ensure all requested columns remain available for table/download even when
        // the current page does not contain every key.
        defaultSelectedColumns.forEach((field) => {
          if (!fieldsToSet.includes(field)) {
            fieldsToSet.push(field);
          }
        });

        // Remove duplicates and apply proper ordering
        const mandatoryFields = [
          "row_number",
          "Validation",
          "_id",
          "_version",
          "group_name",
          "formType",
          "has_followup",
          "followup_count",
          "followup_forms",
          "followup_details",
        ];
        const uniqueFields = [...new Set([...fieldsToSet, ...mandatoryFields])];
        const orderedFields = getOrderedFields(uniqueFields);
        setVisibleFields(
          getTableFields(
            ensureRequiredVisibleFields(orderedFields, orderedFields)
          )
        );
        setAllAvailableFields(orderedFields);

        const availableDefaults = getOrderedFields(
          defaultSelectedColumns
            .map((col) => resolveFieldAlias(orderedFields, col))
            .filter(Boolean)
        );

        setSelectedColumns((prev) => {
          if (!prev || prev.length === 0) {
            return availableDefaults;
          }
          const cleaned = prev.filter((field) => orderedFields.includes(field));
          if (cleaned.length === 0) {
            return availableDefaults;
          }

          const merged = [...cleaned];

          const ensureColumnsPresent = (logicalColumns) => {
            logicalColumns.forEach((logicalField) => {
              const resolvedField = resolveFieldAlias(orderedFields, logicalField);
              if (resolvedField && !merged.includes(resolvedField)) {
                merged.push(resolvedField);
              }
            });
          };

          // Always keep these geo columns for this table/download.
          ensureColumnsPresent(["division", "district", "upazila", "union"]);

          // Always keep requested patient columns after mobile number in default ordering.
          ensureColumnsPresent([
            "mobile_number",
            "patient_id_type",
            "user_identification_11_9943_01976848561",
            "age_year",
            "age_month",
            "sex",
          ]);

          // Backfill newly introduced follow-up timing columns for existing
          // in-session selections that already include Follow-up Date/Status.
          const followupDateField =
            resolveFieldAlias(orderedFields, "followup_follow_up_date") ||
            "followup_follow_up_date";
          const followupStatusField =
            resolveFieldAlias(orderedFields, "followup_follow_up_status_2472_h") ||
            "followup_follow_up_status_2472_h";

          const shouldBackfillFollowupTiming =
            merged.includes(followupDateField) &&
            merged.includes(followupStatusField);

          if (shouldBackfillFollowupTiming) {
            ["followup_start", "followup_end"].forEach((logicalField) => {
              const resolvedField = resolveFieldAlias(orderedFields, logicalField);
              if (resolvedField && !merged.includes(resolvedField)) {
                merged.push(resolvedField);
              }
            });
          }

          return getOrderedFields(merged);
        });
      } catch (err) {
        console.error("Error fetching paginated data:", err);

        // More specific error handling
        if (err.response?.status === 404) {
          setError("Project not found");
        } else if (err.response?.status === 403) {
          setError("Access denied");
        } else if (err.response?.status === 500) {
          setError("Server error");
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
  }, [
    projectId,
    currentPage,
    pageSize,
    followupFilter,
    selectedFollowupForms,
    refreshKey,
  ]);

  // Keep table columns aligned with Download Full Data column selection/order.
  useEffect(() => {
    if (selectedColumns.length === 0) {
      return;
    }
    const syncedFields = ensureRequiredVisibleFields(
      selectedColumns.filter((field) => allAvailableFields.includes(field)),
      allAvailableFields
    );
    const normalizedFields = getTableFields(
      syncedFields
    );
    if (normalizedFields.length > 0) {
      setVisibleFields(normalizedFields);
    }
  }, [selectedColumns, allAvailableFields]);

  // Reset pagination when follow-up filters change.
  // Keep selected/download columns unchanged so the same format is preserved.
  useEffect(() => {
    setCurrentPage(1);
  }, [followupFilter, selectedFollowupForms]);

  useEffect(() => {
    return () => {
      if (fullDownloadResetTimerRef.current) {
        window.clearTimeout(fullDownloadResetTimerRef.current);
      }
    };
  }, []);

  const toggleFollowupForm = (formId) => {
    setSelectedFollowupForms((prev) => {
      if (prev.includes(formId)) {
        return prev.filter((id) => id !== formId);
      }
      return [...prev, formId];
    });
  };

  const getFieldDisplayValue = (row, field) => {
    const value = row[field];
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    if (value && typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (err) {
        return String(value);
      }
    }
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  };

  const getRowInstanceId = (row) => {
    const rawValue = row?.instanceID ?? row?.["meta.instanceID"] ?? row?.uuid;
    if (rawValue === null || rawValue === undefined) {
      return "";
    }
    return String(rawValue).trim();
  };

  // Apply filters (only on current page data)
  const filteredData = allRowsData.filter((row) => {
    // Global search
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchesGlobal = visibleFields.some((field) =>
        getFieldDisplayValue(row, field).toLowerCase().includes(searchLower)
      );
      if (!matchesGlobal) return false;
    }

    // Column-specific search
    return visibleFields.every((field) => {
      const term = searchTerms[field]?.toLowerCase() || "";
      if (!term) return true;
      return getFieldDisplayValue(row, field).toLowerCase().includes(term);
    });
  });

  const selectedInstanceIdSet = new Set(selectedInstanceIds);
  const visibleSelectableInstanceIds = filteredData
    .map((row) => getRowInstanceId(row))
    .filter(Boolean);
  const selectedVisibleCount = visibleSelectableInstanceIds.filter((id) =>
    selectedInstanceIdSet.has(id)
  ).length;
  const allVisibleSelected =
    visibleSelectableInstanceIds.length > 0 &&
    selectedVisibleCount === visibleSelectableInstanceIds.length;

  // Handle group name click to show detailed view
  const handleGroupClick = async (groupName) => {
    // Since we're using paginated data, we need to fetch the full group details
    // For now, we'll show a simplified view
    console.log("Group clicked:", groupName);
    // TODO: Implement detailed group view for paginated data
  };

  // Sorting (client-side for current page)
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

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const toggleRowSelection = (instanceId, checked) => {
    if (!instanceId) {
      return;
    }
    setSelectedInstanceIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(instanceId);
      } else {
        next.delete(instanceId);
      }
      return Array.from(next);
    });
  };

  const toggleSelectAllVisible = (checked) => {
    setSelectedInstanceIds((prev) => {
      const next = new Set(prev);
      visibleSelectableInstanceIds.forEach((instanceId) => {
        if (checked) {
          next.add(instanceId);
        } else {
          next.delete(instanceId);
        }
      });
      return Array.from(next);
    });
  };

  const handleBulkDeleteSelected = async () => {
    if (selectedInstanceIds.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "No rows selected",
        text: "Please select at least one submission to delete.",
        confirmButtonColor: "#2563EB",
      });
      return;
    }

    const selectedCount = selectedInstanceIds.length;
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete selected submissions?",
      text: `You are about to delete ${selectedCount} submission${
        selectedCount > 1 ? "s" : ""
      }.`,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setBulkDeleting(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.post(
        `${BACKEND_URL}/api/projects/${projectId}/submissions/soft-delete-bulk/`,
        { instance_ids: selectedInstanceIds },
        { headers: { Authorization: `Token ${token}` } }
      );

      const deletedCount = Number(response?.data?.deleted_count || 0);
      if (deletedCount > 0) {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: `Successfully deleted ${deletedCount} submission${
            deletedCount > 1 ? "s" : ""
          }.`,
          confirmButtonColor: "#16A34A",
        });
      } else {
        await Swal.fire({
          icon: "info",
          title: "No matching submissions",
          text: "No matching active submissions were found.",
          confirmButtonColor: "#2563EB",
        });
      }

      setSelectedInstanceIds([]);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error bulk deleting submissions:", err);
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: "Failed to delete selected submissions. Please try again.",
        confirmButtonColor: "#DC2626",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Download current page with selected columns
  const downloadCurrentPage = async () => {
    if (filteredData.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloadingRows(true);
    try {
      const cleanedData = filteredData.map((row, index) => {
        const cleanRow = { row_index: row.row_index || index + 1 };
        selectedColumns.forEach((field) => {
          if (visibleFields.includes(field)) {
            const fieldLabel = getFieldLabel(field);
            if (typeof row[field] === "object" && row[field] !== null) {
              cleanRow[fieldLabel] = JSON.stringify(row[field]);
            } else {
              cleanRow[fieldLabel] = getFieldDisplayValue(row, field);
            }
          }
        });
        return cleanRow;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Current_Page");
      const fileName = `project_${projectId}_page_${currentPage}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(workbook, fileName);

      alert(
        `Successfully downloaded ${cleanedData.length} records from page ${currentPage}!`
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file. Please try again.");
    } finally {
      setDownloadingRows(false);
    }
  };

  // Download all data with selected columns
  const buildFullDownloadUrl = () => {
    const params = new URLSearchParams();
    if (selectedColumns.length > 0) {
      const uniqueSelectedColumns = [...new Set(selectedColumns)];
      params.set("selected_fields", uniqueSelectedColumns.join(","));
    }
    params.set("followup_filter", followupFilter || "all");
    params.set("force_fresh", "1");
    params.set("_ts", Date.now().toString());

    return `${BACKEND_URL}/api/get-project-templates-full-xlsx/${projectId}/?${params.toString()}`;
  };

  const downloadFullData = async () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column to download.");
      return;
    }

    if (fullDownloadResetTimerRef.current) {
      window.clearTimeout(fullDownloadResetTimerRef.current);
      fullDownloadResetTimerRef.current = null;
    }

    setDownloadingFull(true);
    try {
      const downloadUrl = buildFullDownloadUrl();
      const frameId = `full-xlsx-download-frame-${projectId}`;
      let iframe = document.getElementById(frameId);

      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = frameId;
        iframe.style.display = "none";
        document.body.appendChild(iframe);
      }

      let requestStarted = false;
      const cleanupDownloadState = () => {
        if (fullDownloadResetTimerRef.current) {
          window.clearTimeout(fullDownloadResetTimerRef.current);
          fullDownloadResetTimerRef.current = null;
        }
        setDownloadingFull(false);
      };

      iframe.onload = () => {
        if (!requestStarted) {
          return;
        }
        cleanupDownloadState();
        setShowDownloadModal(false);
        iframe.onload = null;
        iframe.onerror = null;
      };

      iframe.onerror = () => {
        if (!requestStarted) {
          return;
        }
        cleanupDownloadState();
        alert("Could not start full data download. Please try again.");
        iframe.onload = null;
        iframe.onerror = null;
      };

      fullDownloadResetTimerRef.current = window.setTimeout(() => {
        cleanupDownloadState();
      }, FULL_DOWNLOAD_MAX_WAIT_MS);

      requestStarted = true;
      iframe.setAttribute("src", downloadUrl);
    } catch (error) {
      console.error("Error downloading full data:", error);
      alert("Could not start full data download. Please try again.");
      setDownloadingFull(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg text-gray-600">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded">
        Error: {error}
      </div>
    );
  }

  const requiredVisibleFieldSet = new Set(
    resolveRequiredVisibleFields(allAvailableFields)
  );

  return (
    <div className="p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          All Rows Data Table - Project {projectId}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleBulkDeleteSelected}
            disabled={bulkDeleting || selectedInstanceIds.length === 0}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded ${
              bulkDeleting || selectedInstanceIds.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <FaTrash />
            {bulkDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedInstanceIds.length})`}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-blue-900 border border-blue-300 rounded hover:bg-blue-50"
          >
            Hide/Show Columns
          </button>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 rounded hover:bg-green-700"
          >
            <FaFileExcel />
            Download Excel
          </button>
        </div>
      </div>

      {/* Pagination Info and Controls */}
      <div className="p-4 mb-4 bg-white border rounded-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              entries
            </span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Page size:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <FaChevronLeft />
            </button>
            <span className="px-2 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <FaChevronRight />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Last
            </button>
          </div>
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

      {/* Follow-up Filters */}
      <div className="mb-4">
        <div className="p-4 bg-white border rounded-lg">
          <label className="block mb-2 text-sm font-semibold text-gray-700">
            Follow-up presence
          </label>
          <select
            value={followupFilter}
            onChange={(e) => setFollowupFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
          >
            <option value="all">All data collection submissions</option>
            <option value="with">Only with linked follow-up</option>
            <option value="without">Only without linked follow-up</option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Filter the rows based on whether a follow-up form has been submitted
            for the data collection.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-scroll">
        <table className="bg-white border border-collapse border-gray-300">
          <thead>
            <tr>
              <th className="w-10 px-2 py-2 text-xs font-medium text-center text-gray-700 bg-gray-100 border border-gray-300 min-w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  disabled={
                    visibleSelectableInstanceIds.length === 0 || bulkDeleting
                  }
                  onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                  title="Select all rows on this page"
                  className="w-4 h-4"
                />
              </th>
              {visibleFields.map((field) => {
                const minColumnWidth = estimateWidthFromHeader(field);
                const resolvedColumnWidth = getColumnWidth(field);

                return (
                  <th
                    key={field}
                    className="px-2 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300"
                    style={{
                      width: `${resolvedColumnWidth}px`,
                      minWidth: `${resolvedColumnWidth}px`,
                    }}
                  >
                    <ResizableBox
                      width={resolvedColumnWidth}
                      height={0}
                      minConstraints={[minColumnWidth, 0]}
                      maxConstraints={[700, 0]}
                      resizeHandles={["e"]}
                      onResizeStop={(e, { size }) => {
                        setColumnWidths((prev) => ({
                          ...prev,
                          [field]: size.width,
                        }));
                      }}
                    >
                      <div className="flex items-start w-full gap-1 pr-1">
                        <span className="flex-1 min-w-0 text-[11px] font-semibold leading-tight break-words whitespace-normal">
                          {getFieldLabel(field)}
                        </span>
                        <button
                          onClick={() => {
                            const direction =
                              sortConfig.key === field &&
                              sortConfig.direction === "asc"
                                ? "desc"
                                : "asc";
                            setSortConfig({ key: field, direction });
                          }}
                          className="shrink-0 mt-0.5 ml-1"
                        >
                          {sortConfig.key === field ? (
                            sortConfig.direction === "asc" ? (
                              <FcGenericSortingAsc />
                            ) : (
                              <FcGenericSortingDesc />
                            )
                          ) : (
                            <LuArrowUpDown />
                          )}
                        </button>
                      </div>
                    </ResizableBox>
                  </th>
                );
              })}
            </tr>
            <tr>
              <th className="p-1 border border-gray-300 bg-gray-50"></th>
              {visibleFields.map((field) => {
                const resolvedColumnWidth = getColumnWidth(field);
                return (
                  <th
                    key={field}
                    className="p-1 border border-gray-300 bg-gray-50"
                    style={{
                      width: `${resolvedColumnWidth}px`,
                      minWidth: `${resolvedColumnWidth}px`,
                    }}
                  >
                    <input
                      type="text"
                      placeholder={`Filter ${getFieldLabel(field)}`}
                      value={searchTerms[field] || ""}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => {
              const instanceId = getRowInstanceId(row);
              const canSelect = Boolean(instanceId);
              const checked = canSelect && selectedInstanceIdSet.has(instanceId);

              return (
                <tr key={instanceId || idx} className="hover:bg-gray-50">
                  <td className="px-2 py-1 text-center border border-gray-300">
                    <input
                      type="checkbox"
                      disabled={!canSelect || bulkDeleting}
                      checked={checked}
                      onChange={(e) =>
                        toggleRowSelection(instanceId, e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </td>
                  {visibleFields.map((field) => {
                    const resolvedColumnWidth = getColumnWidth(field);
                    return (
                      <td
                        key={field}
                        className="px-2 py-1 text-xs text-gray-900 border border-gray-300"
                        style={{
                          width: `${resolvedColumnWidth}px`,
                          minWidth: `${resolvedColumnWidth}px`,
                        }}
                      >
                        {field === "group_name" ? (
                          <button
                            onClick={() => handleGroupClick(row[field])}
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {String(row[field] || "")}
                          </button>
                        ) : (
                          <span style={{ whiteSpace: "pre-wrap" }}>
                            {getFieldDisplayValue(row, field)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          {allRowsData.length === 0
            ? "No data available"
            : "No matching results found"}
        </div>
      )}

      {/* Column Visibility Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Select Visible Columns</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-80">
              {allAvailableFields.map((field) => {
                const isRequiredField = requiredVisibleFieldSet.has(field);
                return (
                  <label
                    key={field}
                    className="flex items-center p-2 space-x-2 border rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleFields.includes(field)}
                      disabled={isRequiredField}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setVisibleFields((prev) =>
                            ensureRequiredVisibleFields(
                              [...prev, field],
                              allAvailableFields
                            )
                          );
                        } else if (!isRequiredField) {
                          setVisibleFields((prev) =>
                            prev.filter((f) => f !== field)
                          );
                        }
                      }}
                      className="form-checkbox"
                    />
                    <span className="text-sm">
                      {getFieldLabel(field)}
                      {isRequiredField ? " (required)" : ""}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setVisibleFields([...allAvailableFields]);
                }}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
              >
                Select All
              </button>
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

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Download Excel File</h2>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-medium">
                Select Columns to Include:
              </h3>
              <div className="p-3 space-y-2 overflow-y-auto border border-gray-200 rounded max-h-60">
                <div className="flex justify-between mb-3">
                  <button
                    onClick={() => setSelectedColumns([...allAvailableFields])}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedColumns([])}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                  >
                    Clear All
                  </button>
                </div>
                {allAvailableFields.map((field) => (
                  <label
                    key={field}
                    className="flex items-center p-2 space-x-2 border rounded hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(field)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns((prev) => [
                            ...new Set([...prev, field]),
                          ]);
                        } else {
                          setSelectedColumns((prev) =>
                            prev.filter((f) => f !== field)
                          );
                        }
                      }}
                      className="form-checkbox"
                    />
                    <span className="text-sm">{getFieldLabel(field)}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Selected columns: {selectedColumns.length} /{" "}
                {allAvailableFields.length}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-medium text-blue-800">Download Options:</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Choose between downloading only the current page or all
                  submission data.
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Active follow-up filter: <strong>{followupFilter}</strong>
                  {selectedFollowupForms.length > 0 && (
                    <>
                      {" | "}
                      Forms: {selectedFollowupForms.length} selected
                    </>
                  )}
                </p>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    if (selectedColumns.length === 0) {
                      alert("Please select at least one column to download.");
                      return;
                    }
                    setShowDownloadModal(false);
                    downloadCurrentPage();
                  }}
                  disabled={downloadingRows || selectedColumns.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded transition-colors ${
                    downloadingRows || selectedColumns.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {downloadingRows ? (
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <FaFileExcel />
                  )}
                  <span>
                    {downloadingRows
                      ? "Downloading..."
                      : `Download Current Page (${filteredData.length} records)`}
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (selectedColumns.length === 0) {
                      alert("Please select at least one column to download.");
                      return;
                    }
                    downloadFullData();
                  }}
                  disabled={downloadingFull || selectedColumns.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded transition-colors ${
                    downloadingFull || selectedColumns.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {downloadingFull ? (
                    <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                  ) : (
                    <FaFileExcel />
                  )}
                  <span>
                    {downloadingFull
                      ? "Please wait, data is processing (5-10 minutes)..."
                      : `Download Full Data (${totalCount} records)`}
                  </span>
                </button>
              </div>

              {downloadingFull && (
                <p className="px-3 py-2 text-sm border rounded text-amber-800 bg-amber-50 border-amber-300">
                  Please wait, the data is processing. Large exports can take
                  5-10 minutes.
                </p>
              )}

              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllRowsDataTable;
