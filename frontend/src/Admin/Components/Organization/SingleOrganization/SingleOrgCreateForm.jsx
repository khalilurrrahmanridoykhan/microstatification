import { useState, useEffect } from "react";
import { FaTimes, FaUpload, FaPencilAlt, FaFileExcel } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

export default function SingleOrgCreateForms() {
  const [currentPage, setCurrentPage] = useState("sourceSelection");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/projects/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setProjects(res.data);
      } catch (error) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const showPage = (pageId) => setCurrentPage(pageId);

  const selectedProject = projects.find(
    (p) => String(p.id) === String(selectedProjectId)
  );

  return (
    <div className="w-full px-4 bg-[#f5f7fa] text-[#333] flex justify-center items-center p-4">
      {/* Source Selection Page */}
      {currentPage === "sourceSelection" && (
        <div className="w-[70%]">
          <div className="overflow-hidden bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-3 text-white bg-color-custom">
              <h2 className="text-lg font-semibold text-white">
                <span className="font-semibold">Choose a source </span>
              </h2>
            </div>
            <div className="p-5">
              <p className="mb-4 text-sm text-gray-600">
                Choose one of the options below to continue. You will be
                prompted to enter name and other details in further steps.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => showPage("projectForm")}
                  className="flex flex-col items-center p-4 transition bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  <FaPencilAlt className="mb-2 text-2xl text-blue-900" />
                  <span className="text-sm font-semibold">
                    Build from scratch
                  </span>
                </button>
                <button
                  onClick={() => showPage("uploadForm")}
                  className="flex flex-col items-center p-4 transition bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  <FaUpload className="mb-2 text-2xl text-blue-900" />
                  <span className="text-sm font-semibold">
                    Upload an XLSForm
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Form Page */}
      {currentPage === "projectForm" && (
        <div className="w-[70%]">
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center bg-[#1814f3bc] text-white px-5 py-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-white ">
                Create project:{" "}
                <span className="font-normal">Project details </span>
              </h2>
              <button
                onClick={() => showPage("sourceSelection")}
                className="text-xl"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-3 space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-800">
                  Paroject <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-800">
                  Description
                </label>
                <textarea
                  value={
                    selectedProject ? selectedProject.description || "" : ""
                  }
                  readOnly
                  placeholder="Enter short description here"
                  className="w-full border border-gray-300 rounded px-4 py-2 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-100"
                ></textarea>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium text-gray-800">
                    Sector <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedProject ? selectedProject.sector || "" : ""}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium text-gray-800">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedProject ? selectedProject.country || "" : ""}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => showPage("sourceSelection")}
                  className="px-4 py-2 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-100"
                >
                  Back
                </button>
                <Link
                  to={
                    selectedProject
                      ? `/forms/create-form/${selectedProject.id}`
                      : "#"
                  }
                  className="px-4 py-2 rounded bg-[#1814f3bc] hover:bg-blue-600 text-white text-sm font-medium no-underline"
                  style={{
                    pointerEvents: selectedProject ? "auto" : "none",
                    opacity: selectedProject ? 1 : 0.5,
                  }}
                >
                  Create project
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload XLSForm Page */}
      {currentPage === "uploadForm" && (
        <div className="w-[70%]">
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center bg-[#1814f3bc] text-white px-5 py-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-white ">
                Create project:{" "}
                <span className="font-normal">Upload XLSForm </span>
              </h2>
              <button
                onClick={() => showPage("sourceSelection")}
                className="text-xl"
              >
                <FaTimes />
              </button>
            </div>
            <p className="p-3 mb-4 text-sm text-gray-600">
              Import an XLSForm from your computer.
            </p>
            <div className="flex flex-col items-center justify-center text-center">
              <label className="w-[70%] border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer p-4 flex flex-col items-center justify-center text-center">
                <FaFileExcel className="mb-2 text-3xl" />
                <p className="text-sm">
                  Drag and drop the XLSForm file here or{" "}
                  <span className="text-blue-500 underline">
                    click to browse
                  </span>
                </p>
                <input type="file" accept=".xls,.xlsx" className="hidden" />
              </label>
            </div>
            <div className="flex justify-end p-3 mt-4">
              <button
                onClick={() => showPage("sourceSelection")}
                className="px-4 py-2 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-100"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
