import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaTable } from "react-icons/fa";
import Swal from "sweetalert2";

const getProjectFormCount = (project) => {
  if (typeof project?.forms_count === "number") {
    return project.forms_count;
  }
  if (Array.isArray(project?.forms)) {
    return project.forms.length;
  }
  return 0;
};

const ProjectTemplateTable = ({ setParentLoading }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    if (setParentLoading) setParentLoading(true);
    const token = sessionStorage.getItem("authToken");

    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("AllProjects")) {
        dataTable = new window.DataTable("#AllProjects");
      }
    };

    const fetchProjectsWithTemplates = async () => {
      try {
        // One lightweight project request with precomputed counts.
        const res = await axios.get(`${BACKEND_URL}/api/projects/`, {
          headers: { Authorization: `Token ${token}` },
          params: { include_forms: false, has_templates: true },
        });
        const allProjects = res.data;

        const projectsWithTemplates = Array.isArray(allProjects)
          ? allProjects
          : [];

        setProjects(projectsWithTemplates);
        setTimeout(() => {
          initializeDataTable();
        }, 0);
      } catch (err) {
        console.error(err);
        setProjects([]);
        setTimeout(() => {
          initializeDataTable([]);
        }, 0);
      } finally {
        setLoading(false);
        if (setParentLoading) setParentLoading(false);
      }
    };

    fetchProjectsWithTemplates();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);

  // Delete handler similar to ProjectTable
  const handleDelete = async (projectId) => {
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${projectId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const table = $("#AllProjects").DataTable();
      table.destroy();

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTimeout(() => {
        new window.DataTable("#AllProjects");
      }, 100); // wait for DOM to re-render
    } catch (error) {
      // Optionally handle error
    }
  };
  console.log("project", projects);

  return (
    <div className="p-4">
      <div className="p-4 bg-white border rounded-lg border-black/70">
        {loading ? (
          <div className="border-none">
            <div colSpan="5" className="py-8 text-center">
              <span className="block mb-2 text-gray-600">Loading...</span>
              <span className="block w-8 h-8 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <p className="mb-0 text-gray-700">
            No projects with only template found.
          </p>
        ) : (
          <div className="overflow-x-auto ">
            <table
              className="w-full border-collapse table-auto"
              id="AllProjects"
            >
              <thead>
                <tr>
                  <th className="px-4 py-2 border">SL No</th>
                  <th className="px-4 py-2 border">Project Name</th>
                  <th className="px-4 py-2 border">Organization</th>
                  <th className="px-4 py-2 border">Total forms</th>
                  <th className="px-4 py-2 border">Created Date</th>
                  <th className="px-4 py-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <tr key={project.id}>
                    <td className="px-4 py-2 border">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-2 border">{project.name}</td>
                    <td className="px-4 py-2 border">
                      {project.organization_name ||
                        project.organization?.name ||
                        project.organization}
                    </td>
                    <td className="px-4 py-2 border">{getProjectFormCount(project) || "-"}</td>
                    <td className="px-4 py-2 border">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="action-buttons">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/projects/${project.id}/all-rows`)
                          }
                          title="View All Submissions Data"
                          className="p-1 text-green-600 transition-colors rounded hover:text-green-800 hover:bg-green-50"
                        >
                          <FaTable size={16} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/projects/edit/${project.id}`)
                          }
                          title="Edit Project"
                          className="p-1 text-blue-600 transition-colors rounded hover:text-blue-800 hover:bg-blue-50"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Are you sure?",
                              text: `This will delete the Project permanently.`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Yes, delete it!",
                            });
                            if (result.isConfirmed) {
                              try {
                                await handleDelete(project.id);
                                Swal.fire(
                                  "Deleted!",
                                  "The Project has been deleted.",
                                  "success"
                                );
                              } catch (error) {
                                Swal.fire(
                                  "Error!",
                                  "Failed to delete the Project.",
                                  "error"
                                );
                              }
                            }
                          }}
                          title="Delete Project"
                          className="p-1 text-red-600 transition-colors rounded hover:text-red-800 hover:bg-red-50"
                        >
                          <FaTrash size={16} />
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

export default ProjectTemplateTable;
