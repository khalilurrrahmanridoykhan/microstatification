import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BACKEND_URL } from "../../../config";

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

function resolveDownloadFilename(
  contentDisposition,
  district,
  format = "xlsx",
  allDistricts = false
) {
  const safeFormat = String(format || "xlsx").toLowerCase();
  const extension = safeFormat === "csv" ? "csv" : "xlsx";
  const fallback = allDistricts
    ? `microstatification_all_districts_${safeFormat}.zip`
    : `microstatification_data_${String(district || "district")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}.${extension}`;

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

async function parseBlobErrorDetail(blob, fallback = "Download failed") {
  try {
    const text = await blob.text();
    if (!text) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(text);
      return parsed?.detail || fallback;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

async function downloadExportFile(downloadUrl, { district, format, allDistricts }) {
  const resolvedUrl = resolveDownloadUrl(downloadUrl);
  const fileResponse = await axios.get(resolvedUrl, {
    responseType: "blob",
  });

  const resolvedFormat = String(format || "xlsx").toLowerCase();
  const blob = fileResponse.data;
  const bytes = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const isZipSignature =
    bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

  if ((allDistricts || resolvedFormat === "xlsx") && !isZipSignature) {
    const detail = await parseBlobErrorDetail(
      blob,
      allDistricts
        ? "Downloaded file is not a valid ZIP."
        : "Downloaded file is not a valid XLSX."
    );
    throw new Error(detail);
  }

  const filename = resolveDownloadFilename(
    fileResponse.headers?.["content-disposition"],
    district,
    resolvedFormat,
    allDistricts
  );

  const objectUrl = URL.createObjectURL(blob);
  triggerBrowserDownload(objectUrl, filename);

  // Revoke later to avoid race conditions where browsers keep reading the object URL
  // after click dispatch and can produce a truncated/corrupt saved file.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

async function resolveRequestErrorMessage(error) {
  if (error?.response?.data instanceof Blob) {
    return parseBlobErrorDetail(error.response.data, "Download failed");
  }
  return error?.response?.data?.detail || error?.message || "Download failed";
}

function MicrostatificationDownload() {
  const [downloadDistrict, setDownloadDistrict] = useState("");
  const [downloadFormat, setDownloadFormat] = useState("xlsx");
  const [downloading, setDownloading] = useState(false);

  const districts = [
    "Bandarban",
    "Khagrachhari",
    "Cox's Bazar",
    "Rangamati",
    "Chattogram",
  ];
  const districtOptions = [
    { value: "all", label: "All Districts (ZIP)" },
    ...districts.map((district) => ({ value: district, label: district })),
  ];

  const handleDownload = async () => {
    if (!downloadDistrict) {
      toast.error("Please select a district or All Districts");
      return;
    }

    const isAllDistricts = downloadDistrict === "all";
    const token = sessionStorage.getItem("authToken");
    setDownloading(true);

    try {
      const params = new URLSearchParams();
      params.set("district", downloadDistrict);
      params.set("export_format", downloadFormat);
      params.set("_t", Date.now().toString());

      const queryString = params.toString();
      const url = `${BACKEND_URL}/api/malaria/download/microstatification/link/${queryString ? `?${queryString}` : ""
        }`;
      const response = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });
      const downloadUrl = response.data?.download_url;
      if (!downloadUrl) {
        throw new Error("Download link not available");
      }
      await downloadExportFile(downloadUrl, {
        district: downloadDistrict,
        format: downloadFormat,
        allDistricts: isAllDistricts,
      });

      toast.success(
        isAllDistricts
          ? "All-district ZIP download started"
          : `District ${downloadFormat.toUpperCase()} download started`
      );
    } catch (error) {
      console.error("Download failed", error);
      const errorMsg = await resolveRequestErrorMessage(error);
      toast.error(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  const isAllDistricts = downloadDistrict === "all";
  const buttonText = downloading
    ? isAllDistricts
      ? "Preparing ZIP..."
      : `Preparing ${downloadFormat.toUpperCase()}...`
    : isAllDistricts
      ? `Download All Districts ZIP (${downloadFormat.toUpperCase()})`
      : `Download District ${downloadFormat.toUpperCase()}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Microstatification Data
        </h1>
        <p className="text-sm text-gray-600">
          Download the latest microstatification data in CSV or XLSX.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Download Export
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
              <option value="">-- Select an Option --</option>
              {districtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Format
            </label>
            <select
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={downloading}
            >
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>

        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-gray-700">
          Select a district to export a single file in your chosen format. Select
          All Districts to download a ZIP bundle containing one file per district
          in the selected format.
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
          Included columns: District, Upazila, Union, Ward No, Village Name
          (EN/BN), Village Code, Latitude, Longitude, Population, SK/SHW Name,
          SS Name, MMW/HP/CHWC Name, Distance From Upazila Office, Bordering
          Country Name, Other Activities, monthly case fields, and LLIN fields.
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || !downloadDistrict}
          className="w-full px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default MicrostatificationDownload;
