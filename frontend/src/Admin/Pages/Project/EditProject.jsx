import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProject, updateProject } from '../../../api';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'sonner';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';
import { BiWorld } from "react-icons/bi";

const EditProject = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState({
    name: '',
    description: '',
    location: '',
    species: []
  });

  useEffect(() => {
    const getProject = async () => {
      try {
        const response = await fetchProject(projectId);
        const data = response.data;
        setProject({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          species: data.species || []
        });
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    getProject();
  }, [projectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem("authToken");
      await axios.patch(
        `${BACKEND_URL}/api/projects/${projectId}/`,
        {
          name: project.name,
          organization: project.organization, // send organization id if needed
          description: project.description,
          organization_type: project.organization_type,
          organization_website: project.organization_website,
          password: project.password,
          location: project.location,
          active_user: project.active_user,
          receive_updates: project.receive_updates,
          species: project.species, // array of IDs
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      toast.success("Project updated successfully");
      navigate("/projects/all");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error("Failed to update project");
        console.error("Validation error:", error.response.data);
      } else {
        toast.error("Error updating project");
      }
      console.error(error);
    }
  };


  return (
    <div className="p-4">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Edit Project
      </h2>
      <form onSubmit={handleSubmit} className='p-4 bg-white rounded-lg border border-black/70'>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={project.name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description:</label>
          <textarea
            className="form-control"
            name="description"
            value={project.description}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Location:</label>
          <select id="location" name="location" value={project.location}
            onChange={handleChange}>
            <option value="" disabled>Select location</option>
            <option>Bangladesh</option>
            <option>United States</option>
            <option>United Kingdom</option>
            <option>Canada</option>
            <option>Other</option>
          </select>
        </div>


        <MultiSelectDropdown
          form={project}
          setForm={setProject}
        />

        <button type="submit" className="btn btn-primary">Update Project</button>
      </form>
    </div>
  );
};

export default EditProject;

// ----------------- MultiSelectDropdown Component -----------------

function MultiSelectDropdown({ form, setForm }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const speciesOptions = [
    { id: 1, label: "Human" },
    { id: 2, label: "Dog" },
    { id: 3, label: "Cat" },
    { id: 4, label: "Mosquito" },
    { id: 5, label: "Bacterium" },
    { id: 6, label: "Bat" },
    { id: 7, label: "Other" },
    { id: 8, label: "Malaria" }
  ]

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (id) => {
    const newSelection = form.species.includes(id)
      ? form.species.filter((item) => item !== id)
      : [...form.species, id];
    setForm((prev) => ({ ...prev, species: newSelection }));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-group relative mb-3" ref={dropdownRef}>
      <label className="block mb-1 font-medium text-gray-700">Surveyed Hosts</label>

      {/* Dropdown box */}
      <div
        className="w-full border rounded px-3 py-2 bg-white cursor-pointer"
        onClick={toggleDropdown}
      >
        {form.species.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {speciesOptions
              .filter((opt) => form.species.includes(opt.id))
              .map((opt) => (
                <span
                  key={opt.id}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  {opt.label}
                </span>
              ))}
          </div>
        ) : (
          <span className="text-gray-400">Select surveyed hosts...</span>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {speciesOptions.map((option) => (
            <div
              key={option.id}
              className={`px-4 py-2 hover:bg-blue-50 flex items-center cursor-pointer ${form.species.includes(option.id) ? "bg-blue-100" : ""
                }`}
              onClick={() => handleSelect(option.id)}
            >
              <input
                type="checkbox"
                className="mr-2"
                readOnly
                checked={form.species.includes(option.id)}
              />
              {option.label}
            </div>
          ))}
        </div>
      )}

      <small className="text-gray-500">Select one or more surveyed hosts</small>
    </div>
  );
}
