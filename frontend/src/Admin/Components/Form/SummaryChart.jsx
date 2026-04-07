import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import "./SummaryChart.css";

const TAB_CONFIG = [
  {
    key: "past7",
    label: "Past 7 days",
    bars: 7,
    getBarLabel: (i, now) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return d.toLocaleDateString(undefined, { weekday: "short" });
    },
  },
  {
    key: "past31",
    label: "Past 31 days",
    bars: 5,
    getBarLabel: (i) => (i < 4 ? `${(i + 1) * 7}d` : "Last 3d"),
  },
  {
    key: "past3m",
    label: "Past 3 months",
    bars: 3,
    getBarLabel: (i, now) => {
      const d = new Date(now);
      d.setMonth(now.getMonth() - (2 - i));
      return d.toLocaleString(undefined, { month: "short" });
    },
  },
  {
    key: "past12m",
    label: "Past 12 months",
    bars: 12,
    getBarLabel: (i, now) => {
      const d = new Date(now);
      d.setMonth(now.getMonth() - (11 - i));
      return d.toLocaleString(undefined, { month: "short" });
    },
  },
];

function getDynamicGridSteps(max) {
  if (max <= 5) return Array.from({ length: max + 1 }, (_, i) => i);
  const step = Math.ceil(max / 5);
  const arr = [];
  for (let i = 0; i <= max; i += step) arr.push(i);
  if (arr[arr.length - 1] !== max) arr.push(max);
  return arr;
}

function SummaryChart({ formId, summaryStats = null, loading = false }) {
  const [activeTab, setActiveTab] = useState("past7");
  const [fetchedStats, setFetchedStats] = useState(null);
  const [loadingFallback, setLoadingFallback] = useState(false);
  const now = new Date();

  useEffect(() => {
    if (!formId || summaryStats) {
      return;
    }

    let isMounted = true;
    const fetchSummaryStats = async () => {
      setLoadingFallback(true);
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/summary-stats/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        if (isMounted) {
          setFetchedStats(res.data);
        }
      } catch (error) {
        console.error("Error loading form summary stats:", error);
        if (isMounted) {
          setFetchedStats(null);
        }
      } finally {
        if (isMounted) {
          setLoadingFallback(false);
        }
      }
    };

    fetchSummaryStats();
    return () => {
      isMounted = false;
    };
  }, [formId, summaryStats]);

  const resolvedStats = summaryStats || fetchedStats || {};
  const tab = TAB_CONFIG.find((t) => t.key === activeTab);
  const tabBars = Array.isArray(resolvedStats?.bar_data?.[activeTab])
    ? resolvedStats.bar_data[activeTab]
    : [];
  const barData = Array.from({ length: tab.bars }, (_, idx) => {
    const value = Number(tabBars[idx] || 0);
    return Number.isFinite(value) ? value : 0;
  });
  const maxBar = Math.max(...barData, 1);
  const gridSteps = getDynamicGridSteps(maxBar);
  const showLoading = loading || (!summaryStats && loadingFallback);

  const totals = useMemo(
    () => ({
      totalSubmissions: Number(resolvedStats?.total_submissions || 0),
      todaySubmissions: Number(resolvedStats?.today_submissions || 0),
    }),
    [resolvedStats]
  );

  return (
    <div>
      <div className="p-4 mt-4 bg-white rounded-lg border border-black/70">
        <div className="">
          <h5 className="mb-3 text-[18px] font-medium">Submission</h5>
          <div className="mb-2 text-[16px] font-medium d-flex justify-content-end align-items-center">
            <p>
              Total submissions:{" "}
              {showLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                totals.totalSubmissions
              )}
            </p>
            <span style={{ marginLeft: 16 }}>
              <p>
                Today's submissions:{" "}
                {showLoading ? (
                  <span className="text-gray-500">Loading...</span>
                ) : (
                  totals.todaySubmissions
                )}
              </p>
            </span>
          </div>
          <div className="mb-3">
            {TAB_CONFIG.map((t) => (
              <button
                key={t.key}
                className={`btn btn-sm ${
                  activeTab === t.key ? "bg-color-custom" : "text-color-custom"
                } mx-1`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              height: 200,
              marginBottom: 24,
            }}
          >
            {showLoading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
                  <span>Loading submission chart...</span>
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    marginRight: 8,
                    minWidth: 36,
                  }}
                >
                  {gridSteps
                    .slice()
                    .reverse()
                    .map((step, idx) => (
                      <div
                        key={step}
                        style={{
                          height:
                            idx === 0 ? 0 : `${100 / (gridSteps.length - 1)}%`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          fontSize: 12,
                          color: "#888",
                        }}
                      >
                        {step}
                      </div>
                    ))}
                </div>
                <div style={{ position: "relative", flex: 1, height: "100%" }}>
                  {gridSteps
                    .slice()
                    .reverse()
                    .map((step) => (
                      <div
                        key={step}
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: `${(step / maxBar) * 100}%`,
                          borderTop: "1px dashed #d1d5db",
                          height: 0,
                          zIndex: 1,
                        }}
                      />
                    ))}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      height: "100%",
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    {barData.map((count, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          flex: 1,
                          height: "100%",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div
                          className="bar"
                          style={{
                            height: `${(count / maxBar) * 100}%`,
                            width: 20,
                            background: "#2094f3",
                            borderRadius: "5px 5px 0 0",
                            transition: "height 0.3s",
                            marginBottom: 0,
                            position: "relative",
                          }}
                          title={`${tab.getBarLabel(i, now)} - ${count}`}
                        />
                        <div className="day" style={{ marginTop: 8 }}>
                          {tab.getBarLabel(i, now)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryChart;
