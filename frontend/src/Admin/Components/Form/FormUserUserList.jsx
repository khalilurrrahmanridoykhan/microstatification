import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";


function FormUserUserList() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

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

    const initializeDataTable = () => {
      if (document.getElementById("AllUserTable")) {
        dataTable = new window.DataTable("#AllUserTable");
      }
    };

    axios
      .get(`${BACKEND_URL}/api/users/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => {
        const roleOneUsers = res.data.filter((user) => user.role === 4);
        setUsers(roleOneUsers);

        setTimeout(() => {
          initializeDataTable();
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
        setUsers([]);

        setTimeout(() => {
          initializeDataTable([]);
        }, 0);
      });

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
              {users
                .filter((user) => user.username)
                .map((user, idx) => (
                  <tr key={user.username}>
                    <td>{idx + 1}</td>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{roleMap[user.role] || "Unknown"}</td>
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
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FormUserUserList;
