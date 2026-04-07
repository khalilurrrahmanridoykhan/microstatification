import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaAngleDown } from "react-icons/fa";

function DashboardSidebar({ userDetails, setAuthToken, location }) {
  const hasOrgPower = userDetails?.profile?.organizations?.length > 0;
  const hasProjectPower = userDetails?.profile?.projects?.length > 0;
  const hasFormPower = userDetails?.profile?.forms?.length > 0;
  const hasTemplates = userDetails?.profile?.templates?.length > 0;
  const isRole4 = userDetails?.role === 4;
  const isStaff = userDetails?.is_staff || false;

  console.log("userDetails", userDetails);

  // console.log(location.pathname)
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
      <div className="menu ">
        {/* Dashboard - Only show for staff users */}
        {isStaff && (
          <Link
            to="/dashboard"
            className={`menu-item border-b ${isActive("/dashboard") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-tachometer-alt"></i> <span>Dashboard</span>
          </Link>
        )}

        {/* Org */}
        {/* {hasOrgPower && (
          <>
            <Link
              to="/organization/all"
              className={`menu-item border-b ${isActive('/organization/all') ? 'active' : ''}`}
            >
              <i className="fas fa-building"></i> <span>All Organization</span>
            </Link>

          </>
        )} */}

        {/* Project */}
        {/* {(hasOrgPower || hasProjectPower) && (
          <>
            <div
              className={`menu-item border-b ${isNestedActive('/projects') ? 'active' : ''}`}
              onClick={() => toggleMenu('project-menu')}
            >
              <i className="fas fa-project-diagram"></i> <span>Project</span>
            </div>
            {isMenuOpen('project-menu') && (
              <div className="border-b nested-menu">
                <Link to="/projects/all" className={isActive('/projects/all') ? 'active border-b' : 'border-b'}>All Project</Link>

                {hasOrgPower && (
                  <Link to="/projects/create" className={isActive('/projects/create') ? 'active border-b' : 'border-b'}>Create Project</Link>
                )}

                <Link to="/projects/user" className={isActive('/projects/user') ? 'active' : ''}>Project User</Link>
              </div>
            )}
          </>
        )} */}

        {/* Forms */}
        {/* {(hasOrgPower || hasProjectPower || hasFormPower) && (
          <>
            <div
              className={`menu-item relative border-b ${
                isNestedActive("/forms") ? "active" : ""
              }`}
              onClick={() => toggleMenu("forms-menu")}
            >
              <div>
                <i className="fas fa-file-alt" /> <span>Forms</span>
              </div>

              <FaAngleDown
                className={`text-xs absolute w-4 h-4 right-4  transform transition-transform duration-500 ${
                  currentOpenMenu === "forms-menu" ? "rotate-180" : ""
                }`}
              />
            </div>
            {isMenuOpen("forms-menu") && (
              <div className="border-b nested-menu">
                <Link
                  to="/forms/all"
                  className={
                    isActive("/forms/all") ? "active border-b" : "border-b"
                  }
                >
                  All Forms
                </Link>

              </div>
            )}
          </>
        )} */}

        {/* Optional: show user menu only for org-level access */}
        {/* {hasOrgPower && (
          <>
            <div
              className={`menu-item border-b ${isNestedActive('/user') ? 'active' : ''}`}
              onClick={() => toggleMenu('user-menu')}
            >
              <i className="fas fa-users"></i> <span>User</span>
            </div>
            {isMenuOpen('user-menu') && (
              <div className="border-b nested-menu">
                <Link to="/user/all" className={isActive('/user/all') ? 'active border-b' : 'border-b'}>All Users</Link>
                <Link to="/user/create" className={isActive('/user/create') ? 'active border-b' : 'border-b'}>Create Users</Link>
                <Link to="/user/assign-user" className={isActive('/user/assign-user') ? 'active' : ''}>Assign User</Link>
              </div>
            )}
          </>
        )} */}

        {/* Follow-up - Show only for role 4 users with templates */}
        {isRole4 && hasTemplates && (
          <Link
            to="/followup"
            className={`menu-item border-b ${isActive("/followup") ? "active" : "text-black"
              }`}
          >
            <i className="fas fa-tasks"></i> <span>Follow Up</span>
          </Link>
        )}

        <a href="/malaria/" className="menu-item border-b text-black">
          <i className="fas fa-viruses" /> <span className="">Malaria Workspace</span>
        </a>

        {/* <Link
          to="/trash-bin"
          className={`menu-item border-b ${
            isActive("/trash-bin") ? "active" : "text-black"
          }`}
        >
          <i className="fas fa-trash" /> <span className="">Trash Bin</span>
        </Link> */}

        {/* Logout */}
        <button className="w-full menu-item logout" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardSidebar;
