import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BACKEND_URL } from '../../../../config';
import Swal from "sweetalert2";



const SingleOrgFormList = ({ allProjects, setAllProjects }) => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const [myAllForm, setMyAllForm] = useState([])

    console.log("all project from project tab: ", allProjects)


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
        let table;
        const initializeDataTable = () => {
            if (document.getElementById("AllForm")) {
                table = new window.DataTable("#AllForm");
            }
        };

        if (allProjects?.length > 0) {
            const flattenedForms = allProjects.flatMap((project) =>
                (project.forms || []).map((form) => ({
                    ...form,
                    projectId: project.id,
                    projectName: project.name,
                }))
            );
            setMyAllForm(flattenedForms);
            setTimeout(() => {
                initializeDataTable()
            }, 1000);
        }

        return () => {
            if (table) table.destroy();
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
            const token = sessionStorage.getItem("authToken");
            await axios.delete(`${BACKEND_URL}/api/forms/${formId}/`, {
                headers: {
                    Authorization: `Token ${token}`,
                },
            });

            const updatedForms = myAllForm.filter((form) => form.id !== formId);

            //  Update allProjects (nested form list inside each project)
            const updatedProjects = allProjects.map((project) => ({
                ...project,
                forms: project.forms?.filter((form) => form.id !== formId) || [],
            }));
            setAllProjects(updatedProjects);
            setMyAllForm(updatedForms);
            Swal.fire("Deleted!", "Form has been deleted.", "success");
        } catch (error) {
            console.error("Error deleting form:", error);
            Swal.fire("Error", "Failed to delete form.", "error");
        }
    };



    const handleViewFormInfo = (project, formId) => {
        navigate(`/projects/${project}/forms/${formId}`);
    };

    const handleDeleteClick = (formId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will delete the form.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteForm(formId);
            }
        });
    }



    return (
        <div className="rounded-lg overflow-x-auto  bg-white border border-black/70 p-4">

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
                    {myAllForm.length > 0 ? (
                        myAllForm.map((form) => (
                            <tr key={form.id}>
                                <td>
                                    <button
                                        className="text-blue-500 font-medium"
                                        onClick={() => handleViewFormInfo(form.projectId, form.id)}
                                    >
                                        {form.name}
                                    </button>
                                </td>
                                <td>{form.projectName}</td>
                                <td>
                                    {new Date(form.updated_at).toLocaleDateString("en-US", {
                                        timeZone: "Asia/Dhaka",
                                        year: "numeric",
                                        month: "long",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </td>
                                <td>
                                    {new Date(form.created_at).toLocaleDateString("en-US", {
                                        timeZone: "Asia/Dhaka",
                                        year: "numeric",
                                        month: "long",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-primary btn-sm opacity-70"
                                        onClick={() => handleEditForm(form.projectId, form.id)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm ml-2 opacity-90"
                                        onClick={() => handleDeleteClick(form.id)}
                                    >
                                        <FaTrash />
                                    </button>
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

        </div>
    );
};

export default SingleOrgFormList