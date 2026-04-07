import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

export default function AssignUserCard() {
  // State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [projects, setProjects] = useState([]); // Only user's assigned projects
  const [selectedProject, setSelectedProject] = useState("");
  const [forms, setForms] = useState([]); // Forms of selectedProject
  const [selectedForm, setSelectedForm] = useState("");
  const [activeUser, setActiveUser] = useState(true);
  const [receiveUpd, setReceiveUpd] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


  const token = sessionStorage.getItem("authToken");
  const auth = { headers: { Authorization: `Token ${token}` } };

  // 1. Load user list once
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/users/`, auth);
        setUsers(data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load users");
      }
    })();
  }, []);

  // 2. On mount, fetch the current user's up-to-date profile and their assigned projects
  useEffect(() => {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const username = userInfo?.username;
    if (!username) {
      setProjects([]);
      setSelectedProject("");
      setForms([]);
      setSelectedForm("");
      return;
    }
    (async () => {
      try {
        // Get the current user's profile from API for up-to-date project IDs
        const { data: userData } = await axios.get(
          `${BACKEND_URL}/api/users/${username}/`,
          auth
        );
        const projectIDs = userData?.profile?.projects || [];
        if (!projectIDs.length) {
          setProjects([]);
          setSelectedProject("");
          setForms([]);
          setSelectedForm("");
          return;
        }
        // Fetch only the projects listed in profile.projects
        const projectReqs = projectIDs.map((id) =>
          axios.get(`${BACKEND_URL}/api/projects/${id}/`, auth)
        );
        const projectRes = await Promise.all(projectReqs);
        const fullProjects = projectRes.map((r) => r.data);
        setProjects(fullProjects);
      } catch (err) {
        console.error(err);
        toast.error("Could not load your assigned projects");
        setProjects([]);
        setSelectedProject("");
        setForms([]);
        setSelectedForm("");
      }
    })();
  }, []);

  // 3. Whenever selectedProject changes, derive forms locally
  useEffect(() => {
    const p = projects.find((pr) => String(pr.id) === String(selectedProject));
    setForms(p?.forms || []);
    setSelectedForm(""); // reset form pick when project switches
  }, [selectedProject, projects]);

  // 4. Save assignment: only assign form, keep previous forms
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedProject || !selectedForm) return;

    try {
      // Get selected user's profile to preserve previous forms
      const { data: userData } = await axios.get(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        auth
      );
      const profile = userData.profile || {};
      let updatedForms = Array.isArray(profile.forms) ? [...profile.forms] : [];
      if (!updatedForms.includes(selectedForm)) {
        updatedForms.push(selectedForm);
      }

      const updatedProfile = {
        ...profile,
        active_user: activeUser,
        receive_updates: receiveUpd,
        forms: updatedForms,
        // Do NOT update projects or organizations
      };

      await axios.patch(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        { profile: updatedProfile, role: 4 },
        auth
      );
      toast.success("User form assignment updated!");
      setSelectedProject("");
      setSelectedForm("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);




  return (
    <div className="">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Assign User
      </h2>
      <form
        className="bg-white rounded-lg border border-black/70 p-4 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        {/* Users */}
        <div className="form-group relative w-full max-w-md" ref={dropdownRef}>
          {/* Label */}
          <label htmlFor="userList" className="block mb-1 text-sm font-medium text-gray-700">
            Users
          </label>

          {/* Trigger */}
          <div
            id="userList"
            className="w-full px-3 py-2 border rounded bg-white cursor-pointer"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {selectedUser || "Select user"}
          </div>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {/* Search input and close button */}
              <div className="flex items-center justify-between px-2 py-2 sticky top-0 bg-white z-10 border-b">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtered Options */}
              {users
                .filter((u) => u.role !== 1 && u.role !== 2) // Exclude superusers and organization admins
                .filter((u) =>
                  u.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedUser(u.username);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {u.username} (
                    {u.role === 6
                      ? "Officer"
                      : u.role === 3
                        ? "Project manager"
                        : u.role === 4
                          ? "User"
                          : "Data collector"}
                    )
                  </div>
                ))}
            </div>
          )}
        </div>
        {/* Projects */}
        <div className="form-group">
          <label htmlFor="projectList">Project</label>
          <select
            id="projectList"
            className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedUser || !projects.length}
          >
            <option value="">
              {selectedUser ? "Select project" : "Select user first"}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {/* Forms */}
        <div className="form-group">
          <label htmlFor="formList">Form</label>
          <select
            id="formList"
            className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            disabled={!selectedProject || !forms.length}
          >
            <option value="">
              {selectedProject ? "Select form" : "Select project first"}
            </option>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        {/* Notification Section */}
        <div className="col-span-2">
          <h3 className="mt-6 mb-2 text-lg font-semibold">Notification</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="activeUser"
              className="mr-2 toggle-input"
              checked={activeUser}
              onChange={(e) => setActiveUser(e.target.checked)}
            />
            <label htmlFor="activeUser" className="mr-2 toggle-switch"></label>
            <label htmlFor="activeUser" className="notification-label">
              Active user for work
            </label>
          </div>

        </div>
        {/* Save */}
        <div className="col-span-2 mt-6 button-container">
          <button
            type="submit"
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded save-button disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            disabled={!selectedUser || !selectedProject || !selectedForm}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
