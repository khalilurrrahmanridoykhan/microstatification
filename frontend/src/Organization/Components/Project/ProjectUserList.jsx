import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

function ProjectUserList() {
  const [activeTab, setActiveTab] = useState("userList");

    useEffect(() => {
    //   const $ = window.jQuery;
      let table= new window.DataTable('#ProjectUserTable')

      return () => {
        if (table) {
          table.destroy();
        }
  
      };
    }, []);
  


  const switchTab = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="">
        <div className="flex justify-between items-start text-[16px] flex-col md:flex-row">
          <div className="flex gap-4 flex-col md:flex-row">
            <button
              className={` tab-button  ${activeTab === "userList" ? "active" : ""}`}
              onClick={() => switchTab("userList")}
            >
              User List
            </button>
            <button
              className={`tab-button  ${activeTab === "assignUser" ? "active" : ""}`}
              onClick={() => switchTab("assignUser")}
            >
              Assign User
            </button>
          </div>

          <button
            className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn ${activeTab === "createUser" ? "active" : ""}`}
            onClick={() => switchTab("createUser")}
          >
            Create User
          </button>
        </div>
      </div>

      {activeTab === "userList" && (
        <div className="content-section active rounded-lg overflow-x-auto">
          <table id="ProjectUserTable" className="w-full border-collapse table-auto display">
            <thead>
              <tr>
                <th>SL No.</th>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>David</td>
                <td>ABCD</td>
                <td>12345678</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                                  <button><FaEdit /></button>
                                  <button><FaTrash /></button>
                                </div>
                </td>
              </tr>
              <tr>
                <td>02</td>
                <td>John</td>
                <td>EFGH</td>
                <td>23456789</td>
                <td>Field Worker</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
              <tr>
                <td>03</td>
                <td>Emily</td>
                <td>IJKL</td>
                <td>34567890</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
              <tr>
                <td>04</td>
                <td>Michael</td>
                <td>MNOP</td>
                <td>45678901</td>
                <td>Field Worker</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
              <tr>
                <td>05</td>
                <td>Sophia</td>
                <td>QRST</td>
                <td>56789012</td>
                <td>Manager</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
              <tr>
                <td>06</td>
                <td>Chris</td>
                <td>UVWX</td>
                <td>67890123</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
              <tr>
                <td>07</td>
                <td>Anna</td>
                <td>YZAB</td>
                <td>78901234</td>
                <td>Field Worker</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                <button><FaEdit /></button>
                <button><FaTrash /></button>
              </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "assignUser" && (
        <div className="content-section active">
          <div className="form-group">
            <label htmlFor="userSelect">Users</label>
            <select id="userSelect">
              <option>Steve</option>
              <option>Thomas</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="projectList">Project List</label>
            <select id="projectList">
              <option>Wings Health</option>
              <option>NACONG</option>
              <option>NEWC</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="validDate">Valid Date</label>
            <input type="date" id="validDate" />
          </div>

          <div className="form-group">
            <label>Notification:</label>
            <div className="notification-row">
              <label className="notif-label">
                <input type="checkbox" className="notif-input" />
                <span className="slider"></span>
                <span className="notif-text">Active user for work</span>
              </label>
            </div>
            <div className="notification-row">
              <label className="notif-label">
                <input type="checkbox" className="notif-input" />
                <span className="slider"></span>
                <span className="notif-text">I receive all updates</span>
              </label>
            </div>
          </div>

          <button className="save-btn">Save</button>
        </div>
      )}

      {activeTab === "createUser" && (
        <div className="content-section active">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" placeholder="Enter name" />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" placeholder="Enter username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role">
              <option>Admin</option>
              <option>Field Worker</option>
              <option>Manager</option>
            </select>
          </div>
          <button className="save-btn">Create</button>
        </div>
      )}
    </div>
  );
}


export default ProjectUserList;