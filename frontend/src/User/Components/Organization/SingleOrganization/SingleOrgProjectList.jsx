import React, { useEffect, useState } from 'react';
import axios from "axios";
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { FaMosquito, FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { BACKEND_URL } from '../../../../config';
import { Link } from 'react-router-dom';

const getProjectFormCount = (project) => {
  if (typeof project?.forms_count === "number") {
    return project.forms_count;
  }
  if (Array.isArray(project?.forms)) {
    return project.forms.length;
  }
  return 0;
};

function SingleOrgProjectList({ organizationId }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let table;
         const initializeDataTable = () => {
            if (document.getElementById("AllForm")) {
                table = new window.DataTable("#AllForm");
            }
        };


    const fetchProjects = async () => {
      try {
        
        const baseUrl = `${BACKEND_URL}/api/projects/`;
        const url = organizationId
          ? `${baseUrl}?organization=${organizationId}`
          : baseUrl;
        const res = await axios.get(url, {
          headers: { Authorization: `Token ${token}` },
        });
        setProjects(res.data);
        setTimeout(() => {
          initializeDataTable()
        }, 1000);
      } catch (error) {
        setProjects([]);
        setTimeout(() => {
                    initializeDataTable([]);
                }, 0);
      }
    };
    fetchProjects();

     
    return () => {
      if (table) table.destroy();
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

    console.log("Filtered Projects: ", filteredProjects);

  return (
    <div>
      <div className=" rounded-lg overflow-x-auto  bg-white">
        
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
                <td>{String(idx + 1).padStart(2, "0")}.</td>
                <td><Link
                                                        to={`/projects/${project.id}/forms`}
                                                        className="no-underline"
                                                      >{project.name}</Link></td>
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
                    <button> <Link
                                                        to={`/projects/edit/${project.id}`}
                                                        className="no-underline"
                                                      ><FaEdit /></Link></button>
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

export default SingleOrgProjectList;
