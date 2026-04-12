import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiActivity,
  FiBarChart2,
  FiExternalLink,
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

  return (
    <div className="bg-slate-50/70 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Data View
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                Open the malaria reporting data workspace
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Review the local and non-local reporting tables in the malaria
                data view without leaving your microstatification admin flow.
              </p>
            </div>
            <div className="flex justify-start lg:justify-end">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.assign("/malaria/")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                  View Data Page
                  <FiExternalLink className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => window.location.assign("/microstatification/month-access")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  Month Access
                  <FiExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Users"
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
            title="Total Reported Case"
            value={formatNumber(totals.reported_cases)}
            subtitle={`${formatNumber(
              totals.uploads
            )} upload events have contributed to the current data store for reporting year ${
              totals.reporting_year || new Date().getFullYear()
            }.`}
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
      </div>
    </div>
  );
}

export default MicrostatificationDashboard;
