import React, { useEffect, useRef } from 'react';
import "./DashboardSidebar.css"

function DashboardChart() {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.Chart) return; // Ensure Chart.js script is loaded

    const ctx = chartRef.current.getContext('2d');

    chartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        datasets: [
          {
            label: 'User Register',
            data: [50, 100, 200, 500, 700, 900, 1000],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#3498db',
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              stepSize: 200,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });

    return () => {
      // Clean up on unmount
      chartInstanceRef.current?.destroy();
    };
  }, []);

  return (
    <div className="clearfix">
      <div className="chart-section shadow-md">
        <h2>User Register</h2>
        <div className=" w-[100%] md:w-[50%]" style={{ height: '400px', width: "100%" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
}

export default DashboardChart;
