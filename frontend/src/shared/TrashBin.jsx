import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaUndo,
  FaSearch,
  FaFilter,
  FaClock,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUser,
  FaCalendarAlt,
  FaChartBar,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { BACKEND_URL } from "../config";

export default function TrashBin() {
  const navigate = useNavigate();
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filteredItems, setFilteredItems] = useState([]);
  const [stats, setStats] = useState({});
  const [processingItems, setProcessingItems] = useState(new Set());

  // Item type colors and icons
  const typeConfig = {
    project: { color: "bg-blue-100 text-blue-800", icon: "📁" },
    form: { color: "bg-green-100 text-green-800", icon: "📋" },
    submission: { color: "bg-yellow-100 text-yellow-800", icon: "📝" },
    patient: { color: "bg-purple-100 text-purple-800", icon: "👤" },
    organization: { color: "bg-red-100 text-red-800", icon: "🏢" },
    template: { color: "bg-indigo-100 text-indigo-800", icon: "📄" },
  };

  // Fetch trash items
  useEffect(() => {
    fetchTrashItems();
    fetchStats();
  }, []);

  // Filter items based on search and type
  useEffect(() => {
    let filtered = trashItems;

    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.item_type === filterType);
    }

    setFilteredItems(filtered);
  }, [trashItems, searchTerm, filterType]);

  const fetchTrashItems = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${BACKEND_URL}/api/trash/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setTrashItems(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trash items:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await axios.get(`${BACKEND_URL}/api/trash/stats/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRestore = async (item) => {
    const result = await Swal.fire({
      title: "Restore Item?",
      text: `Are you sure you want to restore "${item.item_name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, restore it!",
    });

    if (result.isConfirmed) {
      setProcessingItems((prev) => new Set(prev).add(item.id));
      try {
        const token = sessionStorage.getItem("authToken");
        await axios.post(
          `${BACKEND_URL}/api/trash/${item.id}/restore/`,
          {},
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        Swal.fire(
          "Restored!",
          "The item has been restored successfully.",
          "success"
        );
        fetchTrashItems();
        fetchStats();
      } catch (error) {
        console.error("Error restoring item:", error);
        Swal.fire("Error!", "Failed to restore the item.", "error");
      } finally {
        setProcessingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    }
  };

  const handlePermanentDelete = async (item) => {
    const result = await Swal.fire({
      title: "Permanently Delete?",
      text: `Are you sure you want to permanently delete "${item.item_name}"? This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete permanently!",
      input: "text",
      inputPlaceholder: 'Type "DELETE" to confirm',
      inputValidator: (value) => {
        if (value !== "DELETE") {
          return "Please type DELETE to confirm";
        }
      },
    });

    if (result.isConfirmed) {
      setProcessingItems((prev) => new Set(prev).add(item.id));
      try {
        const token = sessionStorage.getItem("authToken");
        await axios.delete(`${BACKEND_URL}/api/trash/${item.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        Swal.fire(
          "Deleted!",
          "The item has been permanently deleted.",
          "success"
        );
        fetchTrashItems();
        fetchStats();
      } catch (error) {
        console.error("Error deleting item:", error);
        Swal.fire("Error!", "Failed to delete the item.", "error");
      } finally {
        setProcessingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    }
  };

  const handleCleanupExpired = async () => {
    const result = await Swal.fire({
      title: "Cleanup Expired Items?",
      text: `This will permanently delete all expired items (${stats.expired_items} items). This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, cleanup expired items!",
    });

    if (result.isConfirmed) {
      try {
        const token = sessionStorage.getItem("authToken");
        const response = await axios.post(
          `${BACKEND_URL}/api/trash/cleanup_expired/`,
          {},
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        Swal.fire("Cleaned up!", response.data.message, "success");
        fetchTrashItems();
        fetchStats();
      } catch (error) {
        console.error("Error cleaning up expired items:", error);
        Swal.fire("Error!", "Failed to cleanup expired items.", "error");
      }
    }
  };

  const formatTimeLeft = (autoDeleteAt) => {
    const now = new Date();
    const deleteDate = new Date(autoDeleteAt);
    const diffTime = deleteDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-semibold">Expired</span>;
    } else if (diffDays === 0) {
      return <span className="text-red-600 font-semibold">Expires today</span>;
    } else if (diffDays <= 7) {
      return (
        <span className="text-orange-600 font-semibold">
          {diffDays} days left
        </span>
      );
    } else {
      return <span className="text-gray-600">{diffDays} days left</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-gray-700">
            Loading trash bin...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FaTrash className="mr-3 text-red-500" />
              Trash Bin
            </h1>
            <p className="text-gray-600">
              Manage deleted items - items are automatically deleted after 30
              days
            </p>
          </div>

          {stats.expired_items > 0 && (
            <button
              onClick={handleCleanupExpired}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FaExclamationTriangle />
              Cleanup {stats.expired_items} Expired Items
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.total_items || 0}
                </p>
              </div>
              <FaChartBar className="text-2xl text-blue-500" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">
                  Expired Items
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.expired_items || 0}
                </p>
              </div>
              <FaClock className="text-2xl text-red-500" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {
                    filteredItems.filter((item) => {
                      const diffDays = Math.ceil(
                        (new Date(item.auto_delete_at) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return diffDays > 0 && diffDays <= 7;
                    }).length
                  }
                </p>
              </div>
              <FaExclamationTriangle className="text-2xl text-yellow-500" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Safe Items</p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    filteredItems.filter((item) => {
                      const diffDays = Math.ceil(
                        (new Date(item.auto_delete_at) - new Date()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return diffDays > 7;
                    }).length
                  }
                </p>
              </div>
              <FaInfoCircle className="text-2xl text-green-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deleted items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="project">Projects</option>
              <option value="form">Forms</option>
              <option value="submission">Submissions</option>
              <option value="patient">Patients</option>
              <option value="organization">Organizations</option>
              <option value="template">Templates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <FaTrash className="text-4xl text-gray-400 mx-auto mb-4" />
            <div className="text-xl font-medium text-gray-600 mb-2">
              {trashItems.length === 0
                ? "Trash bin is empty"
                : "No items match your search"}
            </div>
            <div className="text-gray-500">
              {trashItems.length === 0
                ? "Deleted items will appear here and be automatically removed after 30 days."
                : "Try adjusting your search criteria or filters."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">
                          {typeConfig[item.item_type]?.icon || "📄"}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.item_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {item.item_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          typeConfig[item.item_type]?.color ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.item_type.charAt(0).toUpperCase() +
                          item.item_type.slice(1)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaUser className="mr-2 text-gray-400" />
                        {item.deleted_by_username || "Unknown"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        {new Date(item.deleted_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatTimeLeft(item.auto_delete_at)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRestore(item)}
                          disabled={processingItems.has(item.id)}
                          className="flex items-center px-3 py-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        >
                          <FaUndo className="mr-1" />
                          Restore
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(item)}
                          disabled={processingItems.has(item.id)}
                          className="flex items-center px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <FaTrash className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
