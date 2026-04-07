import React, { useEffect, useMemo, useState } from 'react';
import axios from "axios";
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
import { BiWorld } from "react-icons/bi";
import { BACKEND_URL } from '../../../../config';
import Swal from "sweetalert2";

const getProjectFormCount = (project) => {
  if (typeof project?.forms_count === "number") {
    return project.forms_count;
  }
  if (Array.isArray(project?.forms)) {
    return project.forms.length;
  }
  return 0;
};

function SingleOrgProjectList({ organizationId, setAllProjects }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    let table;
    const initializeDataTable = () => {
      if (document.getElementById("AllProjectTable")) {
        table = new window.DataTable("#AllProjectTable");
      }
    };


    const fetchProjects = async () => {
      try {

        const params = new URLSearchParams();
        params.set('include_forms', 'true');
        if (organizationId) {
          params.set('organization', organizationId);
        }
        const res = await axios.get(`${BACKEND_URL}/api/projects/?${params.toString()}`, {
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
  const filteredProjects = useMemo(() => {
    return organizationId
      ? projects.filter(
        (project) =>
          String(project.organization) === String(organizationId) ||
          String(project.organization?.id) === String(organizationId)
      )
      : projects;
  }, [projects, organizationId]);

  useEffect(() => {
    setAllProjects(filteredProjects);
  }, [filteredProjects, setAllProjects]);


  // console.log("Filtered Projects: ", filteredProjects);

  const handleDelete = async (projectId) => {
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${projectId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      Swal.fire("Deleted!", "Project has been deleted.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to delete project.", "error");
    }
  };


  return (
    <div>
      <div className=" rounded-lg overflow-x-auto  bg-white border border-black/70 p-4">

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
                <td>{project.updated_at ? new Date(project.updated_at).toLocaleDateString("en-US", {
                  timeZone: "Asia/Dhaka",
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }) : "-"}</td>
                <td>{project.created_at ? new Date(project.created_at).toLocaleDateString("en-US", {
                  timeZone: "Asia/Dhaka",
                  year: "numeric",
                  month: "long",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }) : "-"}</td>
                <td>{project.status || "Active"}</td>
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
                    <button> <Link
                      to={`/projects/edit/${project.id}`}
                      className="no-underline"
                    ><FaEdit /></Link></button>
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
                          await handleDelete(projects.id);
                        }
                      }}
                    ><FaTrash /></button>
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

const IconGroup = () => (
  <div className=''>
    <img src="/other.svg" alt="other" className='w-6 h-6 text-blue-500' />
  </div>
);
