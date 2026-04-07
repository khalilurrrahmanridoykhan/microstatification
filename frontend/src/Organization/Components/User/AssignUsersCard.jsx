import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function AssignUserCard() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeUser, setActiveUser] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const userInfodata = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const myusername = userInfodata.username

  // Fetch users, orgs, and projects (with forms included)
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) return;

      try {
        const headers = { Authorization: `Token ${token}` };

        // Step 1: Get logged-in user's info
        const userInfoRes = await axios.get(
          `${BACKEND_URL}/api/users/${userInfodata.username}/`,
          { headers }
        );

        const userInfo = userInfoRes.data;
        const assignedOrgIds = userInfo.profile.organizations;
        const assignedProjectIds = userInfo.profile.projects;

        // Step 2: Fetch all orgs, projects, users
        const [allProjectsRes, allOrgsRes, allUsersRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/projects/`, { headers }),
          axios.get(`${BACKEND_URL}/api/organizations/`, { headers }),
          axios.get(`${BACKEND_URL}/api/users/`, { headers }),
        ]);

        const allProjects = allProjectsRes.data;
        const allOrgs = allOrgsRes.data;
        const allUsers = allUsersRes.data;

        // Step 3: Filter projects assigned to user's orgs
        const orgProjects = allProjects.filter(p =>
          assignedOrgIds.includes(p.organization)
        );

        const directProjects = allProjects.filter(p =>
          assignedProjectIds.includes(p.id)
        );

        // Combine + deduplicate projects
        const projectMap = new Map();
        [...directProjects, ...orgProjects].forEach(p => projectMap.set(p.id, p));
        const finalProjects = Array.from(projectMap.values());

        // Step 4: Collect form IDs from final projects
        const finalFormIds = new Set(
          finalProjects.flatMap(p => (p.forms || []).map(f => f.id))
        );

        // Step 5: Prepare ID sets for filtering
        const finalOrgIds = new Set(assignedOrgIds);
        const finalProjIds = new Set(finalProjects.map(p => p.id));
        const finalFormIdSet = new Set(finalFormIds);

        // Step 6: Filter users who share access
        const filteredUsers = allUsers.filter(user => {
          if (user.role === 1) return false;

          const { organizations = [], projects = [], forms = [] } = user.profile || {};
          const hasOrg = organizations.some(id => finalOrgIds.has(id));
          const hasProj = projects.some(id => finalProjIds.has(id));
          const hasForm = forms.some(id => finalFormIdSet.has(id));

          return hasOrg || hasProj || hasForm;
        });

        // Step 7: Filter only orgs the user has access to
        const finalOrgs = allOrgs.filter(org =>
          assignedOrgIds.includes(org.id)
        );

        const role45Users = allUsers.filter(user => user.role === 4 || user.role === 5);
        const merged = [...filteredUsers, ...role45Users];


        const uniqueUsers = Array.from(new Map(merged.map(u => [u.username, u])).values());

        setUsers(uniqueUsers);
        setProjects(finalProjects);
        setOrgs(finalOrgs);
      } catch (error) {
        console.error("Data fetch error:", error);
        setUsers([]);
        setProjects([]);
        setOrgs([]);
      }
    };

    fetchData();
  }, []);

  // console.log(users, orgs, projects);
  const filteredProjects = selectedOrg
    ? projects.filter(
      (project) =>
        String(project.organization) === String(selectedOrg) ||
        String(project.organization?.id) === String(selectedOrg)
    )
    : [];

  // Get forms from the selected project
  const selectedProjectObj = filteredProjects.find(
    (project) => String(project.id) === String(selectedProject)
  );
  const forms = selectedProjectObj?.forms || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = sessionStorage.getItem("authToken");
    if (!selectedUser) return toast.error("Please select a user.");

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/users/${selectedUser}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const currentRole = data?.role ?? 4;
      const currentProfile = {
        organizations: data?.profile?.organizations || [],
        projects: data?.profile?.projects || [],
        forms: data?.profile?.forms || [],
        active_user: data?.profile?.active_user ?? true,
        receive_updates: data?.profile?.receive_updates ?? false,
      };

      let updatedProfile = { ...currentProfile };

      // 1️⃣ Determine intent level
      let candidateRole = 4;
      if (selectedForm) {
        candidateRole = 4;
        updatedProfile.forms = Array.from(new Set([...currentProfile.forms, selectedForm]));
        // We do NOT touch orgs/projects when assigning a form
      } else if (selectedProject) {
        candidateRole = 3;
        updatedProfile.projects = Array.from(new Set([...currentProfile.projects, selectedProject]));
        // Do NOT update orgs
      } else if (selectedOrg) {
        candidateRole = 2;
        updatedProfile.organizations = Array.from(new Set([...currentProfile.organizations, selectedOrg]));
      } else {
        return toast.error("Select at least one Organisation / Project / Form.");
      }

      // 2️⃣ Keep highest role (lowest number)
      const newRole = currentRole === 6 ? currentRole : Math.min(currentRole, candidateRole);

      // 3️⃣ Add toggles (optional)
      updatedProfile.active_user = activeUser;
      updatedProfile.receive_updates = receiveUpdates;

      // 4️⃣ PATCH user
      await axios.patch(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        { profile: updatedProfile, role: newRole },
        { headers: { Authorization: `Token ${token}` } }
      );

      toast.success("User updated successfully!");

      // 5️⃣ Reset selections
      setSelectedOrg("");
      setSelectedProject("");
      setSelectedForm("");
    } catch (err) {
      console.error(err);
      toast.error("Error updating user");
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
        <div ref={dropdownRef} className="relative w-full max-w-md">

          <label htmlFor="users" className="block mb-1 text-sm font-medium text-gray-700">Users</label>


          <div
            className="border rounded px-4 py-2 bg-white cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedUser || "Select user"}
          </div>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
              {/* Search Input */}
              <div className="sticky top-0 bg-white z-10 p-2 border-b">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtered Options */}
              {users
                .filter((user) =>
                  user.username.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedUser(user.username);
                      setIsOpen(false);
                      setSearchTerm(""); // optional: clear on select
                    }}
                  >
                    {user.username} (
                    {user.role === 6
                      ? "Officer"
                      : user.role === 3
                        ? "Project manager"
                        : user.role === 4
                          ? "User"
                          : "Data collector"}
                    )
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="col-span-1 form-group">
          <label htmlFor="orgList">Organization</label>
          <select
            id="orgList"
            className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            disabled={!selectedUser}
          >
            <option value="">Select organization</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 form-group">
          <label htmlFor="projectList">Project</label>
          <select
            id="projectList"
            className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedOrg}
          >
            <option value="">
              {selectedOrg ? "Select project" : "Select organization first"}
            </option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 form-group">
          <label htmlFor="formList">Form</label>
          <select
            id="formList"
            className="w-full px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
            disabled={!selectedProject}
          >
            <option value="">
              {selectedProject ? "Select form" : "Select project first"}
            </option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>
        </div>
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
        <div className="col-span-2 mt-6 button-container">
          <button
            type="submit"
            className="px-4 py-2 text-white transition-colors bg-blue-600 rounded save-button disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            disabled={
              !selectedOrg || !selectedUser || !selectedProject
            }
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default AssignUserCard;
