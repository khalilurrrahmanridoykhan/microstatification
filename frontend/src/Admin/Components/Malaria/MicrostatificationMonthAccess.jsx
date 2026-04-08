import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiLock,
  FiRefreshCw,
  FiSave,
  FiUnlock,
} from "react-icons/fi";
import { toast } from "sonner";

import { BACKEND_URL } from "../../../config";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getDhakaDateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value || "0"),
    month: Number(parts.find((part) => part.type === "month")?.value || "1"),
    day: Number(parts.find((part) => part.type === "day")?.value || "1"),
  };
}

function getDhakaYear() {
  return getDhakaDateParts().year;
}

function getDhakaMonth() {
  return getDhakaDateParts().month;
}

function getDhakaDateString() {
  const { year, month, day } = getDhakaDateParts();
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthStartDate(reportingYear, month) {
  return `${String(reportingYear).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
}

function buildDefaultCloseDate(reportingYear, month) {
  return new Date(Date.UTC(reportingYear, month, 0)).toISOString().slice(0, 10);
}

function isMonthCurrentlyOpen(reportingYear, month, closeDate, todayDateString) {
  const monthStart = buildMonthStartDate(reportingYear, month);
  return todayDateString >= monthStart && todayDateString <= closeDate;
}

function formatDisplayDate(value) {
  if (!value) {
    return "Not set";
  }

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return value;
  }
}

function buildMonthEntries(rawRows, reportingYear, todayDateString) {
  const byMonth = new Map();
  (Array.isArray(rawRows) ? rawRows : []).forEach((row) => {
    const month = Number(row?.month || 0);
    if (month >= 1 && month <= 12) {
      byMonth.set(month, row);
    }
  });

  return MONTH_NAMES.map((label, index) => {
    const month = index + 1;
    const existing = byMonth.get(month);
    const closeDate = existing?.close_date || buildDefaultCloseDate(reportingYear, month);

    return {
      id: existing?.id ?? null,
      month,
      label,
      close_date: closeDate,
      is_currently_open: isMonthCurrentlyOpen(
        reportingYear,
        month,
        closeDate,
        todayDateString
      ),
    };
  });
}

function MonthCard({
  entry,
  reportingYear,
  isCurrentMonth,
  onCloseDateChange,
  onCloseDateBlur,
  disabled,
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{entry.label}</p>
          <p className="mt-1 text-sm text-slate-500">
            {isCurrentMonth
              ? "Current month stays open until the selected close date."
              : "This month opens on its first day and closes on the selected date."}
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            entry.is_currently_open
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {entry.is_currently_open ? (
            <FiUnlock className="h-4 w-4" />
          ) : (
            <FiLock className="h-4 w-4" />
          )}
          {entry.is_currently_open ? "Open now" : "Closed now"}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Close on</p>
          <p className="mt-1 text-xs text-slate-500">
            Default closes on {formatDisplayDate(buildDefaultCloseDate(reportingYear, entry.month))}. You can extend it, for example keep April open until May 10.
          </p>
        </div>

        <input
          type="date"
          value={entry.close_date}
          onChange={(event) => onCloseDateChange(entry.month, event.target.value)}
          onBlur={(event) => onCloseDateBlur(entry.month, event.target.value)}
          disabled={disabled}
          className="mt-3 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <p className="mt-3 text-xs text-slate-500">
          Month window: {formatDisplayDate(buildMonthStartDate(reportingYear, entry.month))} to{" "}
          {formatDisplayDate(entry.close_date)}
        </p>
      </div>
    </div>
  );
}

function MicrostatificationMonthAccess() {
  const currentYear = getDhakaYear();
  const currentMonth = getDhakaMonth();
  const todayDateString = getDhakaDateString();
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState(() =>
    buildMonthEntries([], currentYear, todayDateString)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const authHeaders = useMemo(() => {
    const token = sessionStorage.getItem("authToken");
    return token ? { Authorization: `Token ${token}` } : {};
  }, []);

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - 2 + index),
    [currentYear]
  );

  const openCount = useMemo(
    () => entries.filter((entry) => entry.is_currently_open).length,
    [entries]
  );

  const loadEntries = async (selectedYear = year) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/malaria/month-access-settings/`,
        {
          params: { reporting_year: selectedYear, _order: "month" },
          headers: authHeaders,
        }
      );

      setEntries(buildMonthEntries(response.data || [], selectedYear, todayDateString));
      setDirty(false);
    } catch (error) {
      console.error("Failed to load month access settings", error);
      toast.error("Failed to load month access settings");
      setEntries(buildMonthEntries([], selectedYear, todayDateString));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries(year);
  }, [year]);

  const handleCloseDateChange = (month, closeDate) => {
    const nextCloseDate = closeDate || buildDefaultCloseDate(year, month);
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.month !== month) {
          return entry;
        }

        return {
          ...entry,
          close_date: nextCloseDate,
          is_currently_open: isMonthCurrentlyOpen(
            year,
            month,
            nextCloseDate,
            todayDateString
          ),
        };
      })
    );
    setDirty(true);
  };

  const handleCloseDateBlur = (month, closeDate) => {
    const nextCloseDate = closeDate || buildDefaultCloseDate(year, month);
    setSaving(true);
    axios
      .post(
        `${BACKEND_URL}/api/malaria/month-access-settings/`,
        {
          reporting_year: year,
          month,
          is_open: true,
          close_date: nextCloseDate,
        },
        { headers: authHeaders }
      )
      .then(async () => {
        toast.success("Month access updated");
        setDirty(false);
        await loadEntries(year);
      })
      .catch((error) => {
        console.error("Failed to auto-save month access settings", error);
        toast.error("Failed to save month access settings");
        setDirty(true);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        entries.map((entry) =>
          axios.post(
            `${BACKEND_URL}/api/malaria/month-access-settings/`,
            {
              reporting_year: year,
              month: entry.month,
              is_open: true,
              close_date: entry.close_date,
            },
            { headers: authHeaders }
          )
        )
      );

      toast.success("Month access settings saved");
      await loadEntries(year);
    } catch (error) {
      console.error("Failed to save month access settings", error);
      toast.error("Failed to save month access settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50/70 px-4 py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Month Access
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                Control month closing dates
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Each month is open from its first day until its close date. By
                default that is the last day of the month, and admin can extend
                or shorten it for all SK and SHW users across both Local and
                Non-Local malaria reporting tables.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Reporting Year
                </p>
                <div className="mt-3">
                  <select
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-0"
                  >
                    {years.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Open Months
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                    <FiUnlock className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">{openCount}</div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Closed Months
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <FiLock className="h-5 w-5" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {12 - openCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3 text-slate-600">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Global field-user month control
              </p>
              <p className="text-xs text-slate-500">
                These closing dates apply to all SK and SHW users for the selected year. Changes save after you leave the date field.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadEntries(year)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiRefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-[28px] bg-slate-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <MonthCard
                key={entry.month}
                entry={entry}
                reportingYear={year}
                isCurrentMonth={year === currentYear && entry.month === currentMonth}
                onCloseDateChange={handleCloseDateChange}
                onCloseDateBlur={handleCloseDateBlur}
                disabled={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MicrostatificationMonthAccess;
