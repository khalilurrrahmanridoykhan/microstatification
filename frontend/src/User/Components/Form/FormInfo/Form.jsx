import React, { useState } from "react";
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
import { BiPencil, BiShuffle, BiDotsVerticalRounded, BiGlobe } from 'react-icons/bi';
import { BsEyeFill } from 'react-icons/bs';
import { Modal, Button } from "react-bootstrap"; // Add this import
import "./css/Form.css"; // Import the CSS file
import ManageTranslationsModal from "./ManageTranslationsModal";
import axios from "axios";
import {
  BACKEND_URL,
  ENKETO_URL,
  OPENROSA_SERVER_URL,
} from "../../../../config"; // adjust path if needed
import {
  getEnketoAuthHeader,
  getEnketoFormId,
} from "../../../../utils/enketo";
import { toast } from "sonner";

const Form = () => {
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

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleEdit = () => {
    navigate(`/projects/${projectId}/edit_form/${formId}`);
  };

  const handleDownloadXLS = () => {
    // Implement download XLS functionality
    console.log("Download XLS");
  };

  const handleDownloadXML = () => {
    // Implement download XML functionality
    console.log("Download XML");
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
    const openRosaFormUrl = `${OPENROSA_SERVER_URL}/forms/${formId}/form.xml`;
    setEnketoPreviewUrl(`${ENKETO_URL}/preview?form=${openRosaFormUrl}`);
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
      toast.success("Enketo links generated.");
    } catch (err) {
      console.error("Failed to generate Enketo links:", err);
      toast.error("Failed to generate Enketo links");
    }
  };

  // Fetch Enketo data example
  const fetchEnketoData = () => {
    let authHeader;
    try {
      authHeader = getEnketoAuthHeader();
    } catch (error) {
      toast.error(error.message);
      return;
    }
    fetch(`${ENKETO_URL}/api/v2/survey`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
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
        console.log(data);
        toast.success("Enketo data fetched successfully");
      })
      .catch((error) => {
        console.error("Enketo fetch error:", error);
        toast.error("Failed to fetch Enketo data");
      });
  };

  const handleGoToEnketo = () => {
    if (enketoGoTOLinks) {
      window.open(enketoGoTOLinks, "_blank");
    } else {
      toast.error("Enketo link not available. Please fetch data first.");
    }
  };




  return (
    <div className="px-8 py-6">

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-xl font-medium text-gray-800">Current version</h1>
        <div className="flex gap-3 text-gray-700 mt-1">
          <button icon={faEdit}
            className="icon-spacing"
            onClick={handleEdit}
            style={{ cursor: "pointer" }}><FaRegEdit className="w-8 h-8" /> </button>
          <button icon={faEye}
            className="icon-spacing"
            style={{ cursor: "pointer" }}
            onClick={handleEnketoPreview}><BsEyeFill className="w-8 h-8" /> </button>
          <button> <BiShuffle className="w-8 h-8" /> </button>
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
              <DropdownItem onClick={handleDownloadXML}>Download XML</DropdownItem>
              <DropdownItem onClick={handleShareProject}>
                Share the Project
              </DropdownItem>
              <DropdownItem onClick={handleCloneProject}>
                Clone the Project
              </DropdownItem>
              <DropdownItem onClick={handleManageTranslations}>
                Manage Translations
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>


      {/* Form Info Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200 mb-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <div className="flex items-center gap-3">
            <span className="text-blue-500 font-medium text-base">V1</span>
            <span className="text-sm text-gray-500">Last Modified: February 17, 2025 - 5 questions</span>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
            REDEPLOY
          </button>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span><span className='font-semibold'>Languages</span>: This project has no languages defined yet</span>
          <button onClick={handleManageTranslations}> <BiGlobe className="w-6 h-6" /> </button>

        </div>
      </div>

      {/* Collect Data Section */}
      <div className="bg-white p-4 rounded-md border border-gray-200">
        <h3 className="text-xl font-medium text-gray-700 mb-3">Collect data</h3>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
          <div className="relative w-full md:w-auto flex-1">
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm appearance-none pr-8 bg-white">

              <option>Online Only (signle submission) </option>


            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50"
              onClick={fetchEnketoData}
            >
              Fetch Enketo data
            </button>
            <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50"
              onClick={handleGoToEnketo}
            >
              Open Enketo Form
            </button>
          </div>
        </div>
        {/* <p className="text-sm text-gray-500 mb-3">
          This allows online and offline submissions and is the best option for collecting data in the field.
        </p> */}

        {/* Toggle switch */}
        {/* <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-10 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full peer transition-all duration-300 ease-in-out"></div>
            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
          </label>
          <span className="text-sm text-gray-600">
            Allow submissions to this form without a username and password?
          </span>
        </div> */}
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
          <Modal.Title>Form Preview</Modal.Title>
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
