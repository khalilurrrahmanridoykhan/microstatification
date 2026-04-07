import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { Link } from "react-router-dom";
import "./MiniCard.css";

function DashboardMiniCard() {
    const [orgStats, setOrgStats] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = sessionStorage.getItem("authToken");
    const headers = { Authorization: `Token ${token}` };

    console.log("orgStats: ", orgStats);



    useEffect(() => {

        async function fetchOrgStats() {
            try {
                const summaryRes = await axios.get(
                    `${BACKEND_URL}/api/dashboard/summary/`,
                    { headers }
                );
                const stats = summaryRes.data?.org_stats || [];
                const normalized = stats.map((entry) => ({
                    id: entry.id,
                    name: entry.name,
                    projectCount: entry.project_count,
                }));
                setOrgStats(normalized);
                setLoading(false);
            } catch (err) {
                setOrgStats([]);
                setLoading(false);
            }
        }
        fetchOrgStats();
    }, []);

    return (
        <div>
            <div className="border border-black/70 new-data-section">
                <h2 className="new-data-title">Organization Project Count</h2>
                {loading ? (
                    <div>
                        <div className="py-8 text-center">
                            <span className="block mb-2 text-gray-600">Loading...</span>
                            <span className="block w-8 h-8 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></span>
                        </div>
                    </div>
                ) : (
                    <ul className="new-data-list">
                        {orgStats.slice(0, 4).map((org, idx) => (
                            <li className="new-data-item" key={org.name + idx}>
                                <div className="data-info">
                                    <div className="data-icon-container napm">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                        </svg>
                                    </div>
                                    <div className="data-details">
                                        <div className="data-name">
                                            <Link
                                                to={`/organization/single-org/${org.id}`}
                                                className="hover:underline"
                                            >
                                                {org.name}
                                            </Link>
                                        </div>
                                        <div className="data-time">Projects</div>
                                    </div>
                                </div>
                                <div className="data-value">{org.projectCount}</div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-2 text-right">
                    <Link to="/organization/all" className=" hover:underline">
                        Show all &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DashboardMiniCard;
