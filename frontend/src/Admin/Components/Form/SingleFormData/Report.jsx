import React, { useState } from "react";

const Report = () => {
  const [isCustomReportOpen, setCustomReportOpen] = useState(false);
  const [isStyleModalOpen, setStyleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chartType");
  const [selectedChart, setSelectedChart] = useState("Vertical");

  const charts = [
    { label: "Vertical", icon: "https://img.icons8.com/ios-filled/50/bar-chart.png" },
    { label: "Horizontal", icon: "https://img.icons8.com/ios-filled/50/horizontal-bar-chart.png" },
    { label: "Line", icon: "https://img.icons8.com/ios-filled/50/line-chart.png" },
    { label: "Pie", icon: "https://img.icons8.com/ios-filled/50/pie-chart.png" },
    { label: "Donut", icon: "https://img.icons8.com/ios-filled/50/doughnut-chart.png" },
  ];

  return (
    <div style={{ backgroundColor: "white", padding: "1.5rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Reports</h1>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <select style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "0.5rem 1rem", width: "500px" }}>
            <option defaultValue>Select...</option>
          </select>

          <button
            style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px" }}
            onClick={() => setCustomReportOpen(true)}
          >
            <i className="fas fa-plus"></i>
          </button>

          <div style={{ display: "flex", gap: "1rem", marginLeft: "1rem" }}>
            <i className="fas fa-pen" style={{ color: "#1e40af", cursor: "pointer", fontSize: "1.125rem" }}></i>
            <i
              className="fas fa-cog"
              style={{ color: "#1e40af", cursor: "pointer", fontSize: "1.125rem" }}
              onClick={() => setStyleModalOpen(true)}
            ></i>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
            <i className="fas fa-print" style={{ color: "#1e40af", cursor: "pointer", fontSize: "1.125rem" }}></i>
            <i className="fas fa-expand" style={{ color: "#1e40af", cursor: "pointer", fontSize: "1.125rem" }}></i>
          </div>
        </div>

        <div style={{ backgroundColor: "#fef3c7", color: "#1f2937", padding: "1rem", borderRadius: "0.5rem" }}>
          This report has no data.
        </div>

        {isCustomReportOpen && (
          <div className="modal" style={modalStyle}>
            <div style={modalContentStyle}>
              <div style={modalHeaderStyle}>
                <h5 style={{ margin: 0 }}>Custom Report</h5>
                <button onClick={() => setCustomReportOpen(false)} style={closeButtonStyle}>&times;</button>
              </div>
              <div style={{ padding: "1rem" }}>
                <input type="text" placeholder="Untitled Report" style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", border: "1px solid #ccc", borderRadius: "4px" }} />
                <label style={{ fontWeight: "bold" }}>Include the following questions:</label>
              </div>
              <div style={{ padding: "1rem", textAlign: "right" }}>
                <button style={primaryButtonStyle}>Save</button>
              </div>
            </div>
          </div>
        )}

        {isStyleModalOpen && (
          <div className="modal" style={modalStyle}>
            <div style={{ ...modalContentStyle, maxWidth: "900px" }}>
              <div style={modalHeaderStyle}>
                <h5 style={{ margin: 0 }}>Edit Report Style</h5>
                <button onClick={() => setStyleModalOpen(false)} style={closeButtonStyle}>&times;</button>
              </div>
              <div style={{ padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <button onClick={() => setActiveTab("chartType")} style={activeTab === "chartType" ? tabActiveStyle : tabInactiveStyle}>CHART TYPE</button>
                  <button onClick={() => setActiveTab("colors")} style={activeTab === "colors" ? tabActiveStyle : tabInactiveStyle}>COLORS</button>
                </div>

                {activeTab === "chartType" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "1rem" }}>
                      {charts.map(chart => (
                        <div
                          key={chart.label}
                          onClick={() => setSelectedChart(chart.label)}
                          style={{
                            textAlign: "center",
                            cursor: "pointer",
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            border: selectedChart === chart.label ? "2px solid #2563eb" : "2px solid transparent",
                            backgroundColor: selectedChart === chart.label ? "#eff6ff" : "#fff"
                          }}
                        >
                          <img src={chart.icon} alt={chart.label} style={{ width: "40px", height: "40px", marginBottom: "0.5rem" }} />
                          <div>{chart.label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === "colors" && <div>Color settings will be implemented here.</div>}
              </div>
              <div style={{ padding: "1rem", textAlign: "right" }}>
                <button style={primaryButtonStyle}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const modalStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "#fff",
  borderRadius: "0.5rem",
  overflow: "hidden",
  width: "600px",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
};

const modalHeaderStyle = {
  backgroundColor: "#0ea5e9",
  color: "white",
  padding: "1rem",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const closeButtonStyle = {
  background: "none",
  border: "none",
  fontSize: "1.25rem",
  color: "white",
  cursor: "pointer",
};

const tabActiveStyle = {
  borderBottom: "2px solid #0ea5e9",
  backgroundColor: "#e0f2fe",
  padding: "0.5rem 1rem",
  fontWeight: "bold",
};

const tabInactiveStyle = {
  borderBottom: "2px solid transparent",
  backgroundColor: "#f9fafb",
  padding: "0.5rem 1rem",
};

const primaryButtonStyle = {
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.5rem 1.5rem",
  borderRadius: "4px",
  cursor: "pointer",
};

export default Report;