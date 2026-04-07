import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiActivity,
  FiBarChart2,
  FiMap,
  FiMapPin,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { toast } from "sonner";
import { BACKEND_URL } from "../../../config";

const numberFormatter = new Intl.NumberFormat("en-US");
const ROLE_COLORS = {
  User: "from-sky-500 to-cyan-500",
  SK: "from-emerald-500 to-green-500",
  SHW: "from-amber-500 to-orange-500",
};
const SCOPE_COLORS = {
  district: "from-blue-600 to-indigo-600",
  upazila: "from-cyan-500 to-sky-500",
  union: "from-emerald-500 to-teal-500",
  ward: "from-violet-500 to-fuchsia-500",
  village: "from-amber-500 to-orange-500",
  multi_village: "from-rose-500 to-pink-500",
  unassigned: "from-slate-400 to-slate-500",
};

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function formatDate(value, options) {
  if (!value) {
    return "Not available";
  }

  try {
    return new Date(value).toLocaleString(
      "en-US",
      options || {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  } catch (error) {
    return "Not available";
  }
}

function StatCard({ title, value, subtitle, Icon, accentClass }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accentClass}`}
      />
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </span>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}

function DistributionCard({ title, items, type }) {
  const safeItems = Array.isArray(items) ? items : [];
  const maxValue = Math.max(
    ...safeItems.map((item) => Number(item?.count) || 0),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Live breakdown from current managed accounts.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FiBarChart2 className="h-5 w-5" />
        </div>
      </div>

      {safeItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No data available.
        </div>
      ) : (
        <div className="space-y-4">
          {safeItems.map((item) => {
            const colorClass =
              type === "role"
                ? ROLE_COLORS[item.label] || "from-slate-500 to-slate-600"
                : SCOPE_COLORS[item.key] || "from-slate-500 to-slate-600";
            const width = `${Math.max(
              8,
              (Number(item.count || 0) / maxValue) * 100
            )}%`;

            return (
              <div key={item.key || item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(item.count)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UploadTrendChart({ data }) {
  const safeData = Array.isArray(data) ? data : [];

  if (!safeData.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No upload activity yet.
      </div>
    );
  }

  const width = 720;
  const height = 260;
  const padX = 34;
  const padY = 30;
  const maxValue = Math.max(
    ...safeData.map((item) => Number(item?.villages_touched) || 0),
    1
  );
  const step =
    safeData.length > 1 ? (width - padX * 2) / (safeData.length - 1) : 0;

  const points = safeData.map((item, index) => {
    const value = Number(item?.villages_touched) || 0;
    const x = safeData.length === 1 ? width / 2 : padX + index * step;
    const y =
      height -
      padY -
      (value / maxValue) * Math.max(height - padY * 2, 1);
    return { x, y, value, label: item.label, district: item.district };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x} ${
    height - padY
  } L${points[0].x} ${height - padY} Z`;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Upload Momentum</h3>
          <p className="mt-1 text-sm text-slate-500">
            Villages touched across the latest upload events.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FiTrendingUp className="h-5 w-5" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl bg-slate-950/95 p-4 text-white">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[260px] w-full"
          preserveAspectRatio="none"
        >
          {[0, 1, 2, 3].map((stepIndex) => {
            const y =
              padY +
              ((height - padY * 2) / 3) * stepIndex;
            return (
              <line
                key={stepIndex}
                x1={padX}
                x2={width - padX}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="4 6"
              />
            );
          })}

          <path d={areaPath} fill="rgba(45, 212, 191, 0.18)" />
          <path
            d={linePath}
            fill="none"
            stroke="url(#uploadTrendGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient id="uploadTrendGradient" x1="0%" x2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {points.map((point) => (
            <g key={`${point.label}-${point.district}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#0f172a"
                stroke="#67e8f9"
                strokeWidth="3"
              />
            </g>
          ))}
        </svg>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {safeData.map((item) => (
            <div
              key={`${item.label}-${item.district}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                {item.label}
              </div>
              <div className="mt-2 text-lg font-semibold">
                {formatNumber(item.villages_touched)} villages
              </div>
              <div className="mt-1 text-sm text-slate-300">{item.district}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DistrictOperationsCard({ districts }) {
  const safeDistricts = Array.isArray(districts) ? districts : [];
  const topDistricts = safeDistricts.slice(0, 5);
  const maxVillages = Math.max(
    ...topDistricts.map((item) => Number(item?.villages) || 0),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            District Operations
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Village footprint, user coverage, and upload volume by district.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FiMap className="h-5 w-5" />
        </div>
      </div>

      {topDistricts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No district data available.
        </div>
      ) : (
        <div className="space-y-5">
          {topDistricts.map((district) => {
            const width = `${Math.max(
              10,
              (Number(district.villages || 0) / maxVillages) * 100
            )}%`;

            return (
              <div
                key={district.name}
                className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">
                      {district.name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Last upload: {formatDate(district.last_upload_at)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                      {formatNumber(district.villages)} villages
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                      {formatNumber(district.assigned_users)} users
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                      {formatNumber(district.uploads)} uploads
                    </span>
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                    style={{ width }}
                  />
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Population
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(district.population)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Villages Touched
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(district.villages_touched)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Village Data Updated
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatDate(district.last_updated)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentUploadsCard({ uploads }) {
  const safeUploads = Array.isArray(uploads) ? uploads : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Recent Uploads</h3>
          <p className="mt-1 text-sm text-slate-500">
            Latest processed microstatification files.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FiActivity className="h-5 w-5" />
        </div>
      </div>

      {safeUploads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No uploads found.
        </div>
      ) : (
        <div className="space-y-3">
          {safeUploads.map((upload) => {
            const touched =
              Number(upload?.villages_created || 0) +
              Number(upload?.villages_updated || 0);
            const isSuccess = `${upload?.upload_note || ""}`
              .toLowerCase()
              .includes("completed");

            return (
              <div
                key={upload.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {upload.district}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {upload.uploaded_by_username || "Unknown user"} •{" "}
                      {formatDate(upload.created_at, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isSuccess
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isSuccess ? "Completed" : "Processed"}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Created
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(upload.villages_created)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Updated
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(upload.villages_updated)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                      Total Touched
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatNumber(touched)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DistrictTable({ districts }) {
  const safeDistricts = Array.isArray(districts) ? districts : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            District Summary
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Full microstatification operating view across all districts.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <FiMapPin className="h-5 w-5" />
        </div>
      </div>

      {safeDistricts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No district summary available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-400">
                <th className="px-3 py-2">District</th>
                <th className="px-3 py-2">Villages</th>
                <th className="px-3 py-2">Population</th>
                <th className="px-3 py-2">Assigned Users</th>
                <th className="px-3 py-2">Uploads</th>
                <th className="px-3 py-2">Last Upload</th>
              </tr>
            </thead>
            <tbody>
              {safeDistricts.map((district) => (
                <tr
                  key={district.name}
                  className="rounded-2xl bg-slate-50 text-sm text-slate-700"
                >
                  <td className="rounded-l-2xl px-3 py-4 font-semibold text-slate-900">
                    {district.name}
                  </td>
                  <td className="px-3 py-4">{formatNumber(district.villages)}</td>
                  <td className="px-3 py-4">{formatNumber(district.population)}</td>
                  <td className="px-3 py-4">
                    {formatNumber(district.assigned_users)}
                  </td>
                  <td className="px-3 py-4">{formatNumber(district.uploads)}</td>
                  <td className="rounded-r-2xl px-3 py-4">
                    {formatDate(district.last_upload_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="h-56 animate-pulse rounded-[32px] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-3xl bg-slate-200"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}

function MicrostatificationDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    const token = sessionStorage.getItem("authToken");
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/malaria/microstatification/dashboard/summary/`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      setDashboard(response.data || null);
    } catch (err) {
      console.error("Failed to load microstatification dashboard", err);
      setError("Failed to load dashboard data.");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingState />;
  }

  if (error && !dashboard) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <FiActivity className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Dashboard unavailable
          </h2>
          <p className="mt-3 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totals = dashboard?.totals || {};
  const roleBreakdown = Array.isArray(dashboard?.role_breakdown)
    ? dashboard.role_breakdown
    : [];
  const scopeBreakdown = Array.isArray(dashboard?.scope_breakdown)
    ? dashboard.scope_breakdown
    : [];
  const districtStats = Array.isArray(dashboard?.district_stats)
    ? dashboard.district_stats
    : [];
  const recentUploads = Array.isArray(dashboard?.recent_uploads)
    ? dashboard.recent_uploads
    : [];
  const uploadTrend = Array.isArray(dashboard?.upload_trend)
    ? dashboard.upload_trend
    : [];

  return (
    <div className="bg-slate-50/70 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Managed Users"
            value={formatNumber(totals.managed_users)}
            subtitle="Users visible to the microstatification admin across User, SK, and SHW roles."
            Icon={FiUsers}
            accentClass="from-sky-500 to-cyan-500"
          />
          <StatCard
            title="Assigned Users"
            value={formatNumber(totals.assigned_users)}
            subtitle={`${formatNumber(
              totals.pending_users
            )} users still need location assignment or setup.`}
            Icon={FiUserCheck}
            accentClass="from-emerald-500 to-teal-500"
          />
          <StatCard
            title="Villages"
            value={formatNumber(totals.villages)}
            subtitle={`${formatNumber(
              totals.districts
            )} districts loaded in the current microstatification dataset.`}
            Icon={FiMapPin}
            accentClass="from-violet-500 to-fuchsia-500"
          />
          <StatCard
            title="Mapped Population"
            value={formatNumber(totals.population)}
            subtitle={`${formatNumber(
              totals.uploads
            )} upload events have contributed to the current data store.`}
            Icon={FiTrendingUp}
            accentClass="from-amber-500 to-orange-500"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <DistrictOperationsCard districts={districtStats} />
          <div className="grid gap-6">
            <DistributionCard
              title="Managed User Roles"
              items={roleBreakdown}
              type="role"
            />
            <DistributionCard
              title="Assignment Scope"
              items={scopeBreakdown}
              type="scope"
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <UploadTrendChart data={uploadTrend} />
          <RecentUploadsCard uploads={recentUploads} />
        </div>

        <DistrictTable districts={districtStats} />

      </div>
    </div>
  );
}

export default MicrostatificationDashboard;
