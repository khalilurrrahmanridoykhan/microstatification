import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaUser, FaCopy } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { useParams, useNavigate } from "react-router-dom";

const ProjectFormsList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [activeTab, setActiveTab] = useState("forms");
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  // Fetch all users assigned to this project or its forms
  const fetchProjectUsers = async () => {
    setLoadingUsers(true);
    const token = sessionStorage.getItem("authToken");
    try {
      // 1. Fetch all users
      const allUsersRes = await axios.get(`${BACKEND_URL}/api/users/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const allUsers = Array.isArray(allUsersRes.data) ? allUsersRes.data : [];

      // 2. Fetch all forms for this project (already in 'forms')
      // 3. Get all user IDs assigned to this project or its forms
      //    (Assume each form has an 'assigned_users' array or similar; adjust as needed)
      const projectFormUserIds = new Set();
      forms.forEach((form) => {
        if (Array.isArray(form.assigned_users)) {
          form.assigned_users.forEach((uid) => projectFormUserIds.add(uid));
        }
      });
      // Optionally, add project-level assigned users if available
      // (Assume project has 'assigned_users' array; adjust if needed)
      // const projectAssignedUsers = project.assigned_users || [];
      // projectAssignedUsers.forEach(uid => projectFormUserIds.add(uid));

      // 4. Filter users who are assigned to this project or its forms
      const filteredUsers = allUsers.filter((user) =>
        projectFormUserIds.has(user.id)
      );
      setProjectUsers(filteredUsers);
    } catch (error) {
      setProjectUsers([]);
    }
    setLoadingUsers(false);
  };
  // Refetch users when forms or projectId changes
  useEffect(() => {
    if (activeTab === "users") {
      fetchProjectUsers();
    }
    // eslint-disable-next-line
  }, [activeTab, forms, projectId]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [templateToClone, setTemplateToClone] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [cloneTemplateName, setCloneTemplateName] = useState("");

  // for delete modal
  const [formToDelete, setFormToDelete] = useState(null); // to store form id
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDelete = (formId) => {
    setFormToDelete(formId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (formToDelete) {
      handleDeleteForm(formToDelete);
    }
    setShowDeleteModal(false);
    setFormToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setFormToDelete(null);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("singleForm")) {
        dataTable = new window.DataTable("#singleForm");
      }
    };

    const fetchForms = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/projects/${projectId}/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        // getting project name and other details into inner obj forms
        const ProjectWithForms = response.data;
        setProjectName(ProjectWithForms.name);
        const enrichedForms = ProjectWithForms.forms.map((form) => ({
          ...form,
          projectName: ProjectWithForms.name,
          location: ProjectWithForms.location,
          created_by: ProjectWithForms.created_by,
          organization: ProjectWithForms.organization,
        }));
        setForms(enrichedForms || []);
        if (enrichedForms.length > 0) {
          setTimeout(() => {
            initializeDataTable();
          }, 1000);
        }
      } catch (error) {
        setForms([]); // Ensure forms is always an array
        setTimeout(() => {
          initializeDataTable([]);
        }, 0);
      }
    };

    fetchForms();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, [projectId]);

  // Fetch templates for a project using new API endpoint
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const token = sessionStorage.getItem("authToken");
    try {
      // Fetch all templates for the selected project using new endpoint
      const res = await axios.get(
        `${BACKEND_URL}/api/get-project-templates/${projectId}/`,
        {
          headers: { Authorization: `Token ${token}` },
          params: { include_submissions: "false" },
        }
      );
      // Response is a list of templates for this project
      if (Array.isArray(res.data)) {
        setTemplates(res.data);
        // Optionally set project name from first template if available
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

  const handleCreateForm = () => {
    navigate(`/projects/${projectId}/create_form`);
  };

  const handleEditForm = (formId) => {
    navigate(`/projects/${projectId}/edit_form/${formId}`);
  };

  const handleDeleteForm = async (formId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.delete(`${BACKEND_URL}/api/forms/${formId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setForms(forms.filter((form) => form.id !== formId));
    } catch (error) {
      // ...existing code...
    }
  };

  const handleViewFormInfo = (formId) => {
    navigate(`/projects/${projectId}/forms/${formId}`);
  };

  return (
    <div className="p-4 mt-2">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Project:{" "}
        <span className="text-[22px] text-blue-500">{projectName}</span>
      </h2>
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "forms" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("forms")}
        >
          Forms
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "templates" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => {
            setActiveTab("templates");
            fetchTemplates();
          }}
        >
          Templates
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        {activeTab === "users" && (
          <div className="p-4 bg-white border rounded-lg border-black/70">
            <h3 className="mb-2 text-lg font-semibold">
              Users Assigned to This Project or Its Forms
            </h3>
            {loadingUsers ? (
              <div>Loading users...</div>
            ) : (
              <div className="p-4 overflow-x-auto bg-white border rounded-lg border-black/70">
                <div className="table-container">
                  <table id="ProjectUserTable" className="display">
                    <thead>
                      <tr>
                        <th>SL No.</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectUsers.length > 0 ? (
                        projectUsers.map((user, idx) => (
                          <tr key={user.username}>
                            <td>{idx + 1}</td>
                            <td>
                              {user.first_name} {user.last_name}
                            </td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="py-4 text-center text-gray-500"
                          >
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {activeTab === "forms" && (
        <div className="p-4 overflow-x-auto bg-white border rounded-lg border-black/70">
          <button className="mb-4 btn save-button" onClick={handleCreateForm}>
            Create Form
          </button>
          <table
            id="singleForm"
            className="bg-white border-collapse table-auto display"
          >
            <thead>
              <tr>
                <th className="max-w-[200px]">Form Name</th>
                <th>Location</th>
                <th>Updated At</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {forms.length > 0 ? (
                forms.map((form) => (
                  <tr key={form.id}>
                    <td className="max-w-[250px] overflow-hidden whitespace-nowrap">
                      <button
                        className="w-[240px] truncate text-start text-color-custom font-medium"
                        onClick={() => handleViewFormInfo(form.id)}
                        title={form.name}
                      >
                        {form.name}
                      </button>
                    </td>
                    <td>{form.location}</td>
                    <td>
                      {new Date(form.updated_at).toLocaleString("en-US", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      {new Date(form.created_at).toLocaleString("en-US", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="action-buttons">
                      <button
                        className=""
                        onClick={() => handleEditForm(form.id)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className=""
                        onClick={() => confirmDelete(form.id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    No forms available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === "templates" && (
        <div className="p-4 bg-white border rounded-lg border-black/70">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Templates for Project: {projectName}
            </h3>
            <button
              className="px-4 py-2 text-white bg-blue-500 rounded"
              onClick={async () => {
                setLoadingTemplates(true);
                const token = sessionStorage.getItem("authToken");
                try {
                  await axios.post(
                    `${BACKEND_URL}/api/create-template/`,
                    { project_id: projectId },
                    { headers: { Authorization: `Token ${token}` } }
                  );
                  await fetchTemplates();
                } catch (err) {
                  console.error("Error creating template:", err);
                }
                setLoadingTemplates(false);
              }}
              disabled={loadingTemplates}
            >
              {loadingTemplates ? "Creating..." : "Create Template"}
            </button>
          </div>
          {loadingTemplates ? (
            <div>Loading templates...</div>
          ) : (
            <>
              <ul>
                {templates.length === 0 && <li>No templates found.</li>}
                {templates.map((template) => (
                  <li key={template.id} className="p-2 mb-2 border rounded">
                    <strong>Template ID:</strong> {template.id} <br />
                    <strong>Name:</strong> {template.name} <br />
                    <strong>Description:</strong> {template.description} <br />
                    <strong>Created At:</strong>{" "}
                    {new Date(template.created_at).toLocaleString()} <br />
                    <strong>Updated At:</strong>{" "}
                    {new Date(template.updated_at).toLocaleString()} <br />
                    {template.data_collection_form && (
                      <>
                        <strong>Data Collection Form ID:</strong>{" "}
                        {template.data_collection_form.id} <br />
                        <strong>Data Collection Form Name:</strong>{" "}
                        {template.data_collection_form.name} <br />
                      </>
                    )}
                    {template.lookup_forms &&
                      template.lookup_forms.length > 0 && (
                        <>
                          <strong>Lookup Forms a:</strong>
                          <ul>
                            {template.lookup_forms.map((lf) => (
                              <li key={lf.id}>
                                ID: {lf.id}, Name: {lf.name}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    {template.generated_lookup_forms &&
                      template.generated_lookup_forms.length > 0 && (
                        <>
                          <strong>Generated Lookup Forms:</strong>
                          <ul>
                            {template.generated_lookup_forms.map((glf) => (
                              <li key={glf.id}>
                                ID: {glf.id}, Name: {glf.name}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    {/* Add Lookup Form Button */}
                    <button
                      className="px-3 py-1 mt-2 text-white bg-green-500 rounded"
                      onClick={async () => {
                        setLoadingTemplates(true);
                        const token = sessionStorage.getItem("authToken");
                        try {
                          await axios.post(
                            `${BACKEND_URL}/api/create-lookup-form/`,
                            {
                              project_id: template.project,
                              data_collection_form_id:
                                template.data_collection_form.id,
                            },
                            {
                              headers: { Authorization: `Token ${token}` },
                            }
                          );
                          await fetchTemplates();
                        } catch (err) {
                          // Optionally show error
                        }
                        setLoadingTemplates(false);
                      }}
                      disabled={loadingTemplates}
                    >
                      {loadingTemplates ? "Adding..." : "Add Lookup Form"}
                    </button>
                    {/* Clone Template Button */}
                    <button
                      className="px-3 py-1 mt-2 ml-2 text-white bg-blue-500 rounded flex items-center gap-1"
                      onClick={() => handleCloneTemplate(template)}
                      disabled={loadingTemplates}
                    >
                      <FaCopy className="text-xs" />
                      Clone Template
                    </button>
                    {/* Delete Template Button */}
                    <button
                      className="px-3 py-1 mt-2 ml-2 text-white bg-red-500 rounded"
                      onClick={async () => {
                        if (
                          !window.confirm(
                            "Are you sure you want to delete this template and all its forms?"
                          )
                        )
                          return;
                        setLoadingTemplates(true);
                        const token = sessionStorage.getItem("authToken");
                        try {
                          await axios.delete(
                            `${BACKEND_URL}/api/delete-template/${template.id}/`,
                            {
                              headers: { Authorization: `Token ${token}` },
                            }
                          );
                          await fetchTemplates();
                        } catch (err) {
                          // Optionally show error
                        }
                        setLoadingTemplates(false);
                      }}
                      disabled={loadingTemplates}
                    >
                      {loadingTemplates ? "Deleting..." : "Delete Template"}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
      {/* Modal */}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="close"
                  onClick={handleCancelDelete}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this form?</p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFormsList;
