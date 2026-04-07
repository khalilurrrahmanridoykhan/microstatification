import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaUser } from "react-icons/fa";
import { FaMosquito } from "react-icons/fa6";
import { FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { BACKEND_URL } from "../../../config";

function OrgTable() {
  const [organizations, setOrganizations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    if (!token) return;

    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const orgIds = userInfo?.profile?.organizations || [];
    const headers = { Authorization: `Token ${token}` };

    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("orgTable")) {
        dataTable = new window.DataTable("#orgTable");
      }
    };

    const fetchOrganizations = async () => {
      const results = await Promise.allSettled(
        orgIds.map(id =>
          axios.get(`${BACKEND_URL}/api/organizations/${id}/`, { headers }).then(res => res.data)
        )
      );

      const orgs = results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value);

      setOrganizations(orgs);

      setTimeout(() => {
        initializeDataTable();
      }, 1000);
    };

    fetchOrganizations().catch(err => {
      console.error("Failed to fetch organizations:", err);
      setOrganizations([]);
      setTimeout(() => initializeDataTable(), 0);
    });

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);

  // Edit organization
  const handleEdit = async (orgId, updatedData) => {
    const token = sessionStorage.getItem("authToken");
    await axios.put(`${BACKEND_URL}/api/organizations/${orgId}/`, updatedData, {
      headers: { Authorization: `Token ${token}` },
    });
  };

  // Delete organization
  const handleDelete = async (orgId) => {
    const token = sessionStorage.getItem("authToken");
    await axios.delete(`${BACKEND_URL}/api/organizations/${orgId}/`, {
      headers: { Authorization: `Token ${token}` },
    });
  };

  return (
    <div>
      <h2 className="inline-block mb-4  text-black text-[22px] border-b-2 border-blue-400 border-solid">
        All Organizations
      </h2>
      <div className="p-4 overflow-x-auto bg-white rounded-lg border border-black/70 ">
        <table id="orgTable" className="border-collapse table-auto display">
          <thead>
            <tr>
              <th className="max-w-[100px]">SL No</th>
              <th>Organization</th>
              <th>Type</th>
              <th>Website</th>
              <th>Email</th>
              <th>Location</th>
              {/* <th>Status</th> */}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org, idx) => (
              <tr key={org.id}>
                <td className=" truncate max-w-[100px]">
                  {String(idx + 1).padStart(2, "0")}.
                </td>
                <td className="p-3 max-w-[200px] truncate" title={org.name}>
                  <Link
                    to={`/organization/single-org/${org.id}`}
                    className="no-underline"
                  >
                    {org.name}
                  </Link>
                </td>
                <td>{org.type}</td>
                <td className="p-3 max-w-[150px] truncate" title={org.website}>
                  <a
                    href={
                      org.website.startsWith("http")
                        ? org.website
                        : `https://${org.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 truncate hover:underline"
                  >
                    {org.website}
                  </a>
                </td>
                <td className="p-3 truncate" title={org.email}>
                  {org.email}
                </td>
                <td>{org.location}</td>
                {/* <td>{org.active_user ? "Active" : "Inactive"}</td> */}
                <td className="">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/organization/edit/${org.id}`)}
                    >
                      <FaEdit className=" w-5 h-5 text-[#1f93f2]" />
                    </button>
                    {/* <button
                      onClick={async () => {
                        const result = await Swal.fire({
                          title: "Are you sure?",
                          text: "This will also delete all related projects and forms.",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonColor: "#d33",
                          cancelButtonColor: "#3085d6",
                          confirmButtonText: "Yes, delete it!",
                        });
                        if (result.isConfirmed) {
                          await handleDelete(org.id);
                          setOrganizations((prev) =>
                            prev.filter((o) => o.id !== org.id)
                          );
                          Swal.fire(
                            "Deleted!",
                            "Organization has been deleted.",
                            "success"
                          );
                        }
                      }}
                    >
                      <FaTrash />
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="2" className="text-red-600 ">
                Totals:
              </th>
              <th className="text-red-600"></th>
              <th className="text-red-600"></th>
              <th colSpan="4"></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  );
}

export default OrgTable;
