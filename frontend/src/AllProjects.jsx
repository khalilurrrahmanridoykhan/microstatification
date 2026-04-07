import React, { useEffect, useState } from 'react';
import { fetchProjects, deleteProject } from './api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getProjects = async () => {
      try {
        const response = await fetchProjects();
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    getProjects();
  }, []);

  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEdit = (projectId) => {
    navigate(`/projects/edit/${projectId}`);
  };

  const handleViewForms = (projectId) => {
    navigate(`/projects/${projectId}/forms`);
  };

  return (
    <div>
      <h2>All Projects</h2>
      <ul className="list-group">
        {projects.map((project) => (
          <li key={project.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <button className="btn btn-link" onClick={() => handleViewForms(project.id)}>View Forms</button>
            </div>
            <div>
              <FontAwesomeIcon
                icon={faEdit}
                style={{ cursor: 'pointer', marginRight: '10px' }}
                onClick={() => handleEdit(project.id)}
              />
              <FontAwesomeIcon
                icon={faTrash}
                style={{ cursor: 'pointer' }}
                onClick={() => handleDelete(project.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllProjects;