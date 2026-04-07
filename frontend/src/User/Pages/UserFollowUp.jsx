import React, { useState } from "react";
import UserTemplateTable from "../Components/Project/UserTemplateTable";

const UserFollowUp = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4">
      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        Follow Up Templates
      </h2>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-700">Loading templates...</span>
            </div>
          </div>
        </div>
      )}
      <UserTemplateTable setParentLoading={setLoading} />
    </div>
  );
};

export default UserFollowUp;
