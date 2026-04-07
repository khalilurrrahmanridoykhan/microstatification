import React, { useMemo, useState } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaSignOutAlt,
} from "react-icons/fa";
import { BACKEND_URL } from "../config";

const BRAC_PROJECT_ID = 55;

const getFilenameFromDisposition = (value) => {
  if (!value) {
    return "";
  }
  const utfMatch = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch && utfMatch[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const asciiMatch = value.match(/filename=\"?([^\";]+)\"?/i);
  if (asciiMatch && asciiMatch[1]) {
    return asciiMatch[1];
  }
  return "";
};

const readBlobError = async (error) => {
  try {
    const payload = error?.response?.data;
    if (payload instanceof Blob) {
      const text = await payload.text();
      try {
        const parsed = JSON.parse(text);
        return parsed.error || parsed.detail || text;
      } catch (_jsonError) {
        return text || "Download failed.";
      }
    }
  } catch (_blobReadError) {
    // Ignore parse failure and fallback below
  }
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error?.message ||
    "Download failed."
  );
};

const buildDownloadUrl = () => {
  const url = new URL(
    `${BACKEND_URL}/api/get-project-templates-full-xlsx/${BRAC_PROJECT_ID}/`
  );
  url.searchParams.set("followup_filter", "all");
  return url.toString();
};

const triggerNativeDownload = () => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = buildDownloadUrl();
  document.body.appendChild(iframe);
  window.setTimeout(() => {
    iframe.remove();
  }, 120000);
};

const BracDataDownloadPage = () => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastDownloadCount, setLastDownloadCount] = useState(null);

  const todayStamp = useMemo(() => new Date().toISOString().split("T")[0], []);

  const downloadExcel = async () => {
    setError("");
    setNotice("");
    setLastDownloadCount(null);

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setError("Authentication token not found. Please login again.");
      return;
    }

    setDownloading(true);
    try {
      const response = await axios.get(
        buildDownloadUrl(),
        {
          headers: { Authorization: `Token ${token}` },
          responseType: "blob",
          timeout: 0,
        }
      );

      const disposition = response.headers["content-disposition"];
      const serverFileName = getFilenameFromDisposition(disposition);
      const fileName =
        serverFileName ||
        `project_${BRAC_PROJECT_ID}_brac_data_${todayStamp}.xlsx`;

      const fileBlob =
        response.data instanceof Blob
          ? response.data
          : new Blob([response.data], {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
      const downloadUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);

      const totalCountHeader = response.headers["x-total-count"];
      if (totalCountHeader && !Number.isNaN(Number(totalCountHeader))) {
        setLastDownloadCount(Number(totalCountHeader));
      } else {
        setLastDownloadCount(null);
      }
    } catch (requestError) {
      if (
        requestError?.message === "Network Error" ||
        requestError?.code === "ERR_NETWORK"
      ) {
        triggerNativeDownload();
        setNotice(
          "Downloading the latest server-generated version. This file is pre-generated and saved on the server."
        );
        return;
      }
      const apiMessage = await readBlobError(requestError);
      setError(apiMessage);
    } finally {
      setDownloading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userInfo");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50 px-4 py-10"
      style={{ fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif' }}
    >
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white/95 p-8 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.55)] backdrop-blur-md sm:p-10">
        <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700">
          Project {BRAC_PROJECT_ID}
        </div>

        <h1 className="mt-4 text-3xl font-bold text-slate-800">
          BRAC Data Download
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Download the latest Excel report for project {BRAC_PROJECT_ID}. The
          latest version is pre-generated and saved on the server.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={downloadExcel}
            disabled={downloading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all ${
              downloading
                ? "cursor-not-allowed bg-slate-400"
                : "bg-emerald-600 shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:bg-emerald-700"
            }`}
          >
            <FaFileExcel className={downloading ? "animate-pulse" : ""} />
            {downloading ? "Preparing Download..." : "Download Excel"}
          </button>

          <button
            onClick={logout}
            disabled={downloading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              downloading
                ? "cursor-not-allowed border border-slate-300 bg-slate-100 text-slate-400"
                : "border border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:bg-slate-50"
            }`}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {lastDownloadCount !== null && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <span>Download completed successfully. Records: {lastDownloadCount}</span>
          </div>
        )}

        {notice && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-700">
            <FaCheckCircle className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BracDataDownloadPage;
