import React, { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import './AdminPanel.css'; // Import the CSS file
import DashboardSidebar from './Admin/Components/Dashboard/DashboardSidebar';
import { CiSearch, CiSettings } from 'react-icons/ci';
import { BiBell, BiNotification } from 'react-icons/bi';
import { FiUser } from "react-icons/fi";
import SearchBar from './Admin/Components/Dashboard/SearchBar';

const AdminPanel = ({ setAuthToken, user, userData }) => {
 const [userInfo, setUserInfo] = useState("")
  const userDeatils = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  setUserInfo(userDeatils);


  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true); // Set initial state to true to open the sidebar by default
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const pathParts = location.pathname.split('/'); // ["", "organization", "all"]
  const mainSegment = pathParts[1]; // "organization"

  // Capitalize the first letter
  const pageTitle = mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1);


  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setAuthToken(null);
    navigate('/login');
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  const handleEditProfile = () => {
    navigate(`/user/edit/${userDeatils?.username || ''}`);
  };

  const handleMobileApp = () => {
    navigate('/mobile-app');
  };


  const getUserInitial = () => {
    return user && user.name ? user.name.charAt(0).toUpperCase() : '';
  };

  return (
    <div className="d-flex" id="wrapper">
      <div className={`bg-light border-right mt-4 ${isOpen ? 'toggled' : ''}`} id="sidebar-wrapper">

        {/* sidebar Menu started */}
        <div className="list-group list-group-flush mt-4">
          <DashboardSidebar setAuthToken={setAuthToken} location={location} />
        </div>


      </div>



      <div id="page-content-wrapper">
        <nav className="bg-light border-bottom p-3 flex justify-between items-center gap-2 mb-10">

          <div className='flex gap-2 m-0'>
            <i
              className="fas fa-bars mr-2 mt-1"
              onClick={toggleSidebar}
              style={{ cursor: 'pointer', fontSize: '1.5rem' }}
            ></i>
            <h3 className="text-[17px] ml-2 m-0 mt-1">{pageTitle}</h3>


          </div>

          {/* SEARCH BAR */}
          <div className="hidden md:flex items-center justify-center w-full">
            <SearchBar />
          </div>


          <div>

            <div className="ml-auto d-flex align-items-center">
              <CiSettings style={{ fontSize: '2.4rem', cursor: 'pointer', marginRight: '1rem' }} className='bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]' />
              <div className="relative">
                <BiBell
                  style={{ fontSize: '2.3rem', cursor: 'pointer', marginRight: '1rem' }}
                  className="bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]"
                />
                <div className="absolute top-2 right-6 h-2 w-2 bg-red-500 rounded-full border border-white"></div>
              </div>

              <div className="dropdown"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button

                  type="button"
                  style={{ fontSize: '2.6rem', cursor: 'pointer', marginRight: '1rem' }}
                  className='bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]'
                >
                  <FiUser className='w-7 h-7 text-[var(--primary)]' />
                  {getUserInitial()}
                </button>
                <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`} style={{ left: 'auto', right: 0 }}>
                  <button className="dropdown-item" onClick={handleViewProfile}>
                    View Profile
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item"
                    onClick={handleEditProfile}
                  >
                    Edit Profile
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleMobileApp}>
                    Mobile App
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

        </nav>



        <div className="container-fluid">
          {/* <h2>Admin Panel</h2> */}
          <Outlet /> {/* This will render the nested routes */}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
