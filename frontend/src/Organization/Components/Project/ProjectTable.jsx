import React, { useEffect, useState } from 'react';
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import "./OrgTable.css";
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { FaMosquito, FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaCat } from "react-icons/fa";
import { FaBacterium } from "react-icons/fa";
import { GiBat } from "react-icons/gi";
import { FaHome, FaBell, FaCog } from 'react-icons/fa';
import Swal from "sweetalert2";
import malariaIcon from "/images/malaria.png"
import { BiWorld } from "react-icons/bi";

const getProjectFormCount = (project) => {
  if (typeof project?.forms_count === "number") {
    return project.forms_count;
  }
  if (Array.isArray(project?.forms)) {
    return project.forms.length;
  }
  return 0;
};

function ProjectTable({ organizationId }) {
  const [projects, setProjects] = useState([]);
  const token = sessionStorage.getItem("authToken");
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const profile = userInfo.profile || {};
  const headers = { Authorization: `Token ${token}` };

  useEffect(() => {
    let dataTable;

    const initTable = () => {
      if (document.getElementById("AllProjectTable")) {
        dataTable = new window.DataTable("#AllProjectTable");
      }
    };

    const fetchByIds = async (ids = []) => {
      const results = await Promise.allSettled(
        ids.map(id =>
          axios
            .get(`${BACKEND_URL}/api/projects/${id}/`, { headers })
            .then(r => r.data)
        )
      );
      return results
        .filter(r => r.status === "fulfilled")
        .map(r => r.value);
    };

    const fetchProjectsByOrganizations = async (orgIds = []) => {
      const uniqueOrgIds = Array.from(new Set((orgIds || []).filter(Boolean)));
      if (!uniqueOrgIds.length) {
        return [];
      }
      const requests = uniqueOrgIds.map((orgId) =>
        axios
          .get(`${BACKEND_URL}/api/projects/?organization=${orgId}`, { headers })
          .then((r) => r.data)
      );
      const responses = await Promise.allSettled(requests);
      return responses
        .filter((response) => response.status === "fulfilled")
        .flatMap((response) => response.value || []);
    };

    const loadProjects = async () => {
      try {
        const directProjects = await fetchByIds(profile.projects || []);
        const orgProjects = await fetchProjectsByOrganizations(
          profile.organizations || []
        );

        /* 3️⃣  Merge + dedupe */
        const merged = [...directProjects, ...orgProjects];
        const visibleProjects = Array.from(
          new Map(merged.map(p => [p.id, p])).values()
        );

        /* 4️⃣  Optional organisation filter */
        const finalList = organizationId
          ? visibleProjects.filter(
            p => String(p.organization) === String(organizationId)
          )
          : visibleProjects;

        setProjects(finalList);
        setTimeout(initTable, 800);
      } catch (err) {
        console.error("Failed to load projects:", err);
        setProjects([]);
        initTable();
      }
    };

    loadProjects();

    return () => {
      if (dataTable) dataTable.destroy();
    };
  }, [organizationId]);


  console.log("Filtered Projects:", projects);

  const handleDelete = async (projectId) => {
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${projectId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const table = $('#AllProjectTable').DataTable();
      table.destroy();

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setTimeout(() => {
        new window.DataTable("#AllProjectTable");
      }, 100); // wait for DOM to re-render

      Swal.fire("Deleted!", "Project has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to delete project.", "error");
    }
  };

  return (
    <div>
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        All Projects
      </h2>
      <div className="p-4 rounded-lg overflow-x-auto border border-black/70 bg-white">

        <table className='display' id='AllProjectTable'>
          <thead>
            <tr>
              <th>SL No</th>
              <th>Project name</th>
              <th>Organization</th>
              <th>Form</th>
              <th>Update Date</th>
              <th>Create Date</th>
              {/* <th>Status</th> */}
              <th>Surveyed Hosts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, idx) => (
              <tr key={project.id}>
                <td className="p-3 whitespace-nowrap">{String(idx + 1).padStart(2, "0")}.</td>
                <td className='p-3 max-w-[200px] truncate'>
                  <Link
                    to={`/projects/${project.id}/forms`}
                    className="no-underline"
                  >
                    {project.name}</Link></td>
                <td>{project.organization_name || project.organization?.name || project.organization}</td>
                <td>{getProjectFormCount(project) || "-"}</td>
                <td>
                  {project.updated_at
                    ? new Date(project.updated_at).toLocaleDateString("en-US", {
                      timeZone: "Asia/Dhaka",
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : "0"}
                </td>
                <td>
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString("en-US", {
                      timeZone: "Asia/Dhaka",
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : "0"}
                </td>

                {/* <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${project.active_user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {project.active_user ? "Active" : "Inactive"}
                  </span>
                </td> */}

                <td className="species-icons text-[var(--primary2)]">
                  <div className="flex gap-1">
                    {Array.isArray(project.species) && project.species.map((sp, i) => {
                      if (sp === 1) return <FaUser key={i} />;
                      if (sp === 2) return <FaDog key={i} />;
                      if (sp === 3) return <FaCat key={i} />;
                      if (sp === 4) return <FaMosquito key={i} />;
                      if (sp === 5) return <FaBacterium key={i} />;
                      if (sp === 6) return <GiBat key={i} />;
                      if (sp === 7) return <BiWorld key={i} />;
                      if (sp === 8) return <FaMosquito key={i} />;
                      return null;
                    })}
                  </div>
                </td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button>
                      <Link to={`/projects/edit/${project.id}`}>
                        <FaEdit />
                      </Link>
                    </button>
                    <button
                      onClick={async () => {
                        const result = await Swal.fire({
                          title: "Are you sure?",
                          text: "This will delete the project and all related forms.",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonColor: "#d33",
                          cancelButtonColor: "#3085d6",
                          confirmButtonText: "Yes, delete it!",
                        });
                        if (result.isConfirmed) {
                          await handleDelete(project.id);
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
          <tfoot>
            <tr>
              <td colSpan="2">Total projects</td>
              <td>{projects.length}</td>
              <td colSpan="5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default ProjectTable;

const IconGroup = () => (
  <div className=''>
    <img src="/sp.png" alt="other" className='w-6 h-6 text-blue-500' />
  </div>
);


