import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

function OrgUser({ setAllUsers }) {
  const [users, setOrgUsers] = useState([]);
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  const roleMap = {
    1: "Admin",
    2: "Organizer",
    3: "Project Admin",
    4: "User",
    5: "Data Collector",
    6: "Officer",
  };

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let dataTable;

    const initializeDataTable = (data) => {
      if (document.getElementById("AllUserTable")) {
        dataTable = new window.DataTable("#AllUserTable");
      }
    };

    const fetchUsersByOrg = async () => {
      try {
        // 1. Fetch current user info safely
        const myUserInfoRes = await axios.get(`${BACKEND_URL}/api/users/${userInfo?.username}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const myOrgs = myUserInfoRes?.data?.profile?.organizations || [];

        // If current user has no orgs, skip filtering
        if (!Array.isArray(myOrgs) || myOrgs.length === 0) {
          setOrgUsers([]);
          return;
        }

        // 2. Fetch all users
        const allUsersRes = await axios.get(`${BACKEND_URL}/api/users/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const allUsers = Array.isArray(allUsersRes.data) ? allUsersRes.data : [];

        // 3. Filter users who share any org with current user
        const filteredUsers = allUsers.filter(user => {
          const userOrgs = user?.profile?.organizations || [];
          return userOrgs.some(id => myOrgs.includes(id));
        });

        setOrgUsers(filteredUsers);
        setAllUsers(filteredUsers); // Updating parent state 
        setTimeout(() => {
          initializeDataTable(filteredUsers);
        }, 1000);
      } catch (error) {
        console.error("Error fetching users by org:", error);
        setOrgUsers([]); // fallback to empty if error
      }
    };

    fetchUsersByOrg();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);

  return (
    <div>
      <div className="p-4 bg-white ">
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
              {users.length > 0 ? users
                .filter((user) => user.username)
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
                          onClick={() =>
                            navigate(`/user/edit/${user.username}`)
                          }
                        >
                          <FaEdit />
                        </button>
                        <button>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan="6" className="text-center">No forms available</td>
                    <td colSpan="5" className="text-center hidden">No forms available</td>
                    <td colSpan="5" className="text-center hidden">No forms available</td>
                    <td colSpan="5" className="text-center hidden">No forms available</td>
                    <td colSpan="5" className="text-center hidden">No forms available</td>
                    <td colSpan="5" className="text-center hidden">No forms available</td>

                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default OrgUser;
