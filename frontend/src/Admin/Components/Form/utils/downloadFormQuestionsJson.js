import axios from "axios";
import { BACKEND_URL } from "../../../../config";

function triggerBrowserDownload(downloadUrl, filename) {
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function resolveDownloadFilename(contentDisposition, fallback) {
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

export async function downloadFormQuestionsJson(formId, token) {
  const response = await axios.get(
    `${BACKEND_URL}/api/forms/${formId}/questions-json/`,
    {
      headers: { Authorization: `Token ${token}` },
      responseType: "blob",
    }
  );

  const fallbackFilename = `form_${formId}_questions.json`;
  const filename = resolveDownloadFilename(
    response.headers?.["content-disposition"],
    fallbackFilename
  );

  const objectUrl = URL.createObjectURL(response.data);
  triggerBrowserDownload(objectUrl, filename);
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60_000);
}

export async function extractDownloadErrorMessage(
  error,
  fallback = "Failed to download questions JSON"
) {
  const blob = error?.response?.data;
  if (blob instanceof Blob) {
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      return parsed?.detail || parsed?.error || fallback;
    } catch {
      return fallback;
    }
  }

  return error?.response?.data?.detail || error?.message || fallback;
}
