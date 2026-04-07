import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BACKEND_URL } from "../../../../config";
import axios from "axios";
import { toast } from "sonner";

function Download() {
  const { formId } = useParams();
  const [exportType, setExportType] = useState("XLS");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/forms/${formId}/download_logs/`, {
        headers: {
          Authorization: `Token ${sessionStorage.getItem("authToken")}`,
        },
      })
      .then((res) => setLogs(res.data));
  }, [formId]);

  const handleExport = async () => {
    setLoading(true);
    const token = sessionStorage.getItem("authToken");
    let url = "";
    let filename = "";
    let method = "post"; // XLS uses POST, CSV/ZIP use GET

    if (exportType === "XLS") {
      url = `${BACKEND_URL}/api/forms/${formId}/download_xls/`;
      filename = `form_${formId}.xlsx`;
      method = "post";
    } else if (exportType === "CSV") {
      url = `${BACKEND_URL}/api/forms/${formId}/download_csv/`;
      filename = `form_${formId}.csv`;
      method = "get";
    } else if (exportType === "ZIP") {
      url = `${BACKEND_URL}/api/forms/${formId}/download_zip/`;
      filename = `form_${formId}_all_with_media.zip`;
      method = "get";
    }

    try {
      let res;
      if (method === "post") {
        res = await axios.post(
          url,
          {},
          {
            headers: { Authorization: `Token ${token}` },
            responseType: "blob",
          }
        );
      } else {
        res = await axios.get(url, {
          headers: { Authorization: `Token ${token}` },
          responseType: "blob",
        });
      }

      // Just refresh logs after export
      const logsRes = await axios.get(
        `${BACKEND_URL}/api/forms/${formId}/download_logs/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setLogs(logsRes.data);
      toast.success("The file is now available for download");
    } catch (err) {
      toast.error("File not found or download failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId) => {
    const token = sessionStorage.getItem("authToken");
    await axios.delete(`${BACKEND_URL}/api/download_logs/${logId}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    setLogs(logs.filter((l) => l.id !== logId));
  };

  return (
    <div>
      <div className="w-full">
        <h2>Downloads</h2>
        <div className="p-4 bg-white border rounded-lg section border-black/70 u k">
          <div className="row">
            <div className="col">
              <label htmlFor="export-type">Select export type</label>
              <select
                id="export-type"
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className=""
              >
                <option value="XLS">XLS</option>
                <option value="CSV">CSV</option>
                <option value="ZIP">Zip(All with Media)</option>
              </select>
            </div>
          </div>
          <div className="py-2 mt-2 text-right ">
            <button
              className="p-2 py-3 w-[30%] text-white bg-blue-600 rounded-lg flex items-center justify-center"
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? (
                // Simple spinner, you can replace with any spinner component or SVG
                <svg
                  className="w-5 h-5 text-white animate-spin"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                "Export"
              )}
            </button>
          </div>
        </div>
        <div className="p-4 mt-8 bg-white border rounded-lg border-black/70">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.type}</td>
                  <td>{new Date(log.created).toLocaleString("en-GB", {
                    timeZone: "Asia/Dhaka",
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,})}</td>
                  <td className="flex items-center gap-4 p-2 border">
                    <a
                      href={`${BACKEND_URL}${log.file_url}`}
                      download
                      className="px-3 py-1 text-blue-600 no-underline transition bg-blue-200 rounded-lg hover:bg-blue-800 hover:text-white"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="px-3 py-1 text-white transition bg-red-600 rounded hover:bg-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Download;