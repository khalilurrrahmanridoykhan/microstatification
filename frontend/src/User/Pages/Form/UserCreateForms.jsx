import { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaPencilAlt, FaFileExcel } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';

export default function CreateForms() {
  const [currentPage, setCurrentPage] = useState('sourceSelection');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
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
      {currentPage === 'sourceSelection' && (
        <div className="w-[70%]">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-[#1814f3bc] text-white p-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                Create project: <span className="font-normal">Choose a source </span>
              </h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Choose one of the options below to continue. You will be prompted to enter name and other details in further steps.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => showPage('projectForm')}
                  className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex flex-col items-center hover:bg-gray-200 transition"
                >
                  <FaPencilAlt className="text-2xl text-blue-900 mb-2" />
                  <span className="text-sm font-semibold">Build from scratch</span>
                </button>
                <button
                  onClick={() => showPage('uploadForm')}
                  className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex flex-col items-center hover:bg-gray-200 transition"
                >
                  <FaUpload className="text-2xl text-blue-900 mb-2" />
                  <span className="text-sm font-semibold">Upload an XLSForm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Form Page */}
      {currentPage === 'projectForm' && (
        <div className="w-[70%]">
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center bg-[#1814f3bc] text-white px-5 py-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold  text-white ">
                Create project: <span className="font-normal">Project details </span>
              </h2>
              <button onClick={() => showPage('sourceSelection')} className="text-xl">
                <FaTimes />
              </button>
            </div>
            <div className="space-y-5 p-3">
              <div>
                <label className="block font-medium text-sm text-gray-800 mb-1">
                  Paroject <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a project...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-sm text-gray-800 mb-1">Description</label>
                <textarea
                  value={selectedProject ? selectedProject.description || '' : ''}
                  readOnly
                  placeholder="Enter short description here"
                  className="w-full border border-gray-300 rounded px-4 py-2 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-100"
                ></textarea>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block font-medium text-sm text-gray-800 mb-1">
                    Sector <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedProject ? selectedProject.sector || '' : ''}
                    readOnly
                    className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-medium text-sm text-gray-800 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedProject ? selectedProject.location || '' : ''}
                    readOnly
                    className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => showPage('sourceSelection')}
                  className="border border-blue-500 text-blue-500 hover:bg-blue-100 px-4 py-2 rounded text-sm"
                >
                  Back
                </button>
                <Link
                  to={selectedProject ? `/forms/create-form/${selectedProject.id}` : "#"}
                  className="px-4 py-2 rounded bg-[#1814f3bc] hover:bg-blue-600 text-white text-sm font-medium no-underline"
                  style={{ pointerEvents: selectedProject ? 'auto' : 'none', opacity: selectedProject ? 1 : 0.5 }}
                >
                  Create project
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload XLSForm Page */}
      {currentPage === 'uploadForm' && (
        <div className="w-[70%]">
          <div className="bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center bg-[#1814f3bc] text-white px-5 py-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold  text-white ">
                Create project: <span className="font-normal">Upload XLSForm </span>
              </h2>
              <button onClick={() => showPage('sourceSelection')} className="text-xl">
                <FaTimes />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4 p-3">Import an XLSForm from your computer.</p>
            <div className="flex flex-col items-center justify-center text-center">
              <label className="w-[70%] border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:bg-gray-100 cursor-pointer p-4 flex flex-col items-center justify-center text-center">
                <FaFileExcel className="text-3xl mb-2" />
                <p className="text-sm">
                  Drag and drop the XLSForm file here or <span className="text-blue-500 underline">click to browse</span>
                </p>
                <input type="file" accept=".xls,.xlsx" className="hidden" />
              </label>
            </div>
            <div className="flex justify-end mt-4 p-3">
              <button
                onClick={() => showPage('sourceSelection')}
                className="border border-blue-500 text-blue-500 hover:bg-blue-100 px-4 py-2 rounded text-sm"
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