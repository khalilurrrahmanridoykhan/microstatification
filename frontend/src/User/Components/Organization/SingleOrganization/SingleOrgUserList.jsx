import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

function SingleOrgUserList({ organizationId, setAllUsers }) {
  const token = sessionStorage.getItem("authToken");
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const [orgUsers, setOrgUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsersByOrg = async () => {
      try {



        // // 1. Fetch current user info safely
        // const myUserInfoRes = await axios.get(`${BACKEND_URL}/api/users/${userInfo?.username}/`, {
        //   headers: { Authorization: `Token ${token}` },
        // });

        // const myOrgs = myUserInfoRes?.data?.profile?.organizations || [];

        // // If current user has no orgs, skip filtering
        // if (!Array.isArray(myOrgs) || myOrgs.length === 0) {
        //   setOrgUsers([]);
        //   return;
        // }

        // 2. Fetch all users
        const allUsersRes = await axios.get(`${BACKEND_URL}/api/users/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const allUsers = Array.isArray(allUsersRes.data) ? allUsersRes.data : [];
        console.log("id: ", organizationId);
        // 3. Filter users who share any org with current user
        const filteredUsers = allUsers.filter(user => {
          const userOrgs = user?.profile?.organizations || [];
          return userOrgs.includes(organizationId)
        });

        setOrgUsers(filteredUsers);
        setAllUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users by org:", error);
        setOrgUsers([]); // fallback to empty if error
      }
    };

    fetchUsersByOrg();
  }, []);

  return (
    <div>
      <div className="p-4 bg-white rounded-lg shadow-md">

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
              {orgUsers
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
                          onClick={() => navigate(`/user/edit/${user.username}`)}
                          disabled={user.role <= 3}
                          className={user.role <= 3 ? "opacity-40 cursor-not-allowed" : ""}
                        >
                          <FaEdit className={user.role <= 3 ? "opacity-40 cursor-not-allowed" : ""} />
                        </button>
                        <button>
                          <FaTrash className={user.role <= 3 ? "opacity-40 cursor-not-allowed" : ""} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SingleOrgUserList