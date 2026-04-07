import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { BACKEND_URL } from "../../../../config";

function SingleProjectUser({ projectId }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("AllUserTable")) {
        dataTable = new window.DataTable("#AllUserTable");
      }
    };

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const [usersRes, formsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/api/users/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          axios.get(`${BACKEND_URL}/api/projects/${projectId}/forms/`, {
            headers: { Authorization: `Token ${token}` },
            params: { include_submissions: "false", compact: "true" },
          }),
        ]);

        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        const formIds = new Set(
          (Array.isArray(formsRes.data) ? formsRes.data : []).map((form) =>
            Number(form.id)
          )
        );
        const projectIdNum = Number(projectId);

        const filteredUsers = allUsers.filter((user) => {
          const userProjects = (user.profile?.projects || []).map(Number);
          const userForms = (user.profile?.forms || []).map(Number);

          const isInProject = userProjects.includes(projectIdNum);
          const isInForms = userForms.some((formId) => formIds.has(formId));

          return isInProject || isInForms;
        });

        setUsers(filteredUsers);
      } catch (err) {
        console.error(err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
        setTimeout(() => {
          initializeDataTable();
        }, 250);
      }
    };

    fetchUsers();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, [projectId]);

  const handleConfirmDelete = async (username) => {
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.delete(`${BACKEND_URL}/api/users/${username}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const table = $('#AllUserTable').DataTable();
      table.destroy();
      setUsers((prev) => prev.filter((user) => user.username !== username));
      setTimeout(() => {
        new window.DataTable("#AllUserTable");
      }, 100); // wait for DOM to re-render

    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  return (
    <div>
      <div className="">
        {loadingUsers ? (
          <div className="flex items-center justify-center min-h-[180px] bg-white border rounded-lg border-black/70">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
              <span>Loading users...</span>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-lg p-4 border border-black/70 overflow-x-auto">
          <table id="AllUserTable" className="display table-auto">
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
              {users
                .filter((user) => user.username)
                .map((user, idx) => (
                  <tr key={user.username}>
                    <td className="w-[100px]">{idx + 1}</td>
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
                        <button
                          onClick={async () => {
                            const result = await Swal.fire({
                              title: "Are you sure?",
                              text: "This will delete the user permanently.",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Yes, delete it!",
                            });

                            if (result.isConfirmed) {
                              try {
                                await handleConfirmDelete(user.username);
                                Swal.fire("Deleted!", "The user has been deleted.", "success");
                              } catch (error) {
                                Swal.fire("Error!", "Failed to delete the user.", "error");
                                console.error(error);
                              }
                            }
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

export default SingleProjectUser;
