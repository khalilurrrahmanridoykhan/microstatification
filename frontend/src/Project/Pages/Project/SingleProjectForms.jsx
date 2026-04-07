import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { FaEdit, FaTrash, FaUser } from "react-icons/fa";
import Swal from "sweetalert2";

const ProProjectForms = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [projectName, setProjectName] = useState("");

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
            try {
                const response = await axios.get(
                    `${BACKEND_URL}/api/projects/${projectId}/`,
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );
                console.log("API Response:", response.data); // Debugging: Log the API response

                // getting project name and other details into inner obj forms
                const ProjectWithForms = response.data;
                setProjectName(ProjectWithForms.name);
                const enrichedForms = ProjectWithForms.forms.map((form) => ({
                    ...form,
                    projectName: ProjectWithForms.name,
                    location: ProjectWithForms.location,
                    created_by: ProjectWithForms.created_by,
                    organization: ProjectWithForms.organization,
                }));
                setForms(enrichedForms || []);
                if (enrichedForms.length > 0) {
                    setTimeout(() => {
                        initializeDataTable();
                    }, 1000);
                }
            } catch (error) {
                console.error("Error fetching forms:", error);
                setForms([]); // Ensure forms is always an array
                setTimeout(() => {
                    initializeDataTable([]);
                }, 0);
            }
        };

        fetchForms();

        return () => {
            if (dataTable) {
                dataTable.destroy();
            }
        };
    }, []);

    // console.log('Forms:', forms);

    const handleCreateForm = () => {
        navigate(`/projects/${projectId}/create_form`);
    };

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
            setForms(forms.filter((form) => form.id !== formId));
        } catch (error) {
            console.error("Error deleting form:", error);
        }
    };

    const handleViewFormInfo = (formId) => {
        navigate(`/projects/${projectId}/forms/${formId}`);
    };

    return (
        <div className="mt-2 p-4">
            <div className="mb-3 d-flex justify-content-between align-items-center ">

                <h2 className="inline-block mb-4 text-black text-[22px]  border-b-2 border-blue-400 border-solid">
                    Project forms: <span className="text-[22px] text-blue-500">{projectName}</span>
                </h2>


                <button className="btn save-button" onClick={handleCreateForm}>
                    Create Form
                </button>
            </div>
            <div className="bg-white p-4 border border-black/70 rounded-lg overflow-x-auto">
                <table id="singleForm" className="border-collapse table-auto display bg-white">
                    <thead>
                        <tr>
                            <th className="w-[100px]">SL No</th>
                            <th className="max-w-[200px]">Form Name</th>
                            <th>Location</th>
                            <th>Updated At</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forms.length > 0 ? (
                            forms.map((form, idx) => (

                                <tr key={form.id}>
                                    <td className="p-3 whitespace-nowrap">{String(idx + 1).padStart(2, "0")}.</td>
                                    <td className="max-w-[250px] overflow-hidden whitespace-nowrap">
                                        <button
                                            className="w-[240px] truncate text-start text-color-custom font-medium"
                                            onClick={() => handleViewFormInfo(form.id)}
                                            title={form.name}
                                        >
                                            {form.name}
                                        </button>
                                    </td>
                                    <td>{form.location}</td>
                                    <td>
                                        {new Date(form.updated_at).toLocaleString("en-US", {
                                            timeZone: "Asia/Dhaka",
                                            year: "numeric",
                                            month: "long",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            // second: "2-digit",
                                            hour12: true, // Enables AM/PM
                                        })}
                                    </td>
                                    <td>
                                        {new Date(form.created_at).toLocaleString("en-US", {
                                            timeZone: "Asia/Dhaka",
                                            year: "numeric",
                                            month: "long",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            // second: "2-digit",
                                            hour12: true, // Enables AM/PM
                                        })}
                                    </td>
                                    <td className="action-buttons">
                                        <button className="" onClick={() => handleEditForm(form.id)}>
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const result = await Swal.fire({
                                                    title: "Are you sure?",
                                                    text: "This will delete the form permanently.",
                                                    icon: "warning",
                                                    showCancelButton: true,
                                                    confirmButtonColor: "#d33",
                                                    cancelButtonColor: "#3085d6",
                                                    confirmButtonText: "Yes, delete it!",
                                                });
                                                if (result.isConfirmed) {
                                                    try {
                                                        await handleDeleteForm(form.id);
                                                        Swal.fire("Deleted!", "The form has been deleted.", "success");
                                                    } catch (error) {
                                                        Swal.fire("Error!", "Failed to delete the form.", "error");
                                                    }

                                                }
                                            }}
                                        >
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

export default ProProjectForms;
