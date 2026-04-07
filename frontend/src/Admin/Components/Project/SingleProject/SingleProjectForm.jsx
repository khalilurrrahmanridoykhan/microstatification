import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { BACKEND_URL } from "../../../../config";

const SingleProjectForm = ({ projectId, projectData }) => {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loadingForms, setLoadingForms] = useState(true);

    // for delete modal
    const [formToDelete, setFormToDelete] = useState(null);
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
        const token = sessionStorage.getItem("authToken");
        let dataTable;

        const initializeDataTable = () => {
            if (document.getElementById("singleForm")) {
                dataTable = new window.DataTable("#singleForm");
            }
        };

        const fetchForms = async () => {
            setLoadingForms(true);
            try {
                const response = await axios.get(
                    `${BACKEND_URL}/api/projects/${projectId}/forms/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                        params: {
                            include_submissions: "false",
                            compact: "true",
                        },
                    }
                );
                setForms(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error fetching forms:", error);
                setForms([]);
            } finally {
                setLoadingForms(false);
                setTimeout(() => {
                    initializeDataTable();
                }, 250);
            }
        };

        fetchForms();

        return () => {
            if (dataTable) {
                dataTable.destroy();
            }
        };
    }, [projectId]);

    const handleEditForm = (formId) => {
        navigate(`/projects/${projectId}/edit_form/${formId}`);
    };

    const handleDeleteForm = async (formId) => {
        try {
            const token = sessionStorage.getItem("authToken");
            await axios.delete(`${BACKEND_URL}/api/forms/${formId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            setForms((prev) => prev.filter((form) => form.id !== formId));
        } catch (error) {
            console.error("Error deleting form:", error);
        }
    };

    const handleViewFormInfo = (formId) => {
        navigate(`/projects/${projectId}/forms/${formId}`);
    };

    return (
        <div className="mt-2">
            {loadingForms ? (
                <div className="flex items-center justify-center min-h-[180px] bg-white border rounded-lg border-black/70">
                    <div className="flex items-center gap-3 text-gray-700">
                        <div className="w-5 h-5 border-b-2 border-blue-600 rounded-full animate-spin" />
                        <span>Loading forms...</span>
                    </div>
                </div>
            ) : (
            <div className="bg-white p-4 border border-black/70 rounded-lg overflow-x-auto">
                <table id="singleForm" className="border-collapse table-auto display bg-white">
                    <thead>
                        <tr>
                            <th className="max-w-[200px]">Form Name</th>
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
                                    <td className="max-w-[250px] overflow-hidden whitespace-nowrap">
                                        <button
                                            className="w-[240px] truncate text-start text-color-custom font-medium"
                                            onClick={() => handleViewFormInfo(form.id)}
                                            title={form.name}
                                        >
                                            {form.name}
                                        </button>
                                    </td>
                                    <td>{form.location || projectData?.location || "-"}</td>
                                    <td>
                                        {new Date(form.updated_at).toLocaleString("en-US", {
                                            timeZone: "UTC",
                                        })}
                                    </td>
                                    <td>
                                        {new Date(form.created_at).toLocaleString("en-US", {
                                            timeZone: "UTC",
                                        })}
                                    </td>
                                    <td className="action-buttons">
                                        <button className="" onClick={() => handleEditForm(form.id)}>
                                            <FaEdit />
                                        </button>
                                        <button className="" onClick={() => confirmDelete(form.id)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No forms available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            )}

            {/* Modal */}
            {showDeleteModal && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Deletion</h5>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={handleCancelDelete}
                                >
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this form?</p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCancelDelete}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleConfirmDelete}
                                >
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

export default SingleProjectForm;
