import React, { useEffect, useState } from 'react';
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { FaMosquito, FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { Link } from 'react-router-dom';
import { FaCat } from "react-icons/fa";
import { FaHome, FaBell, FaCog } from 'react-icons/fa';
import Swal from "sweetalert2";
import { FaBacterium } from "react-icons/fa";
import { GiElephant, GiCow, GiBat } from "react-icons/gi";
import { HiOutlineQuestionMarkCircle } from "react-icons/hi";
import { BiWorld } from "react-icons/bi";

const IconGroup = () => (
    <div className=''>
        <BiWorld className='w-6 h-6 text-blue-500' />
    </div>
);


const speciesIconMap = {
    1: <FaUser />,        // Human
    2: <FaDog />,         // Dog
    3: <FaCat />,         // Cat
    4: <FaMosquito />,    // Mosquito
    5: <FaBacterium />,   // Bacterium
    6: <GiBat />,         // Bat
    7: <BiWorld />,       // Other
    8: <FaMosquito />,    // Duplicate of 4
};


const getProjectFormCount = (project) => {
    if (typeof project?.forms_count === "number") {
        return project.forms_count;
    }
    if (Array.isArray(project?.forms)) {
        return project.forms.length;
    }
    return 0;
};

function AllProjects() {
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

        const loadProjects = async () => {
            try {
                const username = userInfo.username;

                // 1. Get latest user with projects + profile info
                const userRes = await axios.get(`${BACKEND_URL}/api/users/${username}/`, { headers });
                const freshUser = userRes.data;
                const assignedProjectIds = freshUser.profile?.projects || [];

                // 2. Get all projects once
                const allProjectsRes = await axios.get(`${BACKEND_URL}/api/projects/`, { headers });
                const allProjects = allProjectsRes.data;

                // 3. Created by this user
                const createdProjects = allProjects.filter(p => p.created_by === username);

                // 4. Assigned to this user
                const assignedProjects = allProjects.filter(p => assignedProjectIds.includes(p.id));

                // 5. Merge + dedupe
                const projectMap = new Map();
                [...createdProjects, ...assignedProjects].forEach(p => projectMap.set(p.id, p));
                const uniqueProjects = Array.from(projectMap.values());

                setProjects(uniqueProjects);
                setTimeout(initTable, 1000);
            } catch (err) {
                console.error("Failed to load user projects:", err);
                setProjects([]);
                initTable();
            }
        };


        loadProjects();

        return () => {
            if (dataTable) dataTable.destroy();
        };
    }, []);


    console.log("Filtered Projects:", projects);

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
                                <td>{project.updated_at ? new Date(project.updated_at).toLocaleString("en-US", {
                                    timeZone: "Asia/Dhaka",
                                    year: "numeric",
                                    month: "long",
                                    day: "2-digit",
                                    // hour: "2-digit",
                                    // minute: "2-digit",
                                    // second: "2-digit",
                                    hour12: true, // Enables AM/PM
                                }) : "-"}</td>
                                <td>{project.created_at ? new Date(project.created_at).toLocaleString("en-US", {
                                    timeZone: "Asia/Dhaka",
                                    year: "numeric",
                                    month: "long",
                                    day: "2-digit",
                                    // hour: "2-digit",
                                    // minute: "2-digit",
                                    // second: "2-digit",
                                    hour12: true, // Enables AM/PM
                                }) : "-"}</td>
                                {/* <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs ${project.active_user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {project.active_user ? "Active" : "Inactive"}
                  </span>
                </td> */}

                                <td className="species-icons text-[var(--primary2)]">
                                    <div className="flex gap-1">
                                        {Array.isArray(project.species) && project.species.map((sp, i) =>
                                            <span key={i} className="inline-block mr-1 align-middle">
                                                {speciesIconMap[sp] || null}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="">
                                    <div className="flex gap-2">
                                        <button>
                                            <Link to={`/projects/edit/${project.id}`}>
                                                <FaEdit className='w-6 h-6 cursor-pointer' />
                                            </Link>
                                        </button>
                                        {/* <button
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
                                        </button> */}
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

export default AllProjects;



