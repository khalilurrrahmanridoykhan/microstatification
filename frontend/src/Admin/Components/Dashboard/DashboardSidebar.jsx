import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";
import { FaAngleUp } from "react-icons/fa";

function DashboardSidebar({ setAuthToken, location }) {
  const navigate = useNavigate();
  const [currentOpenMenu, setCurrentOpenMenu] = useState(null);
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const isMicroAdminUser = Number(userInfo?.role) === 7;

  const toggleMenu = (menuId) => {
    setCurrentOpenMenu((prev) => (prev === menuId ? null : menuId));
  };

  const isActive = (path) => location.pathname === path;
  const isNestedActive = (base) => location.pathname.startsWith(base);

  const handleLogout = () => {
    // Remove token from session storage
    sessionStorage.removeItem("authToken");
    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.split("=");
      document.cookie =
        name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    });
    setAuthToken(null);
    navigate("/login");
  };

  if (isMicroAdminUser) {
    return (
      <div className="menu">
        <div className="menu-content">
          <Link
            to="/dashboard"
            className={`menu-item border-b ${isActive("/dashboard") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-tachometer-alt" /> <span>Dashboard</span>
          </Link>

          <Link
            to="/microstatification/download"
            className={`menu-item border-b ${isActive("/microstatification/download") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-file-excel" />{" "}
            <span>Micro Data Download</span>
          </Link>

          <Link
            to="/user/all"
            className={`menu-item border-b ${isActive("/user/all") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-users" /> <span>All Users</span>
          </Link>

          <Link
            to="/user/create"
            className={`menu-item border-b ${isActive("/user/create") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-user-plus" /> <span>Create User</span>
          </Link>

          <Link
            to="/user/assign-user"
            className={`menu-item border-b ${isActive("/user/assign-user") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-user-check" /> <span>Assign User</span>
          </Link>

          <button className="w-full menu-item logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt" /> <span>Log Out</span>
          </button>
        </div>

        <div className="sidebar-logos">
          <img
            src="/images/sidebarimage/dghs.png"
            alt="DGHS"
            className="sidebar-logo-full"
          />
          <div className="sidebar-logo-row">
            <img
              src="/images/sidebarimage/groupmapper.png"
              alt="Group Mapper"
              className="sidebar-logo-half"
            />
            <img
              src="/images/sidebarimage/moru.png"
              alt="MORU"
              className="sidebar-logo-half"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu">
      <div className="menu-content">
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
        <div>
          <div
            className={`menu-item relative border-b ${isNestedActive("/organization") ? "active" : ""
              }`}
            onClick={() => toggleMenu("organization")}
          >
            <i className="fas fa-building" /> <span>Organization</span>
            <i
              className={`fas absolute right-4 fa-chevron-down text-xs transform transition-transform duration-500 ${currentOpenMenu === "organization" ? "rotate-180" : ""
                }`}
            />
          </div>
          {currentOpenMenu === "organization" && (
            <div className="nested-menu">
              <Link
                to="/organization/all"
                className={isActive("/organization/all") ? "active" : ""}
              >
                All Organization
              </Link>
              <Link
                to="/organization/create"
                className={isActive("/organization/create") ? "active" : ""}
              >
                Create Organization
              </Link>
              <Link
                to="/organization/assign"
                className={isActive("/organization/assign") ? "active" : ""}
              >
                Assign Organization
              </Link>
            </div>
          )}
        </div>

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
              <Link
                to="/projects/assign"
                className={isActive("/projects/assign") ? "active" : ""}
              >
                Assign Projects
              </Link>
              <Link
                to="/projects/follow-up"
                className={isActive("/projects/follow-up") ? "active" : ""}
              >
                Follow Up
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
              <Link
                to="/forms/assign"
                className={isActive("/forms/assign") ? "active" : ""}
              >
                Assign Forms
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
          to="/patients/all/"
          className={`menu-item border-b ${isActive("/patients/all/") ? "active" : "text-black"
            }`}
        >
          <i className="fas fa-tachometer-alt" />{" "}
          <span className="">All Patient </span>
        </Link>

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

      <div className="sidebar-logos">
        <img
          src="/images/sidebarimage/dghs.png"
          alt="DGHS"
          className="sidebar-logo-full"
        />
        <div className="sidebar-logo-row">
          <img
            src="/images/sidebarimage/groupmapper.png"
            alt="Group Mapper"
            className="sidebar-logo-half"
          />
          <img
            src="/images/sidebarimage/moru.png"
            alt="MORU"
            className="sidebar-logo-half"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardSidebar;
