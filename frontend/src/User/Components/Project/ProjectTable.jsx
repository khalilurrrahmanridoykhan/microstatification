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

const getProjectFormCount = (project) => {
  if (Array.isArray(project?.forms)) {
    return project.forms.length;
  }
  if (typeof project?.forms_count === "number") {
    return project.forms_count;
  }
  return 0;
};

function ProjectTable({ organizationId }) {
  const [projects, setProjects] = useState([]);
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("AllProjectTable")) {
        dataTable = new window.DataTable("#AllProjectTable");
      }
    };

    const fetchProjects = async () => {
      try {
        // Get the user profile info using username
        const userResponse = await axios.get(`${BACKEND_URL}/api/users/${userInfo.username}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const projectIds = userResponse.data.profile.projects; // e.g., [2, 3, 5]
        console.log("Project IDs:", projectIds, userResponse);

        // Fetch each project by ID
        const projectPromises = projectIds.map((id) =>
          axios.get(`${BACKEND_URL}/api/projects/${id}/`, {
            headers: {
              Authorization: `Token ${token}`,
            },
          })
        );
        const projectResponses = await Promise.allSettled(projectPromises);

        // Filter only fulfilled responses and extract data
        const allProjects = projectResponses
          .filter(response => response.status === 'fulfilled')
          .map(response => response.value.data);

        setProjects(allProjects);
        console.log("User's Projects:", allProjects);

        setTimeout(() => {
          initializeDataTable();
        }, 1000);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
        setTimeout(() => {
          initializeDataTable([]);
        }, 0);
      }
    };

    fetchProjects();

    return () => {
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);



  // Filter projects by organizationId if provided
  const filteredProjects = organizationId
    ? projects.filter(
      (project) =>
        String(project.organization) === String(organizationId) ||
        String(project.organization?.id) === String(organizationId)
    )
    : projects;

  console.log("filterdddd : ", filteredProjects)

  return (
    <div>
      <div className="p-4 rounded-lg overflow-x-auto shadow-lg bg-white">
        <div className="header"><p className='tab-button active'>Project lists</p></div>
        <table className='display' id='AllProjectTable'>
          <thead>
            <tr>
              <th>SL No</th>
              <th>Project name</th>
              <th>Organization</th>
              <th>Form</th>
              <th>Update Date</th>
              <th>Create Date</th>
              <th>Status</th>
              <th>Surveyed Hosts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project, idx) => (
              <tr key={project.id}>
                <td> {String(idx + 1).padStart(2, "0")}.</td>
                <td>
                  <Link
                    to={`/projects/${project.id}/forms`}
                    className="no-underline"
                  >
                    {project.name}</Link></td>
                <td>{project.organization_name || project.organization?.name || project.organization}</td>
                <td>{getProjectFormCount(project) || "-"}</td>
                <td>{project.updated_at ? new Date(project.updated_at).toLocaleDateString() : "-"}</td>
                <td>{project.created_at ? new Date(project.created_at).toLocaleDateString() : "-"}</td>
                <td>{project.status || "Active"}</td>
                <td className="species-icons text-[var(--primary2)]">
                  <div className="flex gap-1">
                    {Array.isArray(project.species) && project.species.map((sp, i) => {
                      if (sp === 1) return <FaUser key={i} />;
                      if (sp === 2) return <GiElephant key={i} />;
                      if (sp === 3) return <FaVirusCovid key={i} />;
                      if (sp === 4) return <FaDog key={i} />;
                      if (sp === 5) return <PiCowFill key={i} />;
                      if (sp === 6) return <FaMosquito key={i} />;
                      if (sp === 7) return <IoBugSharp key={i} />;
                      return null;
                    })}
                  </div>
                </td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button ><Link to={`/projects/edit/${project.id}`}><FaEdit /></Link></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3">Total projects</td>
              <td>{filteredProjects.length}</td>
              <td colSpan="5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default ProjectTable;
