import React, { useState } from "react";
import SearchBar from "../Components/Dashboard/SearchBar";
import { CiSettings } from "react-icons/ci";
import { BiBell } from "react-icons/bi";
import { FiUser } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import "../../AdminPanel.css";

function Header({ setAuthToken, user, isOpen, setIsOpen }) {
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const pathParts = location.pathname.split("/"); // ["", "organization", "all"]
  const mainSegment = pathParts[1]; // "organization"

  // Capitalize the first letter
  const pageTitle = mainSegment.charAt(0).toUpperCase() + mainSegment.slice(1);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // const toggleDropdown = () => {
  //     setDropdownOpen(!dropdownOpen);
  // };

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    setAuthToken(null);
    navigate("/login");
  };

  const handleViewProfile = () => {
    navigate("/profile");
  };

  const handleEditProfile = () => {
    navigate(`/user/edit/${userInfo.username}`);
  };

  const handleMobileApp = () => {
    navigate("/mobile-app");
  };

  const getUserInitial = () => {
    return user && user.name ? user.name.charAt(0).toUpperCase() : "";
  };

  return (
    <div>
      <nav className="flex items-center justify-between gap-2 p-3 mb-10 bg-white border-bottom">
        <div className="flex gap-2 m-0">
          <i
            className="mt-1 mr-2 fas fa-bars"
            onClick={toggleSidebar}
            style={{ cursor: "pointer", fontSize: "1.5rem" }}
          ></i>
          <h3 className="text-[17px] ml-2 m-0 mt-1">{pageTitle}</h3>
        </div>

        {/* SEARCH BAR */}
        <div className="items-center justify-center hidden w-full md:flex">
          <SearchBar />
        </div>
        <div>
          <div className="ml-auto d-flex align-items-center">
            {/* <CiSettings style={{ fontSize: '2.4rem', cursor: 'pointer', marginRight: '1rem' }} className='bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]' />
                        <div className="relative">
                            <BiBell
                                style={{ fontSize: '2.3rem', cursor: 'pointer', marginRight: '1rem' }}
                                className="bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]"
                            />
                            <div className="absolute w-2 h-2 bg-red-500 border border-white rounded-full top-2 right-6"></div>
                        </div> */}

            <div
              className="dropdown"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                type="button"
                style={{
                  fontSize: "2.6rem",
                  cursor: "pointer",
                  marginRight: "1rem",
                }}
                className="bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]"
              >
                <FiUser className="w-8 h-8 text-[var(--primary)]" />
                {getUserInitial()}
              </button>
              <div
                className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}
                style={{ left: "auto", right: 0 }}
              >
                <button className="dropdown-item" onClick={handleViewProfile}>
                  View Profile
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleEditProfile}>
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
    </div>
  );
}

export default Header;
