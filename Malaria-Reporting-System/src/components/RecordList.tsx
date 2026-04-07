import React, { useState, useEffect } from "react";

// Placeholder for future backend API call
const fetchRecords = async () => {
  return [
    { id: 1, skName: "SK Rahim Uddin", submissionDate: "2026-02-24", status: "Completed", village: "Village 1" },
    { id: 2, skName: "SK Hasan Ali", submissionDate: "2026-02-23", status: "Pending", village: "Village 2" },
    { id: 3, skName: "SK Mizanur Rahman", submissionDate: "2026-02-22", status: "Completed", village: "Village 3" },
    { id: 4, skName: "SK Rani Begum", submissionDate: "2026-02-21", status: "In Progress", village: "Village 4" },
  ];
};

const RecordList = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getRecords = async () => {
      try {
        const fetchedRecords = await fetchRecords();
        setRecords(fetchedRecords);
      } catch (err) {
        setError("Failed to load records.");
      } finally {
        setLoading(false);
      }
    };
    getRecords();
  }, []);

  const handleDelete = (id: number) => {
    const updatedRecords = records.filter((record) => record.id !== id);
    setRecords(updatedRecords);
  };

  const handleEdit = (id: number) => {
    alert(`Editing record with ID: ${id}`);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading records...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left font-medium text-gray-500">SK Name</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">Submission Date</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">Village</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b last:border-0 hover:bg-gray-50 transition"
            >
              <td className="px-6 py-4 text-gray-800">{record.skName}</td>
              <td className="px-6 py-4 text-gray-600">{record.submissionDate}</td>
              <td className="px-6 py-4 text-gray-600">{record.village}</td>
              <td className="px-6 py-4 text-gray-600">{record.status}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleEdit(record.id)}
                  className="text-gray-700 hover:text-black mr-4 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordList;
