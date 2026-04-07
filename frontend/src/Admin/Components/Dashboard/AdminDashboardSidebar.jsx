import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./DashboardSidebar.css"

function DashboardSidebar({ setAuthToken, location }) {
  console.log(location.pathname)
  const navigate = useNavigate();
  const [currentOpenMenu, setCurrentOpenMenu] = useState(null);

  const toggleMenu = (menuId) => {
    setCurrentOpenMenu((prevMenu) => (prevMenu === menuId ? null : menuId));
  };

  const isMenuOpen = (menuId) => currentOpenMenu === menuId;

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setAuthToken(null);
    navigate('/login');
  };

  const isOrgCardActive = () => {
    return (
      isNestedActive('/organization') ||
      isActive('/organization/all') ||
      isActive('/organization/create') ||
      isActive('/organization/user')
    );
  };


  const isActive = (path) => location.pathname === path;
  const isNestedActive = (basePath) => location.pathname.startsWith(basePath);




  return (
    <div>
      <div className="menu border-r ">
        <Link to="/dashboard" className={`menu-item border-b  ${isActive('/dashboard') ? 'active' : ''}`}>
          <i className="fas fa-tachometer-alt"></i> <span>Dashboard</span>
        </Link>


        {/* Organization */}
        <div className={` ${isOrgCardActive() ? '' : ''}`}>

       
        <div
          className={`menu-item border-b ${isNestedActive('/organization') ? 'active' : ''}`}
          onClick={() => toggleMenu('organization-menu')}
        >
          <i className="fas fa-building"></i> <span>Organization</span>
        </div>
        {isMenuOpen('organization-menu') && (
          <div className="nested-menu border-b">
            <Link to="/organization/all" className={isActive('/organization/all') ? 'active border-b' : 'border-b'}>All Organization</Link>
            <Link to="/organization/create" className={isActive('/organization/create') ? 'active border-b' : 'border-b'}>Create Organization</Link>
            <Link to="/organization/user" className={isActive('/organization/user') ? 'active ' : ''}>Organization User</Link>
          </div>
        )} </div>

        {/* Projects */}
        <div
          className={`menu-item border-b ${isNestedActive('/projects') ? 'active' : 'border-b'}`}
          onClick={() => toggleMenu('project-menu')}
        >
          <i className="fas fa-project-diagram"></i> <span>Project</span>
        </div>
        {isMenuOpen('project-menu') && (
          <div className="nested-menu border-b">
            <Link to="/projects/all" className={isActive('/projects/all') ? 'active border-b' : 'border-b'}>All Project</Link>
            <Link to="/projects/create" className={isActive('/projects/create') ? 'active border-b' : 'border-b'}>Create Project</Link>
            <Link to="/projects/user" className={isActive('/projects/user') ? 'active ' : ''}>Project User</Link>
          </div>
        )}

        {/* Forms */}
        <div
          className={`menu-item border-b ${isNestedActive('/forms') ? 'active' : 'border-b'}`}
          onClick={() => toggleMenu('forms-menu')}
        >
          <i className="fas fa-file-alt"></i> <span>Forms</span>
        </div>
        {isMenuOpen('forms-menu') && (
          <div className="nested-menu border-b">
            <Link to="/forms/all" className={isActive('/forms/all') ? 'active' : 'border-b'}>All Forms</Link>
            <Link to="/forms/create" className={isActive('/forms/create') ? 'active border-b' : 'border-b'}>Create Forms</Link>
            <Link to="/forms/user" className={isActive('/forms/user') ? 'active ' : ''}>Forms User</Link>
          </div>
        )}

        {/* Users */}
        <div
          className={`menu-item border-b ${isNestedActive('/user') ? 'active' : 'border-b'}`}
          onClick={() => toggleMenu('user-menu')}
        >
          <i className="fas fa-users"></i> <span>User</span>
        </div>
        {isMenuOpen('user-menu') && (
          <div className="nested-menu border-b">
            <Link to="/user/all" className={isActive('/user/all') ? 'active border-b' : 'border-b'}>All Users</Link>
            <Link to="/user/create" className={isActive('/user/create') ? 'active border-b' : 'border-b'}>Create Users</Link>
            <Link to="/user/assign-user" className={isActive('/user/assign-user') ? 'active ' : ''}>Assign User</Link>
          </div>
        )}

        <button className="menu-item logout w-full" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> <span>Log Out</span>
        </button>
      </div>

    </div>
  );
}

export default DashboardSidebar;
