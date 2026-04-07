import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faEye, faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FaRegEdit } from "react-icons/fa";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import {
  BiPencil,
  BiShuffle,
  BiDotsVerticalRounded,
  BiGlobe,
} from "react-icons/bi";
import { BsEyeFill } from "react-icons/bs";
import { Modal, Button } from "react-bootstrap"; // Add this import
import "./css/Form.css"; // Import the CSS file
import ManageTranslationsModal from "./ManageTranslationsModal";
import axios from "axios";
import {
  BACKEND_URL,
  ENKETO_URL,
  OPENROSA_SERVER_URL,
} from "../../../../config";
import {
  getEnketoAuthHeader,
  getEnketoFormId,
} from "../../../../utils/enketo";
import { toast } from "sonner";
import {
  downloadFormQuestionsJson,
  extractDownloadErrorMessage,
} from "../utils/downloadFormQuestionsJson";

const Form = ({ formMeta = null }) => {
  const navigate = useNavigate();
  const { projectId, formId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTranslationsModal, setShowTranslationsModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [enketoHtml, setEnketoHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEnketoModal, setShowEnketoModal] = useState(false);
  const [enketoPreviewUrl, setEnketoPreviewUrl] = useState("");

  // Add state for generated Enketo links
  const [enketoLinks, setEnketoLinks] = useState({
    multiple: "",
    single: "",
    singleOnce: "",
  });

  // fo testing enketo links
  const [enketoGoTOLinks, setGoTOEnketoLinks] = useState("");

  const getEnketoAuthConfig = () => {
    try {
      return {
        headers: {
          Authorization: getEnketoAuthHeader(),
          "Content-Type": "application/json",
        },
      };
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const buildEnketoPayload = (extra = {}) => ({
    form_id: getEnketoFormId(formId),
    server_url: OPENROSA_SERVER_URL,
    ...extra,
  });

  // Add a new state to store the enketo ID
  const [enketoId, setEnketoId] = useState("");

  const [allowAnonymousSubmissions, setAllowAnonymousSubmissions] = useState(
    Boolean(formMeta?.allow_anonymous_submissions)
  );
  const [loadingFormSettings, setLoadingFormSettings] = useState(
    !formMeta || typeof formMeta?.allow_anonymous_submissions === "undefined"
  );
  const [resolvedFormMeta, setResolvedFormMeta] = useState(formMeta);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleEdit = () => {
    navigate(`/template/projects/${projectId}/edit_form/${formId}`);
  };

  const handleDownloadXLS = () => {
    // Implement download XLS functionality
    console.log("Download XLS");
  };

  const handleDownloadQuestionsJson = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    try {
      await downloadFormQuestionsJson(formId, token);
      toast.success("Questions JSON downloaded");
    } catch (error) {
      console.error("Questions JSON download failed:", error);
      toast.error(
        await extractDownloadErrorMessage(error, "Failed to download questions JSON")
      );
    }
  };

  const handleShareProject = () => {
    // Implement share project functionality
    console.log("Share Project");
  };

  const handleCloneProject = () => {
    // Implement clone project functionality
    console.log("Clone Project");
  };

  const handleManageTranslations = () => {
    setShowTranslationsModal(true);
  };

  const handlePreview = async () => {
    setShowPreview(true);
    setLoading(true);
    setEnketoHtml("");
    try {
      const token = sessionStorage.getItem("authToken");
      // 1. Download XLSX
      const xlsxRes = await axios.get(
        `${BACKEND_URL}/api/forms/${formId}/xlsx/`,
        {
          headers: { Authorization: `Token ${token}` },
          responseType: "blob",
        }
      );
      const xlsxFile = new File([xlsxRes.data], "form.xlsx");

      // 2. Convert XLSX to XForm XML
      const formData = new FormData();
      formData.append("file", xlsxFile, "form.xlsx");
      const xmlRes = await axios.post(
        `${BACKEND_URL}/api/convert/xlsform/`,
        formData,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      const xformXml = xmlRes.data.xform;
      console.log("XForm XML:", xformXml);

      // 3. POST XML to Enketo
      const enketoRes = await axios.post(
        `${ENKETO_URL}/transform/xform`,
        new URLSearchParams({ xform: xformXml }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        }
      );
      console.log("Enketo HTML:", enketoRes.data);
      setEnketoHtml(enketoRes.data); // This is HTML
    } catch (err) {
      setEnketoHtml("<div style='color:red'>Failed to load preview</div>");
    }
    setLoading(false);
  };

  const handleEnketoPreview = () => {
    // Build OpenRosa form XML URL using BACKEND_URL
    // Build OpenRosa form XML URL using BACKEND_URL
    const openRosaFormUrl = `${OPENROSA_SERVER_URL}/forms/${formId}/form.xml`;
    console.log("OpenRosa Form URL:", openRosaFormUrl);
    setEnketoPreviewUrl(
      `${ENKETO_URL}/preview?form=${openRosaFormUrl}`
    );
    setShowEnketoModal(true);
  };

  const handleSaveTranslations = () => {
    // Implement any additional logic after saving translations
    console.log("Translations saved");
  };

  const generateEnketoLinks = async () => {
    try {
      const authConfig = getEnketoAuthConfig();
      const payload = buildEnketoPayload();
      const resMultiple = await axios.post(
        `${ENKETO_URL}/api/v2/survey`,
        payload,
        authConfig
      );
      const resSingle = await axios.post(
        `${ENKETO_URL}/api/v2/survey/single`,
        payload,
        authConfig
      );
      const resSingleOnce = await axios.post(
        `${ENKETO_URL}/api/v2/survey/single/once`,
        buildEnketoPayload({ uuid: "abcd1234efgh5678" }),
        authConfig
      );
      setEnketoLinks({
        multiple: resMultiple.data.url,
        single: resSingle.data.url,
        singleOnce: resSingleOnce.data.url,
      });
    } catch (err) {
      console.error("Failed to generate Enketo links:", err);
      toast.error("Failed to generate Enketo links");
    }
  };

  // Fetch Enketo data example
  const fetchEnketoData = () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    fetch(`${BACKEND_URL}/api/enketo/survey/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildEnketoPayload()),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch Enketo data");
        }
        return res.json();
      })
      .then((data) => {
        setGoTOEnketoLinks(data.url);

        // Extract Enketo ID from URL (e.g., "SkUA4aj9" from "http://enketo.commicplan.com/SkUA4aj9")
        const extractedEnketoId = data.url.split("/").pop();
        setEnketoId(extractedEnketoId);

        console.log("Full Enketo URL:", data.url);
        console.log("Enketo ID:", extractedEnketoId);

        // Save Enketo ID to form data
        saveEnketoIdToForm(extractedEnketoId);

        toast.success("Enketo data fetched successfully");
      })
      .catch((error) => {
        console.error("Enketo fetch error:", error);
        toast.error("Failed to fetch Enketo data");
      });
  };

  // Add new function to save Enketo ID to form
  const saveEnketoIdToForm = async (enketoId) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.patch(
        `${BACKEND_URL}/api/forms/${formId}/`,
        { enketo_id: enketoId },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Enketo ID saved to form:", response.data);
      toast.success("Enketo ID saved to form successfully");
    } catch (error) {
      console.error("Error saving Enketo ID:", error);
      toast.error("Failed to save Enketo ID to form");
    }
  };

  const handleGoToEnketo = () => {
    if (enketoGoTOLinks) {
      window.open(enketoGoTOLinks, "_blank");
    } else {
      toast.error("Enketo link not available. Please fetch data first.");
    }
  };

  useEffect(() => {
    if (formMeta) {
      setResolvedFormMeta(formMeta);
    }
  }, [formMeta]);

  const languageSummary = useMemo(() => {
    const currentMeta = resolvedFormMeta || formMeta || {};
    const defaultLanguage = currentMeta?.default_language_meta;
    const otherLanguages = Array.isArray(currentMeta?.other_languages_meta)
      ? currentMeta.other_languages_meta
      : [];

    const formatLanguage = (language) => {
      if (!language) {
        return "";
      }
      const description = language.description || "";
      const subtag = language.subtag || "";
      if (description && subtag) {
        return `${description} (${subtag})`;
      }
      return description || subtag || "";
    };

    const parts = [];
    const defaultLabel = formatLanguage(defaultLanguage);
    if (defaultLabel) {
      parts.push(`Default: ${defaultLabel}`);
    }

    if (otherLanguages.length > 0) {
      const otherLabels = otherLanguages
        .map((language) => formatLanguage(language))
        .filter(Boolean);
      if (otherLabels.length > 0) {
        parts.push(`Other: ${otherLabels.join(", ")}`);
      }
    }

    if (parts.length === 0) {
      return "This project has no languages defined yet";
    }

    return parts.join(" | ");
  }, [resolvedFormMeta, formMeta]);

  // Load anonymous-setting from parent metadata when available.
  // Fallback to lightweight form detail call when metadata is not passed.
  useEffect(() => {
    const fetchFormData = async () => {
      setLoadingFormSettings(true);
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(
          `${BACKEND_URL}/api/forms/${formId}/`,
          {
            params: { include_submissions: "false" },
            headers: { Authorization: `Token ${token}` },
          }
        );

        setResolvedFormMeta(response.data);
        // Set the anonymous submissions state from database
        setAllowAnonymousSubmissions(
          response.data.allow_anonymous_submissions || false
        );
      } catch (error) {
        console.error("Error fetching form data:", error);
      } finally {
        setLoadingFormSettings(false);
      }
    };

    if (formMeta && typeof formMeta.allow_anonymous_submissions !== "undefined") {
      setAllowAnonymousSubmissions(
        Boolean(formMeta.allow_anonymous_submissions)
      );
      setLoadingFormSettings(false);
      return;
    }

    if (!formId) {
      setLoadingFormSettings(false);
      return;
    }

    fetchFormData();
  }, [formId, formMeta]);

  // Update the toggle handler to save to database
  const handleAnonymousToggle = async (checked) => {
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.patch(
        `${BACKEND_URL}/api/forms/${formId}/anonymous-setting/`,
        { allow_anonymous_submissions: checked },
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAllowAnonymousSubmissions(checked);
      toast.success(
        checked
          ? "Anonymous submissions enabled"
          : "Anonymous submissions disabled"
      );
    } catch (error) {
      console.error("Error updating anonymous setting:", error);
      toast.error("Failed to update anonymous submission setting");
    }
  };

  if (loadingFormSettings) {
    return (
      <div className="flex items-center justify-center min-h-[220px] bg-white border rounded-lg border-black/70">
        <div className="flex items-center gap-3 text-gray-700">
          <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
          <span>Loading form settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-xl font-medium text-gray-800">
          Current version 1.0.0
        </h1>
        <div className="flex gap-3 mt-1 text-gray-700">
          <button
            icon={faEdit}
            className="icon-spacing"
            onClick={handleEdit}
            style={{ cursor: "pointer" }}
          >
            <FaRegEdit className="w-8 h-8" />{" "}
          </button>
          <button
            icon={faEye}
            className="icon-spacing"
            style={{ cursor: "pointer" }}
            onClick={handleEnketoPreview}
          >
            <BsEyeFill className="w-8 h-8" />{" "}
          </button>

          <Dropdown
            isOpen={dropdownOpen}
            toggle={toggleDropdown}
            className="dropdown-custom"
          >
            <DropdownToggle
              tag="span"
              data-toggle="dropdown"
              aria-expanded={dropdownOpen}
            >
              <BiDotsVerticalRounded className="w-8 h-8 cursor-pointer" />
            </DropdownToggle>
            <DropdownMenu right>
              {/* <DropdownItem onClick={handleDownloadXLS}>Download XLS</DropdownItem> */}
              <DropdownItem onClick={handleDownloadQuestionsJson}>
                Download Questions JSON
              </DropdownItem>
              {/* <DropdownItem onClick={handleShareProject}>
                Share the Project
              </DropdownItem>
              <DropdownItem onClick={handleCloneProject}>
                Clone the Project
              </DropdownItem> */}
              <DropdownItem onClick={handleManageTranslations}>
                Manage Translations
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Form Info Section */}
      <div className="p-4 mb-5 bg-white border border-gray-200 rounded-md">
        {/* <div className="flex items-center justify-between pb-2 mb-4 border-b">
          <div className="flex items-center gap-3">
            <span className="text-base font-medium text-blue-500">V1</span>
            <span className="text-sm text-gray-500">Last Modified: February 17, 2025 - 5 questions</span>
          </div>
          <button className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600">
            REDEPLOY
          </button>
        </div> */}
        <div className="flex justify-between text-gray-500 text-md">
          <span>
            <span className="font-semibold">Languages</span>: {languageSummary}
          </span>
          <button onClick={handleManageTranslations}>
            {" "}
            <BiGlobe className="w-6 h-6" />{" "}
          </button>
        </div>
      </div>

      {/* Collect Data Section */}
      <div className="p-4 bg-white border border-gray-200 rounded-md">
        <h3 className="mb-3 text-xl font-medium text-gray-700">Collect data</h3>
        <div className="flex flex-col gap-4 mb-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 w-full md:w-auto">
            <select className="w-full px-3 py-2 pr-8 bg-white border border-gray-300 rounded-md appearance-none text-md">
              <option>Online Only (signle submission) </option>
            </select>
            <div className="absolute transform -translate-y-1/2 pointer-events-none top-1/2 right-3">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 text-md">
            <button
              className="px-4 py-2 border border-blue-500 rounded-md text-color-custom hover:bg-blue-50"
              onClick={fetchEnketoData}
            >
              Fetch Enketo data
            </button>
            <button
              className="px-4 py-2 border border-blue-500 rounded-md text-color-custom hover:bg-blue-50"
              onClick={handleGoToEnketo}
            >
              Open Enketo Form
            </button>
          </div>
        </div>

        {/* Toggle switch */}
        <div className="flex items-center gap-3 mt-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={allowAnonymousSubmissions}
              onChange={(e) => handleAnonymousToggle(e.target.checked)} // Updated handler
            />
            <div
              className={`w-11 h-6 rounded-full peer transition-all duration-300 ease-in-out ${allowAnonymousSubmissions ? "bg-green-500" : "bg-gray-300"
                }`}
            ></div>
            <div
              className={`absolute w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out ${allowAnonymousSubmissions ? "translate-x-6 left-1" : "left-1"
                }`}
            ></div>
          </label>
          <span className="text-sm text-gray-600">
            Allow submissions to this form without a username and password
          </span>
        </div>
      </div>

      <ManageTranslationsModal
        show={showTranslationsModal}
        onHide={() => setShowTranslationsModal(false)}
        formId={formId}
        onSave={handleSaveTranslations}
      />

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Form Preview 1</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "80vh" }}>
          {loading ? (
            <div>Loading preview...</div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                minHeight: "70vh",
                overflow: "auto",
              }}
              dangerouslySetInnerHTML={{ __html: enketoHtml }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Enketo Preview Modal */}
      <Modal
        show={showEnketoModal}
        onHide={() => setShowEnketoModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Form Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "80vh", padding: 0 }}>
          <iframe
            src={enketoPreviewUrl}
            title="Enketo Preview"
            style={{ width: "100%", height: "80vh", border: "none" }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnketoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Form;
