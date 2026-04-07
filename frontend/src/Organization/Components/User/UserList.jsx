import React, { useEffect, useMemo, useState } from "react";
import "./UserList.css";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";
import Swal from "sweetalert2";

const PAGE_SIZE = 10;

function UserList() {
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [forms, setForms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadOptions = async () => {
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Token ${token}` };

      try {
        const [orgRes, projectsRes] = await Promise.allSettled([
          axios.get(`${BACKEND_URL}/api/organizations/`, { headers }),
          axios.get(`${BACKEND_URL}/api/projects/user-projects/?include_forms=true`, {
            headers,
          }),
        ]);
        const orgList =
          orgRes.status === "fulfilled" && Array.isArray(orgRes.value.data)
            ? orgRes.value.data
            : [];
        const projectList =
          projectsRes.status === "fulfilled" &&
          Array.isArray(projectsRes.value.data)
            ? projectsRes.value.data
            : [];

        const orgById = new Map(orgList.map((org) => [org.id, org]));
        const formList = [];

        projectList.forEach((project) => {
          (project.forms || []).forEach((form) => {
            formList.push({
              ...form,
              projectId: project.id,
              projectName: project.name,
              organizationId: project.organization,
              organizationName:
                project.organization_name ||
                orgById.get(project.organization)?.name ||
                "",
            });
          });
        });

        const orgIds = new Set(
          projectList.map((project) => project.organization).filter(Boolean)
        );
        const visibleOrgs = orgList.filter((org) => orgIds.has(org.id));

        setOrganizations(visibleOrgs);
        setProjects(projectList);
        setForms(formList);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load filters");
        setOrganizations([]);
        setProjects([]);
        setForms([]);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Token ${token}` };
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
      };

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }
      if (selectedOrgId) {
        params.organization = selectedOrgId;
      }
      if (selectedProjectId) {
        params.project = selectedProjectId;
      }
      if (selectedFormId) {
        params.form = selectedFormId;
      }
      if (createdFrom) {
        params.created_from = createdFrom;
      }
      if (createdTo) {
        params.created_to = createdTo;
      }
      if (createdByFilter !== "all") {
        params.created_by = createdByFilter;
      }

      try {
        const res = await axios.get(`${BACKEND_URL}/api/users/list-view/`, {
          headers,
          params,
        });
        const results = Array.isArray(res.data?.results)
          ? res.data.results
          : [];
        setUsers(results);
        setTotalCount(Number(res.data?.count) || 0);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load users");
        setUsers([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [
    currentPage,
    searchTerm,
    selectedOrgId,
    selectedProjectId,
    selectedFormId,
    createdFrom,
    createdTo,
    createdByFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedOrgId,
    selectedProjectId,
    selectedFormId,
    createdFrom,
    createdTo,
    createdByFilter,
  ]);

  useEffect(() => {
    setSelectedProjectId("");
    setSelectedFormId("");
  }, [selectedOrgId]);

  useEffect(() => {
    setSelectedFormId("");
  }, [selectedProjectId]);

  const projectOptions = useMemo(() => {
    if (!selectedOrgId) {
      return projects;
    }
    return projects.filter(
      (project) => String(project.organization) === selectedOrgId
    );
  }, [projects, selectedOrgId]);

  const formOptions = useMemo(() => {
    if (
      selectedFormId &&
      !forms.find((form) => String(form.id) === selectedFormId)
    ) {
      setSelectedFormId("");
    }

    if (selectedProjectId) {
      return forms.filter(
        (form) => String(form.projectId) === selectedProjectId
      );
    }
    if (selectedOrgId) {
      return forms.filter(
        (form) => String(form.organizationId) === selectedOrgId
      );
    }
    return forms;
  }, [forms, selectedOrgId, selectedProjectId, selectedFormId]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const handleDelete = async (username) => {
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/users/${username}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setUsers((prev) => prev.filter((user) => user.username !== username));
      setTotalCount((prev) => Math.max(prev - 1, 0));
      Swal.fire("Deleted!", "User has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting user:", error);
      Swal.fire("Error", "Failed to delete user.", "error");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedOrgId("");
    setSelectedProjectId("");
    setSelectedFormId("");
    setCreatedFrom("");
    setCreatedTo("");
    setCreatedByFilter("all");
  };

  const showingFrom = totalCount ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const showingTo = totalCount
    ? Math.min((safePage - 1) * PAGE_SIZE + users.length, totalCount)
    : 0;

  return (
    <div>
      <div className="">
        <div className="flex justify-between items-center">
          <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
            All Users
          </h2>
          <button
            className={` bg-[var(--primary2)]  px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none  hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn`}
          >
            <Link
              to={"/user/create"}
              className="text-white no-underline bg-color-custom hover:bg-color-custom-hover"
            >
              Create User
            </Link>
          </button>
        </div>
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
                Created By
              </label>
              <select
                value={createdByFilter}
                onChange={(e) => setCreatedByFilter(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="all">All</option>
                <option value="me">Created by me</option>
                <option value="others">Created by others</option>
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3 mt-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form
              </label>
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Forms</option>
                {formOptions.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, email, role, or creator"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-black/70 overflow-x-auto">
          <table className="border-collapse table-auto w-full">
            <thead>
              <tr>
                <th className="w-[100px]">SL No.</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center">
                    <span className="block mb-2 text-gray-600">Loading...</span>
                    <span className="block w-8 h-8 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user, idx) => (
                  <tr key={user.username}>
                    <td className="w-[100px]">
                      {String(
                        (safePage - 1) * PAGE_SIZE + idx + 1
                      ).padStart(2, "0")}
                      .
                    </td>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{getRoleName(user.role)}</td>
                    <td className="action-buttons">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/user/edit/${user.username}`)
                          }
                          disabled={userInfo.role >= user.role}
                          className="disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Are you sure?",
                              text: "This will permanently delete the user.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Yes, delete it!",
                            });
                            if (result.isConfirmed) {
                              await handleDelete(user.username);
                            }
                          }}
                          disabled={user.role === 2}
                          className="disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-gray-500">
                    No users available
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!loading && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
              <p className="text-sm text-gray-600">
                Showing {showingFrom}-{showingTo} of {totalCount}
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
    </div>
  );
}

export default UserList;

function getRoleName(role) {
  switch (role) {
    case 1:
      return "Admin";
    case 2:
      return "Organizer";
    case 3:
      return "Project Manager";
    case 4:
      return "User";
    case 5:
      return "Data Collector";
    case 6:
      return "Officer";
    case 7:
      return "Microstatification Admin";
    case 8:
      return "SK";
    case 9:
      return "SHW";
    default:
      return "Unknown Role";
  }
}
