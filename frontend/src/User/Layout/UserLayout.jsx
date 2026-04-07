import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import '../../AdminPanel.css';
import Sidebar from './UserSidebar';
import Header from './UserHeader';

const UserLayout = ({ userDetails, setAuthToken, user }) => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsOpen(false);
            } else {
                setIsOpen(true); // auto-open on larger screen
            }
        };

        // Run once on mount
        handleResize();

        //  resize listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    return (
        <div className="flex h-screen overflow-hidden">

            {/* Sidebar */}
            <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-4 '}  text-white`}>
                <Sidebar
                    setAuthToken={setAuthToken}
                    location={location}
                    isOpen={isOpen}
                    userDetails={userDetails}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 overflow-hidden">

                {/* Header */}
                <div className="h-16 shadow-md bg-white z-10">
                    <Header
                        setAuthToken={setAuthToken}
                        user={user}
                        isOpen={isOpen}
                        setIsOpen={setIsOpen}
                    />
                </div>

                {/* Routed Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default UserLayout;