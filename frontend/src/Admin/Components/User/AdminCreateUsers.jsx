import React, { useState } from "react";
import "./CreateUser.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function CreateUsers() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="shadow-sm bg-white p-4 rounded-lg">
      <h2 className="text-sm border-b-2 border-blue-600 border-solid inline-block mb-4">
        Create User
      </h2>
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Name"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div class="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Username"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div class="form-group relative">
          <label htmlFor="password" className="block mb-1 font-medium">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="button"
            onClick={togglePassword}
            className="absolute top-[38px] right-6 text-gray-500 focus:outline-none"
          >
            {showPassword ? <FaEye className="w-5 h-5" /> : <FaEyeSlash className="w-5 h-5" />}
          </button>
        </div>
        <div class="form-group">
          <label htmlFor="role">Roll</label>
          <select id="role" className="w-full px-3 py-2 border rounded">
            <option>Admin</option>
            <option>Organizer</option>
            <option>Project Manager</option>
          </select>
        </div>

        <div className="col-span-2"> {/* Make Notification span both columns */}
          <h3 className="mt-6 mb-2 text-lg font-semibold">Notification</h3>
          <div className="flex items-center mb-2">
            <input type="checkbox" id="activeUser" class="toggle-input mr-2" />
            <label htmlFor="activeUser" class="toggle-switch mr-2"></label>
            <label htmlFor="activeUser" class="notification-label">
              Active user for work
            </label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="receiveUpdates" class="toggle-input mr-2" />
            <label htmlFor="receiveUpdates" class="toggle-switch mr-2"></label>
            <label htmlFor="receiveUpdates" class="notification-label">
              I receive all updates
            </label>
          </div>
        </div>
        <div className="col-span-2 button-container mt-6"> {/* Make Save button span both columns */}
          <button type="submit" class="save-button">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateUsers;