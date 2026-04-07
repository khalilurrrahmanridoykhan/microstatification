import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BACKEND_URL } from "../../../../config";


function OrgAssignUser({ allUsers }) {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [activeUser, setActiveUser] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");


  // Fetch users, orgs, and projects (with forms included)
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("authToken");

      try {
        // Get the user's profile
        const userResponse = await axios.get(`${BACKEND_URL}/api/users/${userInfo.username}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const profile = userResponse.data.profile || {};
        const allOrg = profile.organizations || [];
        const allProjects = profile.projects || [];
        const allForms = profile.forms || [];

        // Fetch all users
        // const [userRes] = await Promise.all([
        //   axios.get(`${BACKEND_URL}/api/users/`, {
        //     headers: { Authorization: `Token ${token}` },
        //   }),
        // ]);

        // Prepare API calls
        const orgPromises = allOrg.map((id) =>
          axios.get(`${BACKEND_URL}/api/organizations/${id}/`, {
            headers: { Authorization: `Token ${token}` },
          })
        );

        const proPromises = allProjects.map((id) =>
          axios.get(`${BACKEND_URL}/api/projects/${id}/`, {
            headers: { Authorization: `Token ${token}` },
          })
        );

        const formPromises = allForms.map((id) =>
          axios.get(`${BACKEND_URL}/api/forms/${id}/`, {
            headers: { Authorization: `Token ${token}` },
          })
        );

        // Run all in parallel using Promise.allSettled
        const [orgResults, proResults, formResults] = await Promise.all([
          Promise.allSettled(orgPromises),
          Promise.allSettled(proPromises),
          Promise.allSettled(formPromises),
        ]);

        // Filter successful responses
        const orgs = orgResults
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value.data);

        const projects = proResults
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value.data);

        const forms = formResults
          .filter((res) => res.status === "fulfilled")
          .map((res) => res.value.data);

        // Set states
        // setUsers(userRes.data);
        setUsers(allUsers || []);
        setOrgs(orgs);
        setProjects(projects);
        if (typeof setForms === "function") {
          setForms(forms);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setUsers("");
        setOrgs([]);
        setProjects([]);
        if (typeof setForms === "function") {
          setForms([]);
        }
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
    if (!selectedUser) return;

    const token = sessionStorage.getItem("authToken");

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/users/${selectedUser}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const profile = data.profile || {};

      // Initialize from profile
      let updatedOrganizations = [...(profile.organizations || [])];
      let updatedProjects = [...(profile.projects || [])];
      let updatedForms = [...(profile.forms || [])];

      // Logic:
      if (selectedForm) {
        if (!updatedForms.includes(selectedForm)) {
          updatedForms.push(selectedForm);
        }
      } else if (selectedProject) {
        if (!updatedProjects.includes(selectedProject)) {
          updatedProjects.push(selectedProject);
        }
      } else if (selectedOrg) {
        if (!updatedOrganizations.includes(selectedOrg)) {
          updatedOrganizations.push(selectedOrg);
        }
      }

      const updatedProfile = {
        ...profile,
        organizations: updatedOrganizations,
        projects: updatedProjects,
        forms: updatedForms,
        active_user: activeUser,
        receive_updates: receiveUpdates,
      };

      await axios.patch(
        `${BACKEND_URL}/api/users/${selectedUser}/`,
        { profile: updatedProfile },
        { headers: { Authorization: `Token ${token}` } }
      );

      toast.success("User assignment updated!");
      setSelectedOrg("");
      setSelectedProject("");
      setSelectedForm("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to assign user.");
    }
  };



  return (
    <div className="p-4 bg-white">
      <form
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="users">Users</label>
          <select
            id="users"
            className="w-full px-3 py-2 border rounded"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.username}>
                {user.username}  ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-1 form-group">
          <label htmlFor="orgList">Organization</label>
          <select
            id="orgList"
            className="w-full px-3 py-2 border rounded"
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
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
            className="w-full px-3 py-2 border rounded"
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
            className="w-full px-3 py-2 border rounded"
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
          <div className="flex items-center">
            <input
              type="checkbox"
              id="receiveUpdates"
              className="mr-2 toggle-input"
              checked={receiveUpdates}
              onChange={(e) => setReceiveUpdates(e.target.checked)}
            />
            <label
              htmlFor="receiveUpdates"
              className="mr-2 toggle-switch"
            ></label>
            <label htmlFor="receiveUpdates" className="notification-label">
              I receive all updates
            </label>
          </div>
        </div>
        <div className="col-span-2 mt-6 button-container">
          <button type="submit" className="save-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}


export default OrgAssignUser;
