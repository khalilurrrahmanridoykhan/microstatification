import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

import { FaUser, FaClipboardList, FaCalendarAlt } from "react-icons/fa";
import SingleProTabPanel from "./SingleProTabPanel";
import { FaLocationDot } from "react-icons/fa6";
import { MdOutlineWork } from "react-icons/md";
import { FaBuildingUser } from "react-icons/fa6";
import { IoIosMail } from "react-icons/io";

function SingleProject() {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [organization, setOrganization] = useState(null);
    const [counts, setCounts] = useState({
        forms_count: null,
        submissions_count: null,
    });
    const [loadingCounts, setLoadingCounts] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem("authToken");
        let isMounted = true;

        const fetchProjectMeta = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                    params: {
                        include_forms: "false",
                    },
                });

                if (!isMounted) return;
                setProject(res.data);

                if (res.data?.organization) {
                    axios
                        .get(`${BACKEND_URL}/api/organizations/${res.data.organization}/`, {
                            headers: {
                                Authorization: `Token ${token}`,
                            },
                        })
                        .then((orgRes) => {
                            if (isMounted) {
                                setOrganization(orgRes.data);
                            }
                        })
                        .catch(() => {
                            if (isMounted) {
                                setOrganization(null);
                            }
                        });
                }
            } catch (error) {
                if (isMounted) {
                    setProject(null);
                    setOrganization(null);
                }
            } finally {
                if (isMounted) {
                    setLoadingProject(false);
                }
            }
        };

        const fetchProjectStats = async () => {
            try {
                const res = await axios.get(
                    `${BACKEND_URL}/api/projects/${projectId}/stats/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );
                if (!isMounted) return;
                setCounts({
                    forms_count: Number(res.data?.forms_count ?? 0),
                    submissions_count: Number(res.data?.submissions_count ?? 0),
                });
            } catch (error) {
                if (isMounted) {
                    setCounts({
                        forms_count: 0,
                        submissions_count: 0,
                    });
                }
            } finally {
                if (isMounted) {
                    setLoadingCounts(false);
                }
            }
        };

        fetchProjectMeta();
        fetchProjectStats();

        return () => {
            isMounted = false;
        };
    }, [projectId]);

    if (loadingProject) {
        return (
            <div className="flex items-center justify-center min-h-[220px]">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
                    <span>Loading project details...</span>
                </div>
            </div>
        );
    }
    if (!project) return <div>Project not found.</div>;

    return (
        <div>
            <div className="px-4">
                <SingleProjectProfile
                    project={project}
                    organization={organization}
                    totalForms={counts.forms_count}
                    totalSubmissions={counts.submissions_count}
                    loadingCounts={loadingCounts}
                />
            </div>

            <div className="px-1 mt-4 md:mt-8 md:px-4">
                <SingleProTabPanel projectId={project.id} projectData={project} />
            </div>
        </div>
    );
}

export default SingleProject;

const LoadingMetric = () => (
    <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin" />
        <span>Loading...</span>
    </div>
);

const SingleProjectProfile = ({
    project,
    organization,
    totalForms,
    totalSubmissions,
    loadingCounts,
}) => {

    return (
        <div className="w-full space-y-6">
            <h1 className="text-[16px] font-medium text-gray-700 leading-tight truncate">
                Project details
            </h1>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">

                    <div className="space-y-1 md:border-r border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-medium">Project name</div>
                        <div className="flex items-start text-gray-800 font-medium">
                            <MdOutlineWork className="w-4 h-4 mr-2 text-gray-500 mt-1 shrink-0" />
                            <p className="line-clamp-2 break-words">
                                {project?.name || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 md:border-r border-gray-200 ">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Organization name
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <FaBuildingUser className="w-4 h-4 mr-2 text-gray-500" />
                            {organization?.name || project?.organization_name || "-"}
                        </div>
                    </div>


                    <div className="space-y-1 md:border-r border-gray-200 ">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Email
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <IoIosMail className="w-4 h-4 mr-2 text-gray-500" />
                            {organization?.email || "-"}
                        </div>
                    </div>

                    <div className="space-y-1 md:border-r border-gray-200 ">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Created By
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <FaUser className="w-4 h-4 mr-2 text-gray-500" />
                            {project?.created_by || "-"}
                        </div>
                    </div>

                    <div className="space-y-1 md:border-r border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Last Updated
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <FaCalendarAlt className="w-4 h-4 mr-2 text-gray-500" />
                            {project?.updated_at
                                ? new Date(project.updated_at).toLocaleDateString()
                                : "-"}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Total Forms
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <FaClipboardList className="w-4 h-4 mr-2 text-gray-500" />
                            {loadingCounts ? <LoadingMetric /> : totalForms}
                        </div>
                    </div>

                    <div className="space-y-1 md:border-r border-gray-200">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Total Submissions
                        </div>
                        <div className="text-gray-800 font-medium">
                            {loadingCounts ? <LoadingMetric /> : totalSubmissions}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                            Location
                        </div>
                        <div className="flex items-center text-gray-800 font-medium">
                            <FaLocationDot className="w-4 h-4 mr-2 text-gray-500" />
                            {project?.location || organization?.location || "-"}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
