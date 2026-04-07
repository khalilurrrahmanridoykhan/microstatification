import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";
import { FaAngleUp } from "react-icons/fa";

function DashboardSidebar({ setAuthToken, location }) {
  const navigate = useNavigate();
  const [currentOpenMenu, setCurrentOpenMenu] = useState(null);

  const toggleMenu = (menuId) => {
    setCurrentOpenMenu((prev) => (prev === menuId ? null : menuId));
  };

  const isActive = (path) => location.pathname === path;
  const isNestedActive = (base) => location.pathname.startsWith(base);

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    setAuthToken(null);
    navigate("/login");
  };

  return (
    <div className="menu">
      {/* Dashboard */}
      <Link
        to="/dashboard"
        className={`menu-item border-b ${isActive("/dashboard") ? "active" : "text-black"
          }`}
      >
        <i className="fas fa-tachometer-alt" />{" "}
        <span className="">Dashboard</span>
      </Link>

      {/* Organization */}
      <Link
        to="/organization/all"
        className={`menu-item border-b ${location.pathname.startsWith("/organization")
            ? "active"
            : "text-black"
          }`}
      >
        <i className="fas fa-building" /> <span>All organization</span>
      </Link>

      {/* Projects */}
      <div>
        <div
          className={`menu-item relative border-b ${isNestedActive("/projects") ? "active" : ""
            }`}
          onClick={() => toggleMenu("projects")}
        >
          <i className="fas fa-project-diagram" /> <span>Project</span>
          <i
            className={`fas absolute right-4 fa-chevron-down text-xs transform transition-transform duration-500 ${currentOpenMenu === "projects" ? "rotate-180" : ""
              }`}
          />
        </div>
        {currentOpenMenu === "projects" && (
          <div className="nested-menu">
            <Link
              to="/projects/all"
              className={isActive("/projects/all") ? "active" : ""}
            >
              All Projects
            </Link>
            <Link
              to="/projects/create"
              className={isActive("/projects/create") ? "active" : ""}
            >
              Create Project
            </Link>
          </div>
        )}
      </div>

      {/* Forms */}
      <div>
        <div
          className={`menu-item relative border-b ${isNestedActive("/forms") ? "active" : ""
            }`}
          onClick={() => toggleMenu("forms")}
        >
          <i className="fas fa-file-alt" /> <span>Forms</span>
          <i
            className={`fas absolute right-4 fa-chevron-down text-xs transform transition-transform duration-500 ${currentOpenMenu === "forms" ? "rotate-180" : ""
              }`}
          />
        </div>
        {currentOpenMenu === "forms" && (
          <div className="transition-transform duration-500 transform nested-menu">
            <Link
              to="/forms/all"
              className={isActive("/forms/all") ? "active" : ""}
            >
              All Forms
            </Link>
            <Link
              to="/forms/create"
              className={isActive("/forms/create") ? "active" : ""}
            >
              Create Forms
            </Link>
          </div>
        )}
      </div>

      {/* Users */}
      <div>
        <div
          className={`menu-item relative border-b ${isNestedActive("/user") ? "active" : ""
            }`}
          onClick={() => toggleMenu("user")}
        >
          <i className="fas fa-users" /> <span>User</span>
          <i
            className={`fas absolute right-4 fa-chevron-down text-xs transform transition-transform duration-500 ${currentOpenMenu === "user" ? "rotate-180" : ""
              }`}
          />
        </div>
        {currentOpenMenu === "user" && (
          <div className="nested-menu">
            <Link
              to="/user/all"
              className={isActive("/user/all") ? "active" : ""}
            >
              All Users
            </Link>
            <Link
              to="/user/create"
              className={isActive("/user/create") ? "active" : ""}
            >
              Create Users
            </Link>
            <Link
              to="/user/assign-user"
              className={isActive("/user/assign-user") ? "active" : ""}
            >
              Assign User
            </Link>
          </div>
        )}
      </div>

      <Link
        to="/trash-bin"
        className={`menu-item border-b ${isActive("/trash-bin") ? "active" : "text-black"
          }`}
      >
        <i className="fas fa-trash" /> <span className="">Trash Bin</span>
      </Link>

      <a href="/malaria/" className="menu-item border-b text-black">
        <i className="fas fa-viruses" /> <span className="">Malaria Workspace</span>
      </a>

      {/* Logout */}
      <button className="w-full menu-item logout" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt" /> <span>Log Out</span>
      </button>
    </div>
  );
}

export default DashboardSidebar;
