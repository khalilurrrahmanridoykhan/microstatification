import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

function SingleOrgUserList({ organizationId, setAllUsers, allProjects }) {
  const token = sessionStorage.getItem("authToken");
  const headers = { Authorization: `Token ${token}` };
  const [orgUsers, setOrgUsers] = useState([]);
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  useEffect(() => {
    let table;

    const initializeDataTable = () => {
      if (document.getElementById("AllUserTable")) {
        table = new window.DataTable("#AllUserTable");
      }
    };

    const fetchUsersByOrg = async () => {
      try {
        const projectsRes = await axios.get(`${BACKEND_URL}/api/projects/`, { headers });
        const orgProjects = projectsRes.data.filter(p => p.organization === organizationId);
        const orgProjectIds = orgProjects.map(p => p.id);

        const formIds = new Set(
          orgProjects.flatMap(p => (p.forms || []).map(f => f.id))
        );

        const usersRes = await axios.get(`${BACKEND_URL}/api/users/`, { headers });
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];

        const filteredUsers = allUsers.filter(user => {
          const { organizations = [], projects = [], forms = [] } = user.profile || {};

          const orgMatch = organizations.includes(organizationId);
          const projMatch = projects.some(pid => orgProjectIds.includes(pid));
          const formMatch = forms.some(fid => formIds.has(fid));

          return orgMatch || projMatch || formMatch;
        });

        setOrgUsers(filteredUsers);
        setAllUsers(filteredUsers);

        setTimeout(() => initializeDataTable(), 1000);
      } catch (error) {
        console.error("Error fetching org-related users:", error);
        setOrgUsers([]);
        setAllUsers([]);
        setTimeout(() => initializeDataTable(), 200);
      }
    };

    fetchUsersByOrg();

    return () => {
      if (table) table.destroy();
    };
  }, []);

  return (
    <div>
      <div className="rounded-lg overflow-x-auto  bg-white border border-black/70 p-4">

        <div className="table-container">
          <table id="AllUserTable" className="display">
            <thead>
              <tr>
                <th>SL No.</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.filter((user) => user.username).length > 0 ? (
                orgUsers
                  .map((user, idx) => (
                    <tr key={user.username}>
                      <td>{idx + 1}</td>
                      <td>
                        {user.first_name} {user.last_name}
                      </td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td className="action-buttons">
                        <div className="flex gap-2">
                          <button
                            className="disabled:opacity-50"
                            onClick={() => navigate(`/user/edit/${user.username}`)}
                            disabled={userInfo.role >= user.role}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={userInfo.role >= user.role} >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    No users found.
                  </td>
                  <td colSpan="6" className="text-center text-gray-500 py-4 hidden">
                    No users found.
                  </td>
                  <td colSpan="6" className="text-center text-gray-500 py-4 hidden">
                    No users found.
                  </td>
                  <td colSpan="6" className="text-center text-gray-500 py-4 hidden">
                    No users found.
                  </td>
                  <td colSpan="6" className="text-center text-gray-500 py-4 hidden">
                    No users found.
                  </td>
                  <td colSpan="6" className="text-center text-gray-500 py-4 hidden">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default SingleOrgUserList