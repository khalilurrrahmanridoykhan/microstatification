import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaCopy } from "react-icons/fa";
import { BACKEND_URL } from "../../../../config";

const SingleProjectFormTamplate = ({ projectId }) => {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [templateToClone, setTemplateToClone] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [cloneTemplateName, setCloneTemplateName] = useState("");
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/get-project-templates/${projectId}/`,
        {
          headers: { Authorization: `Token ${token}` },
          params: { include_submissions: "false" },
        }
      );
      if (Array.isArray(res.data)) {
        setTemplates(res.data);
        if (res.data.length > 0 && res.data[0].project) {
          setProjectName(`Project ${res.data[0].project}`);
        }
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setTemplates([]);
    }
    setLoadingTemplates(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [projectId]);

  const handleCreateTemplate = async () => {
    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.post(
        `${BACKEND_URL}/api/create-template/`,
        { project_id: projectId },
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchTemplates();
    } catch (err) {}
    setLoadingTemplates(false);
  };

  const handleAddLookupForm = async (template) => {
    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.post(
        `${BACKEND_URL}/api/create-lookup-form/`,
        {
          project_id: template.project,
          data_collection_form_id: template.data_collection_form.id,
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchTemplates();
    } catch (err) {}
    setLoadingTemplates(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this template and all its forms?"
      )
    )
      return;

    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/delete-template/${templateId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      await fetchTemplates();
    } catch (err) {}
    setLoadingTemplates(false);
  };

  // Handle template name editing
  const startEditingTemplateName = (templateId, currentName) => {
    setEditingTemplateId(templateId);
    setEditingTemplateName(currentName);
  };

  const cancelEditingTemplateName = () => {
    setEditingTemplateId(null);
    setEditingTemplateName("");
  };

  const saveTemplateName = async (templateId) => {
    if (!editingTemplateName.trim()) {
      alert("Template name cannot be empty");
      return;
    }

    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.patch(
        `${BACKEND_URL}/api/update-template/${templateId}/`,
        { name: editingTemplateName.trim() },
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchTemplates();
      setEditingTemplateId(null);
      setEditingTemplateName("");
    } catch (err) {
      console.error("Error updating template name:", err);
      alert("Failed to update template name");
    }
    setLoadingTemplates(false);
  };

  // Fetch all projects for clone template modal
  const fetchAllProjects = async () => {
    const token = sessionStorage.getItem("authToken");
    try {
      const res = await axios.get(`${BACKEND_URL}/api/get-all-projects/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (Array.isArray(res.data)) {
        setAllProjects(
          res.data.filter((project) => project.id !== parseInt(projectId))
        );
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setAllProjects([]);
    }
  };

  // Handle clone template
  const handleCloneTemplate = (template) => {
    setTemplateToClone(template);
    setCloneTemplateName(`${template.name} (Copy)`);
    setSelectedProjectId("");
    setShowCloneModal(true);
    fetchAllProjects();
  };

  const confirmCloneTemplate = async () => {
    if (!selectedProjectId || !templateToClone) {
      alert("Please select a target project");
      return;
    }

    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/clone-template/${templateToClone.id}/`,
        {
          target_project_id: selectedProjectId,
          template_name:
            cloneTemplateName.trim() || `${templateToClone.name} (Copy)`,
        },
        { headers: { Authorization: `Token ${token}` } }
      );

      alert(
        `Template cloned successfully! New template ID: ${response.data.cloned_template.id}`
      );
      setShowCloneModal(false);
      setTemplateToClone(null);
      setSelectedProjectId("");
      setCloneTemplateName("");
    } catch (err) {
      console.error("Error cloning template:", err);
      alert("Failed to clone template. Please try again.");
    }
    setLoadingTemplates(false);
  };

  const cancelCloneTemplate = () => {
    setShowCloneModal(false);
    setTemplateToClone(null);
    setSelectedProjectId("");
    setCloneTemplateName("");
  };
  // State: { [lookupFormId]: { selectedQuestion, inputValue, multiValue } }
  const [lookupFormStates, setLookupFormStates] = React.useState({});

  const handleSelectChange = (lfId, val) => {
    setLookupFormStates((prev) => ({
      ...prev,
      [lfId]: {
        selectedQuestion: val,
        inputValue: "",
        multiValue: [],
      },
    }));
  };
  const handleInputChange = (lfId, val) => {
    setLookupFormStates((prev) => ({
      ...prev,
      [lfId]: {
        ...prev[lfId],
        inputValue: val,
      },
    }));
  };
  const handleMultiChange = (lfId, val) => {
    setLookupFormStates((prev) => ({
      ...prev,
      [lfId]: {
        ...prev[lfId],
        multiValue: val,
      },
    }));
  };
  // --- END: Lookup Form Mandatory Question UI State ---

  return (
    <div className="p-4 mt-4 bg-white border rounded-lg border-black/70">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Templates for {projectName || "this project"}
        </h3>
        <button
          className="px-4 py-2 text-white bg-blue-500 rounded"
          onClick={handleCreateTemplate}
          disabled={loadingTemplates}
        >
          {loadingTemplates ? "Creating..." : "Create Template"}
        </button>
      </div>

      {loadingTemplates ? (
        <div className="flex items-center justify-center min-h-[180px] bg-white border rounded-lg border-black/70">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
            <span>Loading templates...</span>
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div>No templates found.</div>
      ) : (
        <ul>
          {templates.map((template) => (
            <li
              key={template.id}
              className="p-3 mb-3 border rounded shadow-sm bg-gray-50"
            >
              <p>
                <strong>Template ID:</strong> {template.id}
              </p>
              <div className="mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>Name:</strong>
                  {editingTemplateId === template.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editingTemplateName}
                        onChange={(e) => setEditingTemplateName(e.target.value)}
                        className="px-2 py-1 border rounded min-w-[200px]"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            saveTemplateName(template.id);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => saveTemplateName(template.id)}
                        className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600"
                        disabled={loadingTemplates}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingTemplateName}
                        className="px-3 py-1 text-sm text-white bg-gray-500 rounded hover:bg-gray-600"
                        disabled={loadingTemplates}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-blue-600">
                        {template.name}
                      </span>
                      <button
                        onClick={() =>
                          startEditingTemplateName(template.id, template.name)
                        }
                        className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                        disabled={loadingTemplates}
                        title="Edit template name"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p>
                <strong>Description:</strong> {template.description}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(template.created_at).toLocaleString("en-US", {
                  timeZone: "Asia/Dhaka",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
              <p>
                <strong>Updated At:</strong>{" "}
                {new Date(template.updated_at).toLocaleString("en-US", {
                  timeZone: "Asia/Dhaka",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>

              {template.data_collection_form && (
                <>
                  <p>
                    <strong>Data Collection Form ID:</strong>{" "}
                    {template.data_collection_form.id}
                  </p>
                  <p>
                    <strong>Data Collection Form Name:</strong>{" "}
                    <Link
                      to={`/template/projects/${template.project}/forms/${template.data_collection_form.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {template.data_collection_form.name}
                    </Link>
                  </p>
                </>
              )}

              {template.lookup_forms?.length > 0 && (
                <>
                  <p>
                    <strong>Lookup Forms:</strong>
                  </p>
                  <ul className="ml-4 list-disc">
                    {template.lookup_forms.map((lf) => {
                      const mandatoryQuestions = (
                        template.data_collection_form?.questions || []
                      ).filter((q) => q.make_mandatory);
                      // If criteria exists, prefill state from it
                      const criteria = lf.criteria || {};
                      const initialSelectedQuestion =
                        criteria.question_name || "";
                      const initialInputValue =
                        criteria.expected_value &&
                        typeof criteria.expected_value === "string"
                          ? criteria.expected_value
                          : "";
                      const initialMultiValue =
                        criteria.expected_value &&
                        Array.isArray(criteria.expected_value)
                          ? criteria.expected_value
                          : [];
                      const state = lookupFormStates[lf.id] || {
                        selectedQuestion: initialSelectedQuestion,
                        inputValue: initialInputValue,
                        multiValue: initialMultiValue,
                      };
                      // Find the selected question by name
                      const currentQuestion = mandatoryQuestions.find(
                        (q) => q.name === state.selectedQuestion
                      );
                      return (
                        <li key={lf.id} className="mb-2">
                          ID: {lf.id}, Name:{" "}
                          <Link
                            to={`/template/projects/${template.project}/forms/${lf.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lf.name}
                          </Link>
                          {mandatoryQuestions.length > 0 && (
                            <div className="p-2 mt-2 border rounded bg-gray-50">
                              <label className="block mb-1 font-semibold">
                                Select Mandatory Question:
                              </label>
                              <select
                                value={state.selectedQuestion}
                                onChange={(e) =>
                                  handleSelectChange(lf.id, e.target.value)
                                }
                                className="px-2 py-1 border rounded"
                              >
                                <option value="">-- Select --</option>
                                {mandatoryQuestions.map((q) => (
                                  <option key={q.name} value={q.name}>
                                    {q.label}
                                  </option>
                                ))}
                              </select>
                              {currentQuestion && (
                                <div className="mt-2">
                                  {/* Text input for any text type */}
                                  {typeof currentQuestion.type === "string" &&
                                    currentQuestion.type
                                      .trim()
                                      .toLowerCase()
                                      .startsWith("text") && (
                                      <input
                                        type="text"
                                        className="px-2 py-1 border rounded"
                                        placeholder="Enter expected value"
                                        value={state.inputValue}
                                        onChange={(e) =>
                                          handleInputChange(
                                            lf.id,
                                            e.target.value
                                          )
                                        }
                                      />
                                    )}
                                  {/* Single select */}
                                  {(currentQuestion.type === "select_one" ||
                                    (typeof currentQuestion.type === "string" &&
                                      currentQuestion.type.startsWith(
                                        "select_one"
                                      ))) && (
                                    <>
                                      {(!Array.isArray(
                                        currentQuestion.options
                                      ) ||
                                        currentQuestion.options.length ===
                                          0) && (
                                        <div className="text-xs text-red-500">
                                          No options found for this select_one
                                          question.
                                        </div>
                                      )}
                                      <select
                                        className="px-2 py-1 border rounded"
                                        value={state.inputValue}
                                        onChange={(e) =>
                                          handleInputChange(
                                            lf.id,
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="">
                                          -- Select an option --
                                        </option>
                                        {Array.isArray(
                                          currentQuestion.options
                                        ) &&
                                          currentQuestion.options.map((opt) => (
                                            <option
                                              key={opt.name}
                                              value={opt.name}
                                            >
                                              {opt.label}
                                            </option>
                                          ))}
                                      </select>
                                    </>
                                  )}
                                  {/* Multi select */}
                                  {(currentQuestion.type ===
                                    "select_multiple" ||
                                    (typeof currentQuestion.type === "string" &&
                                      currentQuestion.type.startsWith(
                                        "select_multiple"
                                      ))) && (
                                    <select
                                      multiple
                                      className="px-2 py-1 border rounded"
                                      value={state.multiValue}
                                      onChange={(e) => {
                                        const options = Array.from(
                                          e.target.selectedOptions,
                                          (o) => o.value
                                        );
                                        handleMultiChange(lf.id, options);
                                      }}
                                    >
                                      {Array.isArray(currentQuestion.options) &&
                                        currentQuestion.options.map((opt) => (
                                          <option
                                            key={opt.name}
                                            value={opt.name}
                                          >
                                            {opt.label}
                                          </option>
                                        ))}
                                    </select>
                                  )}
                                  {/* Save Button */}
                                  <button
                                    className="px-3 py-1 mt-2 text-white bg-blue-600 rounded"
                                    onClick={async () => {
                                      const token =
                                        sessionStorage.getItem("authToken");
                                      let expected_value = null;
                                      if (
                                        typeof currentQuestion.type ===
                                          "string" &&
                                        currentQuestion.type
                                          .trim()
                                          .toLowerCase()
                                          .startsWith("text")
                                      ) {
                                        expected_value = state.inputValue;
                                      } else if (
                                        currentQuestion.type === "select_one" ||
                                        (typeof currentQuestion.type ===
                                          "string" &&
                                          currentQuestion.type.startsWith(
                                            "select_one"
                                          ))
                                      ) {
                                        expected_value = state.inputValue;
                                      } else if (
                                        currentQuestion.type ===
                                          "select_multiple" ||
                                        (typeof currentQuestion.type ===
                                          "string" &&
                                          currentQuestion.type.startsWith(
                                            "select_multiple"
                                          ))
                                      ) {
                                        expected_value = state.multiValue;
                                      }
                                      if (
                                        !state.selectedQuestion ||
                                        expected_value === null ||
                                        expected_value === "" ||
                                        (Array.isArray(expected_value) &&
                                          expected_value.length === 0)
                                      ) {
                                        alert(
                                          "Please select a question and enter/select a value."
                                        );
                                        return;
                                      }
                                      try {
                                        await axios.post(
                                          `${BACKEND_URL}/api/lookup-form-set-criteria/`,
                                          {
                                            lookup_form_id: lf.id,
                                            question_name:
                                              state.selectedQuestion,
                                            expected_value,
                                          },
                                          {
                                            headers: {
                                              Authorization: `Token ${token}`,
                                            },
                                          }
                                        );
                                        alert("Criteria saved!");
                                      } catch (err) {
                                        alert("Failed to save criteria.");
                                      }
                                    }}
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {template.generated_lookup_forms?.length > 0 && (
                <GeneratedLookupFormsTable
                  key={template.id}
                  forms={template.generated_lookup_forms}
                />
              )}

              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 text-white bg-green-500 rounded"
                  onClick={() => handleAddLookupForm(template)}
                  disabled={loadingTemplates}
                >
                  {loadingTemplates ? "Adding..." : "Add Lookup Form"}
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-1 text-white bg-blue-500 rounded"
                  onClick={() => handleCloneTemplate(template)}
                  disabled={loadingTemplates}
                >
                  <FaCopy className="text-xs" />
                  Clone Template
                </button>
                <button
                  className="px-3 py-1 text-white bg-red-500 rounded"
                  onClick={() => handleDeleteTemplate(template.id)}
                  disabled={loadingTemplates}
                >
                  {loadingTemplates ? "Deleting..." : "Delete Template"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Clone Template Modal */}
      {showCloneModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Clone Template</h5>
                <button
                  type="button"
                  className="close"
                  onClick={cancelCloneTemplate}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  Clone template: <strong>{templateToClone?.name}</strong>
                </p>

                <div className="mb-3">
                  <label className="form-label">New Template Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cloneTemplateName}
                    onChange={(e) => setCloneTemplateName(e.target.value)}
                    placeholder="Enter new template name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Target Project:</label>
                  <select
                    className="form-control"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">-- Select Project --</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} (ID: {project.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="alert alert-info">
                  <small>
                    This will copy the template and all its forms (data
                    collection form, lookup forms, and generated forms) to the
                    selected project.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={cancelCloneTemplate}
                  disabled={loadingTemplates}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={confirmCloneTemplate}
                  disabled={loadingTemplates || !selectedProjectId}
                >
                  {loadingTemplates ? "Cloning..." : "Clone Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleProjectFormTamplate;

function GeneratedLookupFormsTable({ forms }) {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleViewFormInfo = (project, formId) => {
    navigate(`/tamplate/projects/${project}/forms/${formId}`);
  };

  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const currentItems = forms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  if (!forms || forms.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-2 font-semibold">Generated Lookup Forms:</p>
      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Name</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(
              (form) => (
                console.log("currentItems..........map", form),
                (
                  <tr key={form.id} className="border-t">
                    <td className="px-4 py-2">{form.id}</td>
                    <td className="max-w-[250px] text-start overflow-hidden whitespace-nowrap">
                      <Link
                        className="text-start w-[250px] truncate font-medium text-color-custom"
                        to={`/template/projects/${form.project}/forms/${form.id}`}
                      >
                        {form.name}
                      </Link>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
