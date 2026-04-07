import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaDownload,
  FaTimes,
  FaSave,
  FaPlus,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { BACKEND_URL } from "../config";

export function AllPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    patient_id: "",
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.get(`${BACKEND_URL}/api/patients/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setPatients(response.data);
        setFilteredPatients(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching patients:", error);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(
        (patient) =>
          patient.patient_id
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  // Handle edit patient
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setEditFormData({
      name: patient.name || "",
      email: patient.email || "",
      phone: patient.phone || "",
      age: patient.age || "",
      gender: patient.gender || "",
      address: patient.address || "",
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleUpdatePatient = async () => {
    if (!editingPatient) return;

    // Basic validation
    if (!editFormData.name.trim()) {
      Swal.fire("Error!", "Patient name is required.", "error");
      return;
    }

    if (editFormData.email && !isValidEmail(editFormData.email)) {
      Swal.fire("Error!", "Please enter a valid email address.", "error");
      return;
    }

    if (editFormData.age && (editFormData.age < 0 || editFormData.age > 150)) {
      Swal.fire("Error!", "Please enter a valid age (0-150).", "error");
      return;
    }

    setIsUpdating(true);
    try {
      const token = sessionStorage.getItem("authToken");

      console.log("[DEBUG] Updating patient:", editingPatient.id);
      console.log("[DEBUG] Form data being sent:", editFormData);

      const response = await axios.put(
        `${BACKEND_URL}/api/patients/${editingPatient.id}/`,
        editFormData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[DEBUG] Update response:", response.data);

      // Update the patients list with the updated patient
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === editingPatient.id
            ? { ...patient, ...response.data }
            : patient
        )
      );

      setShowEditModal(false);
      setEditingPatient(null);

      Swal.fire("Success!", "Patient updated successfully.", "success");
    } catch (error) {
      console.error("Error updating patient:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error response headers:", error.response?.headers);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.data && typeof error.response.data === "object"
          ? JSON.stringify(error.response.data)
          : "Failed to update patient.");
      Swal.fire("Error!", errorMessage, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Email validation helper
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }; // Close modal
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingPatient(null);
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      address: "",
    });
  };

  // Handle create patient
  const handleCreatePatient = async () => {
    if (!createFormData.patient_id.trim()) {
      Swal.fire("Error!", "Patient ID is required.", "error");
      return;
    }

    if (!createFormData.name.trim()) {
      Swal.fire("Error!", "Patient name is required.", "error");
      return;
    }

    if (createFormData.email && !isValidEmail(createFormData.email)) {
      Swal.fire("Error!", "Please enter a valid email address.", "error");
      return;
    }

    if (
      createFormData.age &&
      (isNaN(createFormData.age) || createFormData.age < 0)
    ) {
      Swal.fire("Error!", "Please enter a valid age.", "error");
      return;
    }

    setIsCreating(true);

    try {
      const token = sessionStorage.getItem("authToken");

      console.log("[DEBUG] Creating patient with data:", createFormData);

      const response = await axios.post(
        `${BACKEND_URL}/api/patients/`,
        createFormData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[DEBUG] Patient created successfully:", response.data);

      // Add new patient to the list
      setPatients((prev) => [...prev, response.data]);
      setFilteredPatients((prev) => [...prev, response.data]);

      setShowCreateModal(false);
      setCreateFormData({
        patient_id: "",
        name: "",
        email: "",
        phone: "",
        age: "",
        gender: "",
        address: "",
      });

      Swal.fire("Success!", "Patient created successfully.", "success");
    } catch (error) {
      console.error("Error creating patient:", error);
      console.error("Error response data:", error.response?.data);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.patient_id?.[0] ||
        (error.response?.data && typeof error.response.data === "object"
          ? JSON.stringify(error.response.data)
          : "Failed to create patient.");
      Swal.fire("Error!", errorMessage, "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Close create modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      patient_id: "",
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      address: "",
    });
  };

  async function handleDelete(patientId) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This will delete patient ${patientId} permanently.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = sessionStorage.getItem("authToken");
        await axios.delete(`${BACKEND_URL}/api/patients/${patientId}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        // Remove patient from state
        setPatients((prev) => prev.filter((p) => p.id !== patientId));

        Swal.fire("Deleted!", "The patient has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting patient:", error);
        Swal.fire("Error!", "Failed to delete the patient.", "error");
      }
    }
  }

  const handleDownloadCSV = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${BACKEND_URL}/api/patients/csv/`, {
        headers: { Authorization: `Token ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `patients_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      Swal.fire("Error!", "Failed to download CSV file.", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <span className="ml-3">Loading patients...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="inline-block text-black text-[22px] border-b-2 border-blue-400 border-solid">
            All Patients ({filteredPatients.length})
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              <FaDownload />
              Download CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <FaPlus />
              Create Patient
            </button>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search patients by ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-4 overflow-x-auto bg-white border rounded-lg border-black/70">
          {filteredPatients.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mb-2 text-4xl">👥</div>
              <div className="text-lg font-medium text-gray-600">
                {patients.length === 0
                  ? "No patients found"
                  : "No patients match your search"}
              </div>
              <div className="text-sm text-gray-500">
                {patients.length === 0
                  ? "Patients will appear here when forms with patient identification are submitted"
                  : "Try adjusting your search criteria"}
              </div>
            </div>
          ) : (
            <table
              id="AllPatientTable"
              className="display table-auto w-full min-w-[600px]"
            >
              <thead>
                <tr>
                  <th className="w-[100px]">SL No.</th>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Submissions</th>
                  <th>Created Date</th>
                  <th className="w-[120px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, idx) => (
                  <tr key={patient.id} className="hover:bg-gray-100">
                    <td className="w-[100px]">{idx + 1}</td>
                    <td>
                      <Link
                        to={`/patients/single/${patient.id}`}
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {patient.patient_id}
                      </Link>
                    </td>
                    <td>{patient.name || "N/A"}</td>
                    <td>{patient.email || "N/A"}</td>
                    <td>{patient.phone || "N/A"}</td>
                    <td>{patient.age || "N/A"}</td>
                    <td>{patient.gender || "N/A"}</td>
                    <td>
                      <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                        {patient.submission_count || 0}
                      </span>
                    </td>
                    <td>
                      {patient.created_at
                        ? new Date(patient.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="action-buttons">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit Patient"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Patient"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 bg-white border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Patient
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                  disabled={isUpdating}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Patient ID (Read-only) */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Patient ID{" "}
                    <span className="text-gray-500">(Read-only)</span>
                  </label>
                  <input
                    type="text"
                    value={editingPatient?.patient_id || ""}
                    disabled
                    className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md cursor-not-allowed bg-gray-50"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Age */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={editFormData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter age"
                      min="0"
                      max="150"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={editFormData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={editFormData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 rounded-b-lg bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={isUpdating}
                  className="px-4 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePatient}
                  disabled={isUpdating}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Patient Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 bg-white border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Create New Patient
                </h3>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                  disabled={isCreating}
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Patient ID */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Patient ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="patient_id"
                    value={createFormData.patient_id}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        patient_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter patient ID"
                    required
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={createFormData.email}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={createFormData.phone}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={createFormData.age}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        age: e.target.value,
                      })
                    }
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter age"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={createFormData.gender}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={createFormData.address}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        address: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 rounded-b-lg bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseCreateModal}
                  disabled={isCreating}
                  className="px-4 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePatient}
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[120px]"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-b-2 border-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// // Simple Patients Table Component without actions or buttons
// export function PatientsList() {
//     return (
//         <div>
//             <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
//                 Patients List
//             </h2>
//             <div className="p-4 overflow-x-auto bg-white border rounded-lg border-black/70">
//                 <table className="table-auto w-full min-w-[600px]">
//                     <thead>
//                         <tr>
//                             <th className="w-[100px]">SL No.</th>
//                             <th>Patient ID</th>
//                             <th>Name</th>
//                             <th>Email</th>
//                             <th>Phone</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {dummyPatients.map((patient, idx) => (
//                             <tr key={patient.patientId} className="hover:bg-gray-100">
//                                 <td className="w-[100px]">{idx + 1}</td>
//                                 <td>{patient.patientId}</td>
//                                 <td>{patient.name}</td>
//                                 <td>{patient.email}</td>
//                                 <td>{patient.phone}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//         </div>
//     );
// }
