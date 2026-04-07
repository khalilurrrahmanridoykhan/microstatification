import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";

const PAGE_SIZE = 15;

const AllFormsList = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Token ${token}` };

      try {
        const [projectsRes, orgRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/api/projects/user-projects/?include_forms=true`, {
            headers,
          }),
          axios.get(`${BACKEND_URL}/api/organizations/`, { headers }),
        ]);

        if (projectsRes.status !== "fulfilled") {
          throw projectsRes.reason;
        }

        const projectList = Array.isArray(projectsRes.value.data)
          ? projectsRes.value.data
          : [];
        const orgList =
          orgRes.status === "fulfilled" && Array.isArray(orgRes.value.data)
            ? orgRes.value.data
            : [];
        const orgById = new Map(orgList.map((org) => [org.id, org]));

        const templateIds = new Set();
        const formMap = new Map();

        projectList.forEach((project) => {
          (project.forms || []).forEach((form) => {
            formMap.set(form.id, {
              ...form,
              projectId: project.id,
              projectName: project.name,
              organizationId: project.organization,
              organizationName:
                project.organization_name ||
                orgById.get(project.organization)?.name ||
                "",
              templateId: form.template,
            });
            if (form.template) {
              templateIds.add(form.template);
            }
          });
        });

        let dataCollectionFormIds = null;
        let generatedLookupFormIds = null;
        const templateIdList = Array.from(templateIds);
        if (templateIdList.length > 0) {
          try {
            const templatesRes = await axios.post(
              `${BACKEND_URL}/api/get-templates-bulk/`,
              { template_ids: templateIdList },
              { headers }
            );
            const templatesData = Array.isArray(templatesRes.data)
              ? templatesRes.data
              : [];
            dataCollectionFormIds = new Set(
              templatesData
                .map((template) => template?.data_collection_form?.id)
                .filter(Boolean)
            );
            generatedLookupFormIds = new Set(
              templatesData
                .flatMap((template) => template?.generated_lookup_forms || [])
                .map((lookupForm) => lookupForm?.id)
                .filter(Boolean)
            );
          } catch (error) {
            console.error("Failed to load template metadata:", error);
            dataCollectionFormIds = null;
            generatedLookupFormIds = null;
          }
        }

        const filteredForms = Array.from(formMap.values())
          .filter((form) => {
            if (generatedLookupFormIds?.has(form.id)) {
              return false;
            }
            if (!form.templateId) {
              return true;
            }
            if (!dataCollectionFormIds) {
              return true;
            }
            return dataCollectionFormIds.has(form.id);
          })
          .map((form) => ({
            ...form,
            formTypeLabel: form.templateId
              ? "Data Collection Form"
              : "Normal Form",
          }));

        const orgIds = new Set(
          projectList.map((project) => project.organization).filter(Boolean)
        );
        const visibleOrgs = orgList.filter((org) => orgIds.has(org.id));

        setForms(filteredForms);
        setProjects(
          projectList.map((project) => ({
            id: project.id,
            name: project.name,
            organizationId: project.organization,
            organizationName: orgById.get(project.organization)?.name || "",
          }))
        );
        setOrganizations(visibleOrgs);
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast.error("Failed to load forms");
        setForms([]);
        setProjects([]);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOrgId, selectedProjectId, createdFrom, createdTo]);

  useEffect(() => {
    setSelectedProjectId("");
  }, [selectedOrgId]);

  const projectOptions = useMemo(() => {
    if (!selectedOrgId) {
      return projects;
    }
    return projects.filter(
      (project) => String(project.organizationId) === selectedOrgId
    );
  }, [projects, selectedOrgId]);

  const filteredForms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const fromDate = createdFrom ? new Date(`${createdFrom}T00:00:00`) : null;
    const toDate = createdTo ? new Date(`${createdTo}T23:59:59`) : null;

    return forms.filter((form) => {
      if (selectedOrgId && String(form.organizationId) !== selectedOrgId) {
        return false;
      }
      if (selectedProjectId && String(form.projectId) !== selectedProjectId) {
        return false;
      }

      if (fromDate || toDate) {
        const createdAt = new Date(form.created_at);
        if (fromDate && createdAt < fromDate) {
          return false;
        }
        if (toDate && createdAt > toDate) {
          return false;
        }
      }

      if (term) {
        const haystack = [
          form.name,
          form.projectName,
          form.organizationName,
          form.formTypeLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [forms, searchTerm, selectedOrgId, selectedProjectId, createdFrom, createdTo]);

  const totalPages = Math.max(1, Math.ceil(filteredForms.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedForms = filteredForms.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const handleEditForm = (project, formId) => {
    navigate(`/projects/${project}/edit_form/${formId}`);
  };

  const handleDeleteForm = async (formId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.delete(`${BACKEND_URL}/api/forms/${formId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      setForms((prev) => prev.filter((form) => form.id !== formId));
      toast.success("Form deleted successfully");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form");
    }
  };

  const handleViewFormInfo = (project, formId) => {
    navigate(`/projects/${project}/forms/${formId}`);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedOrgId("");
    setSelectedProjectId("");
    setCreatedFrom("");
    setCreatedTo("");
  };

  const showingFrom = filteredForms.length ? startIndex + 1 : 0;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filteredForms.length);

  return (
    <div>
      <div className="mb-4 bg-white p-4 border border-black/70 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Advanced Filters
          </h3>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created From
            </label>
            <input
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created To
            </label>
            <input
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by form, project, organization, or type"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 mt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Projects</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border border-black/70 rounded-lg overflow-x-auto">
        <table className="border-collapse table-auto w-full">
          <thead>
            <tr>
              <th className="w-[70px]">SL No</th>
              <th className="max-w-[300px]">Form Name</th>
              <th className="max-w-[250px]">Project Name</th>
              <th className="max-w-[250px]">Organization</th>
              <th>Updated At</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center">
                  <span className="block mb-2 text-gray-600">Loading...</span>
                  <span className="block w-8 h-8 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>
                </td>
              </tr>
            ) : paginatedForms.length > 0 ? (
              paginatedForms.map((form, idx) => (
                <tr key={form.id}>
                  <td className="p-3 whitespace-nowrap">
                    {String(startIndex + idx + 1).padStart(2, "0")}.
                  </td>
                  <td className="max-w-[250px] text-start overflow-hidden whitespace-nowrap">
                    <button
                      className="text-start w-[250px] truncate font-medium text-color-custom"
                      onClick={() => handleViewFormInfo(form.projectId, form.id)}
                    >
                      {form.name}
                    </button>
                  </td>
                  <td className="max-w-[250px] text-start overflow-hidden whitespace-nowrap truncate">
                    {form.projectName}
                  </td>
                  <td className="max-w-[250px] text-start overflow-hidden whitespace-nowrap truncate">
                    {form.organizationName || "-"}
                  </td>
                  <td>
                    {new Date(form.updated_at).toLocaleString("en-US", {
                      timeZone: "Asia/Dhaka",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td>
                    {new Date(form.created_at).toLocaleString("en-US", {
                      timeZone: "Asia/Dhaka",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td className="action-buttons">
                    <button onClick={() => handleEditForm(form.projectId, form.id)}>
                      <FaEdit />
                    </button>
                    <button
                      onClick={async () => {
                        const result = await Swal.fire({
                          title: "Are you sure?",
                          text: "This will delete the form permanently.",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonColor: "#d33",
                          cancelButtonColor: "#3085d6",
                          confirmButtonText: "Yes, delete it!",
                        });
                        if (result.isConfirmed) {
                          await handleDeleteForm(form.id);
                        }
                      }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-6 text-center text-gray-500">
                  No forms available
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!loading && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
            <p className="text-sm text-gray-600">
              Showing {showingFrom}-{showingTo} of {filteredForms.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={safePage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllFormsList;
