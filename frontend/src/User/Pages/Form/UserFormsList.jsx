import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';

const FormsList = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/forms/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        console.log('API Response:', response.data); // Debugging: Log the API response
        setForms(response.data || []);
      } catch (error) {
        console.error('Error fetching forms:', error);
        setForms([]); // Ensure forms is always an array
      }
    };

    const fetchProject = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setProjectName(response.data.name);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    fetchForms();
    fetchProject();
  }, [projectId]);

  const handleCreateForm = () => {
    navigate(`/projects/${projectId}/create_form`);
  };

  const handleEditForm = (formId) => {
    navigate(`/projects/${projectId}/edit_form/${formId}`);
  };

  const handleDeleteForm = async (formId) => {
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.delete(`${BACKEND_URL}/api/forms/${formId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      setForms(forms.filter((form) => form.id !== formId));
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  const handleViewFormInfo = (formId) => {
    navigate(`/projects/${projectId}/forms/${formId}`);
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Forms for Project: {projectName}</h2>
        <button className="btn btn-primary" onClick={handleCreateForm}>Create Form</button>
      </div>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Form Name</th>
            <th>Project Name</th>
            <th>Updated At</th>
            <th>Created At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {forms.length > 0 ? (
            forms.map((form) => (
              <tr key={form.id}>
                <td>
                  <button className="btn btn-link" onClick={() => handleViewFormInfo(form.id)}>
                    {form.name}
                  </button>
                </td>
                <td>{projectName}</td>
                <td>{new Date(form.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                <td>{new Date(form.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEditForm(form.id)}>Edit</button>
                  <button className="btn btn-danger btn-sm ml-2" onClick={() => handleDeleteForm(form.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">No forms available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default FormsList;
