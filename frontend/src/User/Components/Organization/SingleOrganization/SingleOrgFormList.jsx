import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BACKEND_URL } from '../../../../config';


const SingleOrgFormList = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");


    const [forms, setForms] = useState([]);
    const [projectName, setProjectName] = useState('');

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
    };




    useEffect(() => {
        if (!userInfo) return;

        const token = sessionStorage.getItem("authToken");



        const fetchForms = async () => {
            try {
                const userResponse = await axios.get(`${BACKEND_URL}/api/users/${userInfo.username}/`, {
                    headers: { Authorization: `Token ${token}` },
                });

                const formIds = userResponse.data.profile.forms || [];

                const formPromises = formIds.map((id) =>
                    axios.get(`${BACKEND_URL}/api/forms/${id}/`, {
                        headers: { Authorization: `Token ${token}` },
                    })
                );

                const formResponses = await Promise.allSettled(formPromises);

                const allForms = formResponses
                    .filter(res => res.status === 'fulfilled')
                    .map(res => res.value.data);


                setForms(allForms);

            } catch (error) {
                console.error("Error fetching forms:", error);
                setForms([]);
            }
        };

        fetchForms();

    }, []);

    useEffect(() => {
        let dataTable;
        if (forms.length > 0 && document.getElementById("AllForm")) {
            dataTable = new window.DataTable("#AllForm");
        }

        return () => {
            if (dataTable) dataTable.destroy();
        };
    }, []);

    const handleCreateForm = () => {
        navigate(`/projects/${projectId}/create_form`);
    };

    const handleEditForm = (project, formId) => {
        navigate(`/projects/${project}/edit_form/${formId}`);
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

    const handleViewFormInfo = (project, formId) => {
        navigate(`/projects/${project}/forms/${formId}`);
    };

    return (
        <div className="p-4 overflow-x-auto">

            <table id="AllForm" className=" border-collapse table-auto display">
                <thead
                >
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
                                    <button className=" text-blue-500 font-medium" onClick={() => handleViewFormInfo(form.project, form.id)}>
                                        {form.name}
                                    </button>
                                </td>
                                <td>{form.project}</td> {/* optional: shows which project this form belongs to */}
                                <td>{new Date(form.updated_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                                <td>{new Date(form.created_at).toLocaleString('en-US', { timeZone: 'UTC' })}</td>
                                <td>
                                    <button className="btn btn-primary btn-sm opacity-70" onClick={() => handleEditForm(form.project, form.id)}><FaEdit /></button>
                                    <button className="btn btn-danger btn-sm ml-2 opacity-90" onClick={() => confirmDelete(form.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">No forms available</td>
                            <td colSpan="5" className="text-center hidden">No forms available</td>
                            <td colSpan="5" className="text-center hidden">No forms available</td>
                            <td colSpan="5" className="text-center hidden">No forms available</td>
                            <td colSpan="5" className="text-center hidden">No forms available</td>

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

export default SingleOrgFormList