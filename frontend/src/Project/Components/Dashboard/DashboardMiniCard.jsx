import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { Link } from "react-router-dom";
import "./MiniCard.css";

export default function DashboardMiniCard() {
    const [stats, setStats] = useState([]);

    useEffect(() => {
        (async () => {
            const token = sessionStorage.getItem("authToken");
            const rawUserInfo = sessionStorage.getItem("userInfo");
            if (!token || !rawUserInfo) return;

            const { username } = JSON.parse(rawUserInfo);

            try {
                /* 1️⃣ user → projects[] */
                const userRes = await axios.get(
                    `${BACKEND_URL}/api/users/${username}/`,
                    { headers: { Authorization: `Token ${token}` } }
                );
                const projectIDs = userRes.data?.profile?.projects || [];
                if (!projectIDs.length) return;

                /* 2️⃣ fetch every project in parallel */
                const projectReqs = projectIDs.map((id) =>
                    axios.get(`${BACKEND_URL}/api/projects/${id}/`, {
                        headers: { Authorization: `Token ${token}` },
                    })
                );
                const projectRes = await Promise.all(projectReqs);
                const projObjs = projectRes.map((r) => r.data);

                /* 3️⃣ build {id,name,formCount} list  */
                const projStats = projObjs.map((p) => ({
                    id: p.id,
                    name: p.name,
                    formCount: (p.forms || []).length,
                }));

                /* 4️⃣ sort by forms desc – keep top 6 for the card  */
                projStats.sort((a, b) => b.formCount - a.formCount);
                setStats(projStats.slice(0, 6));
            } catch (err) {
                console.error(err);
                setStats([]);
            }
        })();
    }, []);

    return (
        <div className="border border-black/70 new-data-section">
            <h2 className="new-data-title">Project form counts</h2>

            <ul className="new-data-list">
                {stats.slice(0, 4).map((proj) => (
                    <li className="new-data-item" key={proj.id}>
                        <div className="data-info">
                            <div className="data-icon-container napm">
                                {/* simple circle icon */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            </div>
                            <div className="data-details">
                                <div className="data-name">
                                    <Link
                                        to={`/projects/single-project/${proj.id}`}
                                        className="hover:underline"
                                    >
                                        {proj.name}
                                    </Link>
                                </div>
                                <div className="data-time">Forms</div>
                            </div>
                        </div>
                        <div className="data-value">{proj.formCount}</div>
                    </li>
                ))}
            </ul>

            <div className="mt-2 text-right">
                <Link to="/projects/all" className="hover:underline">
                    Show all&nbsp;&rarr;
                </Link>
            </div>
        </div>
    );
}
