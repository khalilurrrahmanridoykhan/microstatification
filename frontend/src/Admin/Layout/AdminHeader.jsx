import React, { useState } from 'react'
import SearchBar from '../Components/Dashboard/SearchBar'
import { CiSettings } from 'react-icons/ci'
import { BiBell } from 'react-icons/bi'
import { FiUser } from 'react-icons/fi'
import { useLocation, useNavigate } from 'react-router-dom'
import '../../AdminPanel.css';

function Header({ setAuthToken, user, isOpen, setIsOpen }) {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const isMicroAdminUser = Number(userInfo?.role) === 7;


    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();

    const pathParts = location.pathname.split('/'); // ["", "organization", "all"]
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
        sessionStorage.removeItem('authToken');
        setAuthToken(null);
        navigate('/login');
    };

    const handleViewProfile = () => {
        navigate('/profile');
    };


    const handleEditProfile = () => {
        console.log("Navigating to edit profile for user:", userInfo.username);
        navigate(`/user/edit/${userInfo.username}`);
    };

    const handleMobileApp = () => {
        navigate('/mobile-app');
    };


    const getUserInitial = () => {
        return user && user.name ? user.name.charAt(0).toUpperCase() : '';
    };

    return (
        <div>
            <nav className="bg-white  border-b  p-3 flex justify-between items-center gap-2 mb-10">

                <div className='flex gap-2 m-0'>
                    <i
                        className="fas fa-bars mr-2 mt-1"
                        onClick={toggleSidebar}
                        style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                    ></i>
                    <h3 className="text-[17px] ml-2 m-0 mt-1">{pageTitle}</h3>
                </div>

                {/* SEARCH BAR */}
                {!isMicroAdminUser && (
                    <div className="hidden md:flex items-center justify-center w-full">
                        <SearchBar />
                    </div>
                )}
                <div>

                    <div className="ml-auto d-flex align-items-center">
                        {/* <CiSettings style={{ fontSize: '2.4rem', cursor: 'pointer', marginRight: '1rem' }} className='bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]' />
                        <div className="relative">
                            <BiBell
                                style={{ fontSize: '2.3rem', cursor: 'pointer', marginRight: '1rem' }}
                                className="bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]"
                            />
                            <div className="absolute top-2 right-6 h-2 w-2 bg-red-500 rounded-full border border-white"></div>
                        </div> */}

                        <div className="dropdown"
                            onMouseEnter={() => setDropdownOpen(true)}
                            onMouseLeave={() => setDropdownOpen(false)}
                        >
                            <button

                                type="button"
                                style={{ fontSize: '2.6rem', cursor: 'pointer', marginRight: '1rem' }}
                                className='bg-[#f5f7fa] border rounded-full p-1 text-[var(--primary)]'
                            >
                                <FiUser className='w-8 h-8 text-[var(--primary)]' />
                                {getUserInitial()}
                            </button>
                            <div className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`} style={{ left: 'auto', right: 0 }}>
                                <button className="dropdown-item" onClick={handleViewProfile}>
                                    View Profile
                                </button>
                                {!isMicroAdminUser && (
                                    <>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item"
                                            onClick={handleEditProfile}
                                        >
                                            Edit Profile
                                        </button>
                                    </>
                                )}
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
    )
}

export default Header
