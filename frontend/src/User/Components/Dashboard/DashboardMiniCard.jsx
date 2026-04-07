import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { Link } from "react-router-dom";
import { FaFileCirclePlus } from "react-icons/fa6";

function DashboardMiniCard({ setTotalSubmissions }) {
  const [formStats, setFormStats] = useState([]);
  const [showViewAll, setShowViewAll] = useState(false);

  useEffect(() => {
    async function fetchFormStats() {
      const token = sessionStorage.getItem("authToken");
      const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
      const username = userInfo?.username;

      if (!token || !username) {
        setFormStats([]);
        setShowViewAll(false);
        if (setTotalSubmissions) setTotalSubmissions(0);
        return;
      }

      try {
        // Step 1: Get up-to-date user profile
        const userRes = await axios.get(`${BACKEND_URL}/api/users/${username}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const assignedFormIds = userRes.data?.profile?.forms || [];

        if (assignedFormIds.length === 0) {
          setFormStats([]);
          setShowViewAll(false);
          if (setTotalSubmissions) setTotalSubmissions(0);
          return;
        }

        // Step 2: Fetch each form's details
        const results = await Promise.allSettled(
          assignedFormIds.map((id) =>
            axios.get(`${BACKEND_URL}/api/forms/${id}/`, {
              headers: { Authorization: `Token ${token}` },
            })
          )
        );

        const formData = results
          .filter((res) => res.status === "fulfilled")
          .map((res) => {
            const form = res.value.data;
            return {
              id: form.id,
              name: form.name || `Form ${form.id}`,
              project: form.project,
              submissionCount: form.submission?.length || 0,
            };
          });

        // Step 3: Set total submissions
        const totalSubmissions = formData.reduce(
          (sum, form) => sum + form.submissionCount,
          0
        );
        if (setTotalSubmissions) setTotalSubmissions(totalSubmissions);

        // Step 4: Sort and limit
        const sorted = formData.sort((a, b) => b.submissionCount - a.submissionCount);
        setFormStats(sorted.slice(0, 4));
        setShowViewAll(sorted.length > 4);
      } catch (err) {
        console.error("Error fetching form stats:", err);
        setFormStats([]);
        setShowViewAll(false);
        if (setTotalSubmissions) setTotalSubmissions(0);
      }
    }

    fetchFormStats();
  }, []);

  return (
    <div className="bg-white p-3 border borde-black/70 rounded-lg">
      <h2 className="text-[18px] font-medium mb-4 text-[#2094F3]">Top Forms by Submissions</h2>
      <ul className="m-0 p-0">
        {formStats.slice(0, 4).map((form) => (
          <li
            key={form.id}
            className="flex items-start justify-between border-b border-black/10 mb-2 p-2 rounded-md hover:shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full text-[#2094F3]">
                <FaFileCirclePlus className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[16px] font-medium line-clamp-2">
                  <Link
                    to={`/projects/${form.project}/forms/${form.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {form.name}
                  </Link>
                </div>
                <div className="text-sm text-gray-500">Submissions</div>
              </div>
            </div>
            <div className="text-[#2094F3] text-lg font-semibold bg-[#2094f332] px-3 py-1 rounded-full">
              {form.submissionCount}
            </div>
          </li>
        ))}
      </ul>

      {showViewAll && (
        <div className="mt-4 text-right">
          <Link to="/forms/all" className="text-sm text-[#2094F3] hover:underline font-medium">
            View all &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default DashboardMiniCard;
