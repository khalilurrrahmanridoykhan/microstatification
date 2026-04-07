import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";

function DashboardSidebar({ setAuthToken, location }) {
  console.log(location.pathname);
  const navigate = useNavigate();
  const [currentOpenMenu, setCurrentOpenMenu] = useState(null);

  const toggleMenu = (menuId) => {
    setCurrentOpenMenu((prevMenu) => (prevMenu === menuId ? null : menuId));
  };

  const isMenuOpen = (menuId) => currentOpenMenu === menuId;

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    setAuthToken(null);
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const isNestedActive = (basePath) => location.pathname.startsWith(basePath);

  return (
    <div>
      <div className="menu border-r ">
        <Link
          to="/dashboard"
          className={`menu-item border-b  ${isActive("/dashboard") ? "active" : "text-black"
            }`}
        >
          <i className="fas fa-tachometer-alt"></i> <span>Dashboard</span>
        </Link>

        {/* Project */}
        <div>
          <Link
            to="/projects/all"
            className={
              isActive("/projects/all") ? "active no-underline" : "no-underline"
            }
          >
            <div
              className={`menu-item border-b ${isNestedActive("/projects") ? "active" : ""
                }`}
              onClick={() => toggleMenu("organization-menu")}
            >
              <i className="fas fa-building"></i> <span>All Projects</span>
            </div>
          </Link>
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
            <div className="nested-menu transform transition-transform duration-500">
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

        <button className="menu-item logout w-full" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardSidebar;
