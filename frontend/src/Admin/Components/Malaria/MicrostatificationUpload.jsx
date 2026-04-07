import React, { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { toast } from "sonner";

function triggerBrowserDownload(downloadUrl, filename = "microstatification_data.xlsx") {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function resolveDownloadUrl(downloadUrl) {
  if (!downloadUrl) {
    return "";
  }
  if (/^https?:\/\//i.test(downloadUrl)) {
    return downloadUrl;
  }
  return `${BACKEND_URL}${downloadUrl}`;
}

function resolveDownloadFilename(contentDisposition, district) {
  const fallback = `microstatification_data_${String(district || "district")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.xlsx`;
  if (!contentDisposition) {
    return fallback;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallback;
}

async function downloadXlsxFile(downloadUrl, district) {
  const resolvedUrl = resolveDownloadUrl(downloadUrl);
  const fileResponse = await axios.get(resolvedUrl, {
    responseType: "blob",
  });

  const blob = fileResponse.data;
  const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) {
    let detail = "Downloaded file is not a valid XLSX.";
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      detail = parsed?.detail || detail;
    } catch {
      // Ignore parse errors and use fallback detail.
    }
    throw new Error(detail);
  }

  const filename = resolveDownloadFilename(
    fileResponse.headers?.["content-disposition"],
    district
  );

  const objectUrl = URL.createObjectURL(blob);
  triggerBrowserDownload(objectUrl, filename);

  // Revoke later to avoid race conditions where browsers keep reading the object URL
  // after click dispatch and can produce a truncated/corrupt saved file.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

function MicrostatificationUpload() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [downloadDistrict, setDownloadDistrict] = useState("");
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const districts = [
    "Bandarban",
    "Khagrachhari",
    "Cox's Bazar",
    "Rangamati",
    "Chattogram",
  ];

  const loadUploadHistory = async () => {

    const token = sessionStorage.getItem("authToken");
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/malaria/microstatification-uploads/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setUploadHistory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load upload history", error);
      toast.error("Failed to load upload history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith(".xlsx")) {
        toast.error("Please select an Excel file (.xlsx)");
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!selectedDistrict) {
      toast.error("Please select a district");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    setUploading(true);

    const formData = new FormData();
    formData.append("excel_file", selectedFile);
    formData.append("district", selectedDistrict);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/malaria/upload/microstatification/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(`Upload successful!\n${res.data.upload_note}`);
      setSelectedFile(null);
      setSelectedDistrict("");
      document.getElementById("fileInput").value = "";
      loadUploadHistory();
    } catch (error) {
      console.error("Upload failed", error);
      const errorMsg = error.response?.data?.detail || "Upload failed";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!downloadDistrict) {
      toast.error("Please select a district");
      return;
    }

    const token = sessionStorage.getItem("authToken");
    setDownloading(true);

    try {
      const params = new URLSearchParams();
      params.set("district", downloadDistrict);
      params.set("_t", Date.now().toString());

      const queryString = params.toString();
      const url = `${BACKEND_URL}/api/malaria/download/microstatification/link/${queryString ? `?${queryString}` : ""}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });
      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) {
        throw new Error("Download link not available");
      }
      await downloadXlsxFile(downloadUrl, downloadDistrict);

      toast.success("Microstatification data download started");
    } catch (error) {
      console.error("Download failed", error);
      const errorMsg = error.response?.data?.detail || error.message || "Download failed";
      toast.error(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  React.useEffect(() => {
    loadUploadHistory();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Microstatification Data Upload
      </h1>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === "upload"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Upload Data
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("download")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${activeTab === "download"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          Download Data
        </button>
      </div>

      {activeTab === "upload" && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Upload Excel File
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={uploading}
                  >
                    <option value="">-- Select a District --</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Excel File (.xlsx)
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={uploading}
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  Selected file: <strong>{selectedFile.name}</strong> (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !selectedFile || !selectedDistrict}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Upload History</h2>
              <button
                onClick={loadUploadHistory}
                disabled={loadingHistory}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                {loadingHistory ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-gray-500">Loading history...</p>
            ) : uploadHistory.length === 0 ? (
              <p className="text-gray-500">No uploads yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2 text-left">District</th>
                      <th className="border px-4 py-2 text-left">Uploaded By</th>
                      <th className="border px-4 py-2 text-right">Created</th>
                      <th className="border px-4 py-2 text-right">Villages</th>
                      <th className="border px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadHistory.map((upload) => (
                      <tr key={upload.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{upload.district}</td>
                        <td className="border px-4 py-2">
                          {upload.uploaded_by_username}
                        </td>
                        <td className="border px-4 py-2 text-right text-sm text-gray-600">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2 text-right">
                          <span className="text-sm">
                            Created: {upload.villages_created}, Updated:{" "}
                            {upload.villages_updated}
                          </span>
                        </td>
                        <td className="border px-4 py-2">
                          <div className="text-sm">
                            {upload.upload_note.includes("completed") && (
                              <span className="text-green-600 font-semibold">Success</span>
                            )}
                            {upload.upload_note.includes("error") && (
                              <span className="text-red-600 font-semibold">Failed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "download" && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Download Microstatification Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District Filter
              </label>
              <select
                value={downloadDistrict}
                onChange={(e) => setDownloadDistrict(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={downloading}
              >
                <option value="">-- Select a District --</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-gray-700">
            Select a district to generate the official microstatification
            template as `.xlsx`. Each district is exported in its own workbook
            layout.
          </div>

          <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
            Included columns: District, Upazila, Union, Ward No, Village Name
            (EN/BN), Village Code, Latitude, Longitude, Population, SK/SHW Name,
            SS Name, MMW/HP/CHWC Name, Distance From Upazila Office, Bordering
            Country Name, Other Activities, Created At, Updated At.
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !downloadDistrict}
            className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {downloading ? "Preparing XLSX..." : "Download District XLSX"}
          </button>
        </div>
      )}
    </div>
  );
}

export default MicrostatificationUpload;
