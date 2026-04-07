import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { Link } from "react-router-dom";
import "./MiniCard.css";
import { MdAccountTree } from "react-icons/md";
import { BsHouseAddFill } from "react-icons/bs";
import { BsBuildingFillCheck } from "react-icons/bs";
import { MdWork } from "react-icons/md";

function DashboardMiniCard() {
  const [orgStats, setOrgStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const lightColors = [
    "#4da3ff", // medium blue
    "#5cb85c", // medium green
    "#f0ad4e", // medium yellow/orange
    "#d9534f", // medium red
    "#6c757d", // medium gray
    "#9575cd"  // medium purple
  ];



  useEffect(() => {
    async function fetchOrgStats() {
      try {
        const token = sessionStorage.getItem("authToken");
        const summaryRes = await axios.get(
          `${BACKEND_URL}/api/dashboard/summary/`,
          { headers: { Authorization: `Token ${token}` } }
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
        <ul className="new-data-list">
          {loading ? (
            // Skeleton loader
            [...Array(5)].map((_, idx) => (
              <li className="new-data-item animate-pulse" key={idx}>
                <div className="data-info">
                  <div className="data-icon-container napm bg-gray-200 rounded-full w-10 h-10" />
                  <div className="data-details">
                    <div className="data-name bg-gray-200 h-4 w-32 mb-1 rounded" />
                    <div className="data-time bg-gray-100 h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="data-value bg-gray-200 h-4 w-10 rounded" />
              </li>
            ))
          ) : (
            orgStats.slice(0, 5).map((org, idx) => (
              <li className="new-data-item" key={org.name + idx}>
                <div className="data-info">
                  <div className="data-icon-container napm">
                    <MdWork
                      className="w-6 h-6 text-opacity-20"
                      style={{ color: lightColors[idx % lightColors.length] }}
                    />
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
            ))
          )}
        </ul>

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
