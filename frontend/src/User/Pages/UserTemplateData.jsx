import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { useParams } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import GroupDataTable from "../Components/Project/GroupDataTable";

const TABLE_FIELDS = [
  "date",
  "name_of_staff",
  "organization",
  "designation_1",
  "designation",
  "division",
  "district",
  "upazila",
  "union",
  "ward",
  "area",
  "location",
  "hh_id",
  "hh_head_name",
  "suspected_in_the_disease",
  "name_of_the_person_with_suspected_case",
  "mobile_number",
  "patient_id_type",
  "user_identification_11_9943_01976848561",
  "age",
  "sex",
  "pregnent",
  "suspected_disease",
  "referred",
  "referral_place",
  "if_referred_to_govt",
  "bed_net_use_practice_during_sleep",
  "handwashing_practice_with_soap__water",
  "type_latrine_use",
  // Already diagnosed cases fields
  "no._of_already_diagnosed_cases_of_awd_in_the_hh",
  "no._of_already_diagnosed_cases_of_dengue_in_the_hh_1",
  "no._of_already_diagnosed_cases_of_malaria_in_the_hh",
  "presence_of_stagnant_water_mosquito_breeding_sites",
  "presence_of_mosquito_larvae",
  "did_any_disaster_occur_in_last_7_days_",
  "what_types",
  "remarks",
  // Individual followup fields instead of followup_details
  "followup_follow_up_date",
  "followup_follow_up_status_2472_h",
  "followup_suspected_in_the_disease",
  "followup_if_yes__name_of_the_diseases_1",
  "followup_hh_head_name",
  "followup_hh_id",
  // Metadata columns at the end
  "_id",
  "_version",
  "group_name",
  "formType",
  "submitted_by",
];

const FOLLOWUP_FIELDS = TABLE_FIELDS.filter((field) =>
  field.startsWith("followup_")
);

const UserTemplateData = () => {
  const { templateId } = useParams();
  const [templateData, setTemplateData] = useState(null);
  const [householdGroups, setHouseholdGroups] = useState([]);
  const [expandedRowKey, setExpandedRowKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const normalizeFlatValue = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item === "object" ? JSON.stringify(item) : String(item)
        )
        .join(", ");
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return value;
  };

  const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const flattenSubmissionData = (submission) => {
    if (!submission) return {};

    const base = submission.data ? submission.data : submission;
    const flattened = {};

    if (submission._id !== undefined) {
      flattened._id = submission._id;
    }
    if (submission._version !== undefined) {
      flattened._version = submission._version;
    }

    Object.entries(base || {}).forEach(([key, value]) => {
      if (key === "meta" && value) {
        if (value.instanceID && flattened.instanceID === undefined) {
          flattened.instanceID = value.instanceID;
        }
        if (value.submitted_by && flattened.submitted_by === undefined) {
          flattened.submitted_by = value.submitted_by;
        }
        if (value.start && flattened.start === undefined) {
          flattened.start = value.start;
        }
        if (value.end && flattened.end === undefined) {
          flattened.end = value.end;
        }
      } else {
        flattened[key] = normalizeFlatValue(value);
      }
    });

    return flattened;
  };

  const getValueFromFlat = (flat, field) => {
    if (!flat) return "";
    if (field in flat) return toDisplayValue(flat[field]);

    if (field.startsWith("followup_")) {
      const trimmed = field.substring("followup_".length);
      if (trimmed in flat) return toDisplayValue(flat[trimmed]);
      const alt = trimmed.startsWith("_") ? trimmed.substring(1) : trimmed;
      if (alt in flat) return toDisplayValue(flat[alt]);
    }

    return "";
  };

  const buildBaseRow = (household, dataFlat) => {
    const row = {};

    TABLE_FIELDS.forEach((field) => {
      if (FOLLOWUP_FIELDS.includes(field)) {
        row[field] = "";
        return;
      }

      if (field === "group_name") {
        row[field] =
          toDisplayValue(
            dataFlat?.group_name ||
              household.groupName ||
              household.householdName
          ) || "";
        return;
      }

      if (field === "formType") {
        row[field] = "Data Collection";
        return;
      }

      if (field === "submitted_by") {
        row[field] =
          getValueFromFlat(dataFlat, field) ||
          toDisplayValue(household.dataCollection?.data?.meta?.submitted_by) ||
          "";
        return;
      }

      if (field === "date") {
        const explicitDate = getValueFromFlat(dataFlat, field);
        if (explicitDate) {
          row[field] = explicitDate;
          return;
        }

        const startValue =
          dataFlat?.start ||
          household.dataCollection?.data?.start ||
          household.dataCollection?.data?.meta?.start;

        row[field] = startValue
          ? toDisplayValue(startValue).split("T")[0]
          : "";
        return;
      }

      row[field] = getValueFromFlat(dataFlat, field);
    });

    if (!row.hh_id) {
      row.hh_id = toDisplayValue(household.household_id);
    }

    if (!row.hh_head_name) {
      row.hh_head_name =
        getValueFromFlat(dataFlat, "hh_head_name") ||
        toDisplayValue(household.householdName);
    }

    return row;
  };

  const buildFollowupRow = (baseRow, lookupFlat, lookup) => {
    const row = { ...baseRow };

    FOLLOWUP_FIELDS.forEach((field) => {
      row[field] = getValueFromFlat(lookupFlat, field);
      if (!row[field]) {
        const trimmed = field.substring("followup_".length);
        row[field] = getValueFromFlat(lookupFlat, trimmed);
      }
    });

    const lookupSubmitted = getValueFromFlat(lookupFlat, "submitted_by");
    if (lookupSubmitted) {
      row.submitted_by = lookupSubmitted;
    }

    const lookupId = getValueFromFlat(lookupFlat, "_id");
    if (lookupId) {
      row._id = lookupId;
    }

    const lookupVersion = getValueFromFlat(lookupFlat, "_version");
    if (lookupVersion) {
      row._version = lookupVersion;
    }

    if (!row.group_name) {
      row.group_name = getValueFromFlat(lookupFlat, "group_name") || row.group_name;
    }

    if (!row.followup_follow_up_date) {
      const followupDate = getValueFromFlat(lookupFlat, "follow_up_date");
      if (followupDate) {
        row.followup_follow_up_date = followupDate;
      }
    }

    row.formType = lookup?.form?.name
      ? `Lookup: ${lookup.form.name}`
      : "Follow Up";

    return row;
  };

  const tableRows = useMemo(() => {
    return householdGroups.flatMap((household, householdIndex) => {
      const householdKey =
        household.uuid ||
        household.household_id ||
        household.dataCollection?._id ||
        household.groupName ||
        `household-${householdIndex}`;
      const dataFlat = flattenSubmissionData(household.dataCollection);
      const baseRow = buildBaseRow(household, dataFlat);

      const rows = [
        {
          household,
          rowData: baseRow,
          rowKey: `${householdKey}-data`,
        },
      ];

      (household.lookupForms || []).forEach((lookup, index) => {
        const lookupFlat = flattenSubmissionData(lookup?.submission);
        if (!lookupFlat || Object.keys(lookupFlat).length === 0) return;

        const followupRow = buildFollowupRow(baseRow, lookupFlat, lookup);
        rows.push({
          household,
          rowData: followupRow,
          rowKey: `${householdKey}-followup-${index}`,
        });
      });

      return rows;
    });
  }, [householdGroups]);

  useEffect(() => {
    const fetchTemplateData = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");

      try {
        const templateRes = await axios.get(
          `${BACKEND_URL}/api/get-template/${templateId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        setTemplateData(templateRes.data);

        const projectId = 55; // Fixed project ID
        const bulkRes = await axios.get(
          `${BACKEND_URL}/api/get-project-templates/${projectId}/`,
          { headers: { Authorization: `Token ${token}` } }
        );

        const data = bulkRes.data;
        if (!Array.isArray(data) || data.length === 0) {
          setHouseholdGroups([]);
          setLoading(false);
          return;
        }

        const template = data[0];
        const dcForm = template.data_collection_form;
        const dcFormName = dcForm.name;
        const dcSubmissions = dcForm.submission || [];
        const lookupForms = template.generated_lookup_forms || [];

        const groupMap = {};
        dcSubmissions.forEach((sub) => {
          const uuid = sub.data?.meta?.instanceID;
          if (!uuid) return;

          const hh_id = sub.data?.hh_id || "unknown";
          const hh_head_name = sub.data?.hh_head_name || "";
          const displayName = hh_head_name
            ? `${hh_id} - ${hh_head_name}`
            : hh_id;

          groupMap[uuid] = {
            household_id: hh_id,
            householdName: displayName,
            groupName: `${dcFormName} ${uuid}`,
            dataCollection: sub,
            lookupForms: [],
            hasSubmissionData: true,
            uuid: uuid,
          };
        });

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

        setHouseholdGroups(Object.values(groupMap));
      } catch (err) {
        console.error("Error fetching template data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [templateId]);

  const filteredRows = useMemo(() => {
    if (!searchTerm) return tableRows;
    const searchLower = searchTerm.toLowerCase();

    return tableRows.filter(({ household, rowData }) => {
      const matchesRow = TABLE_FIELDS.some((field) =>
        String(rowData[field] ?? "")
          .toLowerCase()
          .includes(searchLower)
      );
      if (matchesRow) return true;

      const dcString = JSON.stringify(household.dataCollection || {}).toLowerCase();
      if (dcString.includes(searchLower)) return true;

      return (household.lookupForms || []).some((lookup) =>
        JSON.stringify(lookup || {})
          .toLowerCase()
          .includes(searchLower)
      );
    });
  }, [searchTerm, tableRows]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredRows.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    setCurrentPage(1);
    setExpandedRowKey(null);
  }, [searchTerm]);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedRowKey(null);
  };

  const toggleExpanded = (rowKey) => {
    setExpandedRowKey((prev) => (prev === rowKey ? null : rowKey));
  };

  const renderCellValue = (value) => {
    const displayValue = toDisplayValue(value);
    return displayValue === "" ? "-" : displayValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading template data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Template Follow Up Data: {templateData?.name || "Unknown Template"}
      </h2>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search households, names, areas, diseases..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstItem + 1}-
          {Math.min(indexOfLastItem, filteredRows.length)} of{" "}
          {filteredRows.length} records
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>No records found for this template.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {TABLE_FIELDS.map((field) => (
                    <th
                      key={field}
                      className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      {field.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRows.map(({ household, rowData, rowKey }) => {
                  const isExpanded = expandedRowKey === rowKey;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="hover:bg-gray-50">
                        {TABLE_FIELDS.map((field, index) => {
                          const value = renderCellValue(rowData[field]);

                          if (index === 0) {
                            return (
                              <td
                                key={field}
                                className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(rowKey);
                                  }}
                                  className="inline-flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 transition-colors border border-transparent rounded hover:border-gray-300"
                                >
                                  {isExpanded ? (
                                    <FaChevronDown size={12} />
                                  ) : (
                                    <FaChevronRight size={12} />
                                  )}
                                  <span>{value}</span>
                                </button>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={field}
                              className="px-4 py-4 text-sm text-gray-900 max-w-[200px] truncate"
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={TABLE_FIELDS.length} className="p-0">
                            <div className="border-t border-gray-200 bg-gray-50">
                              <div className="p-6">
                                <div className="bg-white border rounded-lg">
                                  <div className="p-4 border-b bg-gray-50">
                                    <h4 className="text-lg font-semibold text-gray-800">
                                      Household Details:{" "}
                                      {household.household_id}
                                    </h4>
                                  </div>
                                  <div className="p-4">
                                    <div className="max-h-[600px] overflow-y-auto">
                                      <GroupDataTable groupData={household} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserTemplateData;
