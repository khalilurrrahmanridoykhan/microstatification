import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";

const AssignedFormsChart = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const username = userInfo?.username;

    if (!token || !username) {
      setFormData([]);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);

        // Step 1: Fetch latest user data
        const userRes = await axios.get(`${BACKEND_URL}/api/users/${username}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const assignedFormIds = userRes.data?.profile?.forms || [];

        if (!assignedFormIds.length) {
          setFormData([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch each form’s data
        const results = await Promise.allSettled(
          assignedFormIds.map((id) =>
            axios.get(`${BACKEND_URL}/api/forms/${id}/`, {
              headers: { Authorization: `Token ${token}` },
            })
          )
        );

        const validData = results
          .filter((res) => res.status === "fulfilled" && res.value?.data)
          .map((res) => {
            const form = res.value.data;
            return {
              name: form.name || `Form ${form.id}`,
              count: form.submission?.length || 0,
            };
          });

        setFormData(validData);
      } catch (err) {
        console.error("Failed to fetch assigned forms:", err);
        setFormData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);


  useEffect(() => {
    if (!window.Chart || !formData.length) return;
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    chartInstanceRef.current = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: formData.map((f) => f.name.length > 25 ? f.name.slice(0, 25) + "…" : f.name),
        datasets: [
          {
            label: "Submissions",
            data: formData.map((f) => f.count),
            backgroundColor: "#1f93f2",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [formData]);

  return (
    <div className="bg-white p-3 border borde-black/70 rounded-lg " style={{ height: "400px", width: "100%" }}>
      <h2 className="text-[18px] text-[#1f93f2] font-medium mb-6">Assigned Forms & Submissions</h2>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-full py-8">
          <p className="mb-2 text-gray-600">Loading...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : formData.length === 0 ? (
        <p className="text-center text-gray-500">No forms assigned or no submissions found.</p>
      ) : (
        <canvas ref={chartRef} className="-mt-4 mb-12 md:mb-4"></canvas>
      )}
    </div>
  );
};

export default AssignedFormsChart;
