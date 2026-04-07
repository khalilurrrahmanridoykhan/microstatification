import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaUser } from "react-icons/fa";
import { FaMosquito } from "react-icons/fa6";
import { FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../config";

function OrgTable() {
  const [organizations, setOrganizations] = useState([]);
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("orgTable")) {
        dataTable = new window.DataTable("#orgTable");
      }
    };

    const fetchOrganizations = async () => {
      try {
        const userResponse = await axios.get(`${BACKEND_URL}/api/users/${userInfo.username}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const orgIds = userResponse.data.profile.organizations; // e.g., [1, 4]

        // Fetch each organization by ID
        const orgPromises = orgIds.map((id) =>
          axios.get(`${BACKEND_URL}/api/organizations/${id}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          })
        );

        const orgResponses = await Promise.all(orgPromises);
        const allOrganizations = orgResponses.map(res => res.data);

        setOrganizations(allOrganizations);
        console.log("User's Organizations:", allOrganizations);

        setTimeout(() => {
          initializeDataTable();
        }, 1000);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
        setTimeout(() => {
          initializeDataTable([]);
        }, 0);
      }
    };

    fetchOrganizations();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);


  return (
    <div className="p-4 overflow-x-auto bg-white rounded-lg shadow-lg ">

      <table
        id="orgTable"
        className=" border-collapse table-auto display"
      >
        <thead>
          <tr>
            <th>SL No</th>
            <th>Organization name</th>
            <th>Type</th>
            <th>Website</th>
            <th>Email</th>
            <th>Location</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org, idx) => (
            <tr key={org.id}>
              <td>{String(idx + 1).padStart(2, "0")}.</td>
              <td>
                <Link
                  to={`/organization/single-org/${org.id}`}
                  className="no-underline"
                >
                  {org.name}
                </Link>
              </td>
              <td>{org.type}</td>
              <td>{org.website}</td>
              <td>{org.email}</td>
              <td>{org.location}</td>
              <td>{org.active_user ? "Active" : "Inactive"}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button>
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
  );
}

export default OrgTable;
