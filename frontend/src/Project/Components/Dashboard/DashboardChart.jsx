import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import "./DashboardSidebar.css";
import { Tabs, Tab } from "react-bootstrap";

function DashboardChart() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartMode, setChartMode] = useState("week"); // "week" or "month"

  useEffect(() => {
    let chart;
    async function fetchAndRender() {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/dashboard/summary/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const chartData = res.data?.chart?.[chartMode] || [];
        const labels = chartData.map((entry) =>
          chartMode === "week"
            ? new Date(entry.period).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : new Date(entry.period).toLocaleString("default", {
                month: "short",
                year: "numeric",
              })
        );
        const data = chartData.map((entry) => entry.count || 0);

        if (!window.Chart) return;
        const ctx = chartRef.current.getContext("2d");
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        chart = new window.Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "User Register",
                data,
                borderColor: "#3498db",
                backgroundColor: "rgba(52, 152, 219, 0.1)",
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#3498db",
                pointRadius: 5,
                pointHoverRadius: 7,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "top" },
              tooltip: { mode: "index", intersect: false },
            },
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
              x: { grid: { display: false } },
            },
          },
        });
        chartInstanceRef.current = chart;
      } catch (err) {
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    }

    fetchAndRender();

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [chartMode]);

  return (
    <div className="clearfix">
      <div className="border border-black/70 chart-section">
        <Tabs
          id="chart-tabs"
          activeKey={chartMode}
          onSelect={(k) => setChartMode(k)}
          className="mb-3"
        >
          <Tab eventKey="week" title="Week-wise" className="Week-wise"></Tab>
          <Tab eventKey="month" title="Month-wise" className="Month-wise"></Tab>
        </Tabs>

        <div
          className="w-[100%] md:w-[50%]"
          style={{ height: "400px", width: "100%" }}
        >
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default DashboardChart;
