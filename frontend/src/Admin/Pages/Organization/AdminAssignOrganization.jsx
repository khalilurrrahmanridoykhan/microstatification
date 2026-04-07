import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function AdminAssignOrg() {
    const [users, setUsers] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedOrg, setSelectedOrg] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedForm, setSelectedForm] = useState("");
    const [activeUser, setActiveUser] = useState(true);
    const [receiveUpdates, setReceiveUpdates] = useState(false);

    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    const [allowedOrgIds, setAllowedOrgIds] = useState([]);

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch users, orgs, and projects (with forms included)
    useEffect(() => {
        const fetchData = async () => {
            const token = sessionStorage.getItem("authToken");
            try {
                const [userRes, orgRes, projectRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/api/users/`, {
                        headers: { Authorization: `Token ${token}` },
                    }),
                    axios.get(`${BACKEND_URL}/api/organizations/`, {
                        headers: { Authorization: `Token ${token}` },
                    }),
                    axios.get(`${BACKEND_URL}/api/projects/`, {
                        headers: { Authorization: `Token ${token}` },
                    }),
                ]);
                setUsers(userRes.data);
                setOrgs(orgRes.data);
                if (userInfo?.username) {
                    const userDetailRes = await axios.get(`${BACKEND_URL}/api/users/${userInfo.username}/`, {
                        headers: { Authorization: `Token ${token}` },
                    });
                    const userData = userDetailRes.data;

                    // 1. Get all projects created by this user
                    const createdProjects = projectRes.data.filter(
                        (proj) => proj.created_by === userInfo.username
                    );

                    // 2. Get all org IDs from those projects
                    const orgIdsFromCreatedProjects = createdProjects.map((proj) => proj.organization);

                    // 3. Get assigned orgs from user profile
                    const assignedOrgIds = userData.profile?.organizations || [];

                    // 4. Merge and deduplicate
                    const finalOrgIds = Array.from(new Set([...orgIdsFromCreatedProjects, ...assignedOrgIds]));

                    setAllowedOrgIds(finalOrgIds);
                }
            } catch (err) {
                setUsers("");
                setOrgs("");
                setProjects("");
            }
        };
        fetchData();
    }, []);
    // console.log(users, orgs, projects);
    const filteredProjects = selectedOrg
        ? projects.filter(
            (p) => String(p.organization) === String(selectedOrg) ||
                String(p.organization?.id) === String(selectedOrg)
        )
        : [];

    const selectedProjectObj = filteredProjects.find(
        (p) => String(p.id) === String(selectedProject)
    );
    const forms = selectedProjectObj?.forms || [];


    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = sessionStorage.getItem("authToken");
        if (!selectedUser) return toast.error("Please select a user.");
        if (!selectedOrg) return toast.error("Please select an organization.");

        try {
            // 1️⃣ Fetch current user
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

            // 2️⃣ Only update organization list
            const updatedProfile = {
                ...currentProfile,
                organizations: Array.from(new Set([...currentProfile.organizations, selectedOrg])),
                active_user: activeUser,
                receive_updates: receiveUpdates,
            };

            // 3️⃣ Promote to role 2 (Org role) if needed
            const candidateRole = 2;
            const newRole = currentRole === 6 ? currentRole : Math.min(currentRole, candidateRole);

            // 4️⃣ PATCH update
            await axios.patch(
                `${BACKEND_URL}/api/users/${selectedUser}/`,
                { profile: updatedProfile, role: newRole },
                { headers: { Authorization: `Token ${token}` } }
            );

            toast.success("User assigned to organization successfully!");

            // 5️⃣ Reset selection
            setSelectedOrg("");
        } catch (err) {
            console.error(err);
            toast.error("Error assigning organization");
        }
    };

    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const roleMap = {
        1: "Admin",
        2: "Organization Manager",
        3: "Project Manager",
        4: "User",
        5: "Data Collector",
        6: "Officer",
    };


    return (
        <div className="">
            <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
                Assign User
            </h2>
            <form
                className="bg-white rounded-lg border border-black/70 p-4 grid grid-cols-1 gap-4 md:grid-cols-2"
                onSubmit={handleSubmit}
            >
                <div className="form-group relative w-full max-w-md" ref={dropdownRef}>
                    {/* Label */}
                    <label htmlFor="users" className="block mb-1 text-sm font-medium text-gray-700">
                        Users
                    </label>

                    {/* Trigger */}
                    <div
                        id="users"
                        className="w-full px-3 py-2 border rounded bg-white cursor-pointer"
                        onClick={() => setIsOpen((prev) => !prev)}
                    >
                        {selectedUser || "Select user"}
                    </div>

                    {/* Dropdown Panel */}
                    {isOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                            {/* Search bar and close button */}
                            <div className="flex items-center justify-between px-2 py-2 sticky top-0 bg-white z-10 border-b">
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-2 text-gray-500 hover:text-red-500 text-sm"
                                    title="Close"
                                >
                                    ✕
                                </button>
                            </div>

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
                                            setSearchTerm("");
                                        }}
                                    >
                                        {user.username} ({roleMap[user.role] || "Unknown"})
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
                        {orgs
                            .filter((org) => allowedOrgIds.includes(org.id))
                            .map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                    </select>
                </div>
                {/* <div className="col-span-1 form-group">
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
                </div> */}
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
                            !selectedOrg || !selectedUser
                        }
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AdminAssignOrg;
