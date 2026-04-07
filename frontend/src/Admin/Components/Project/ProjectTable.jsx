import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import "./OrgTable.css";
import { FaEdit, FaTrash, FaUser } from "react-icons/fa";
import { FaMosquito, FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import { FaCat } from "react-icons/fa";
import { FaBacterium } from "react-icons/fa";
import { GiBat } from "react-icons/gi";
import { FaHome, FaBell, FaCog } from "react-icons/fa";
import Swal from "sweetalert2";
import malariaIcon from "/images/malaria.png";
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
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const username = userInfo?.username;
    const assignedProjectIds = userInfo?.profile?.projects || [];
    let dataTable;

    const initializeDataTable = () => {
      if (document.getElementById("AllProjectTable")) {
        dataTable = new window.DataTable("#AllProjectTable");
      }
    };

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    setLoading(true);
    setLoadingProgress(0);

    axios
      .get(`${BACKEND_URL}/api/projects/user-projects/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setLoadingProgress(percentCompleted);
          }
        },
      })
      .then((res) => {
        clearInterval(progressInterval);
        setLoadingProgress(100);

        // Backend now returns pre-filtered projects - no need for frontend filtering
        setProjects(res.data);

        setTimeout(() => {
          setLoading(false);
          initializeDataTable();
        }, 500);
      })
      .catch((err) => {
        console.error(err);
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setProjects([]);
        setLoading(false);
        setTimeout(() => {
          initializeDataTable();
        }, 0);
      });

    return () => {
      clearInterval(progressInterval);
      if (dataTable) {
        dataTable.destroy();
      }
    };
  }, []);

  const handleDelete = async (projectId) => {
    const token = sessionStorage.getItem("authToken");
    try {
      await axios.delete(`${BACKEND_URL}/api/projects/${projectId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const table = $("#AllProjectTable").DataTable();
      table.destroy();

      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      // Reinitialize DataTable after state update
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

      {loading && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-black/70 mb-4">
          <div className="w-full max-w-md">
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-lg font-semibold text-gray-700">
                Loading Projects...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                style={{ width: `${loadingProgress}%` }}
              >
                <span className="text-xs font-bold text-white">
                  {loadingProgress}%
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-2">
              {loadingProgress < 100
                ? "Fetching your projects..."
                : "Almost ready!"}
            </p>
          </div>
        </div>
      )}

      <div
        className={`p-4 rounded-lg overflow-x-auto border border-black/70 bg-white ${
          loading ? "hidden" : ""
        }`}
      >
        <table
          className="border-collapse table-auto  display"
          id="AllProjectTable"
        >
          <thead>
            <tr>
              <th>SL No</th>
              <th className="w-[200px]">Project name</th>
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
                <td className="p-3 whitespace-nowrap">
                  {String(idx + 1).padStart(2, "0")}.
                </td>
                <td className="p-3 max-w-[200px] truncate text-start overflow-hidden whitespace-nowrap">
                  <Link
                    to={`/projects/${project.id}/forms`}
                    className="no-underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td>
                  {project.organization_name ||
                    project.organization?.name ||
                    project.organization}
                </td>
                <td>{getProjectFormCount(project) || "-"}</td>
                <td>
                  {project.updated_at
                    ? new Date(project.updated_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {project.created_at
                    ? new Date(project.created_at).toLocaleDateString()
                    : "-"}
                </td>
                {/* <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${project.active_user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {project.active_user ? "Active" : "Inactive"}
                  </span>
                </td> */}

                <td className="species-icons text-[var(--primary2)]">
                  <div className="flex gap-1">
                    {Array.isArray(project.species) &&
                      project.species.map((sp, i) => {
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
  <div className="">
    <img src="/other.svg" alt="other" className="w-8 h-8 text-blue-500" />
  </div>
);
