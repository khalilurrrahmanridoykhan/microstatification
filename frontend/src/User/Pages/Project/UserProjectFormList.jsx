import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../../config';
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';


const ProjectFormsList = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [projectName, setProjectName] = useState('');

    // for delete modal
    const [formToDelete, setFormToDelete] = useState(null); // to store form id
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const confirmDelete = (formId) => {
        setFormToDelete(formId);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (formToDelete) {
            handleDeleteForm(formToDelete);
        }
        setShowDeleteModal(false);
        setFormToDelete(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setFormToDelete(null);
    }


    useEffect(() => {
        const token = sessionStorage.getItem('authToken');
        let dataTable;

        const initializeDataTable = () => {
            if (document.getElementById("singleForm")) {
                dataTable = new window.DataTable("#singleForm", { retrieve: true });
            }
        };

        const fetchForms = async () => {
            try {

                const response = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/`, {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                console.log('API Response:', response.data); // Debugging: Log the API response


                // getting project name and other details into inner obj forms
                const ProjectWithForms = response.data;
                setProjectName(ProjectWithForms.name);
                const enrichedForms = ProjectWithForms.forms.map(form => ({
                    ...form,
                    projectName: ProjectWithForms.name,
                    location: ProjectWithForms.location,
                    created_by: ProjectWithForms.created_by,
                    organization: ProjectWithForms.organization
                    ,
                }));
                setForms(enrichedForms || []);
                if (forms.length > 0) {
                    setTimeout(() => {
                        initializeDataTable();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error fetching forms:', error);
                setForms([]); // Ensure forms is always an array
            }
        };


        fetchForms();

        return () => {
            if (dataTable) {
                dataTable.destroy();
            }
        };

    }, []);

    console.log('Forms:', forms);

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
            <div className="d-flex justify-content-between align-items-center mb-3 ">
                <h2 className='text-black'>Forms for Project: <span className='text-4xl text-blue-500'>{projectName}</span></h2>
                <button className="btn btn-primary" onClick={handleCreateForm}>Create Form</button>
            </div>
            <table id='singleForm' className="table table-striped">
                <thead>
                    <tr>
                        <th>Form Name</th>
                        <th>Location</th>
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
                                    <button className="text-blue-600 font-medium" onClick={() => handleViewFormInfo(form.id)}>
                                        {form.name}
                                    </button>
                                </td>
                                <td>{form.location}</td>
                                <td>{new Date(form.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                                <td>{new Date(form.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                                <td>
                                    <button className="btn btn-primary btn-sm opacity-70" onClick={() => handleEditForm(form.id)}><FaEdit /></button>
                                    <button className="btn btn-danger btn-sm ml-2" onClick={() => confirmDelete(form.id)}><FaTrash /></button>
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
            {/* Modal */}
            {showDeleteModal && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Deletion</h5>
                                <button type="button" className="close" onClick={handleCancelDelete}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this form?</p>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={handleCancelDelete}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleConfirmDelete}>
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectFormsList;
