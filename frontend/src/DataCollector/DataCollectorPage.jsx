import React from "react";
import { useNavigate } from "react-router-dom";

function DataCollectorPage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("userInfo");
        navigate("/login");
        window.location.reload();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <div className="mb-6">
                        <i className="mb-4 text-6xl text-blue-500 fas fa-clipboard-list"></i>
                        <h1 className="mb-2 text-2xl font-bold text-gray-800">
                            Welcome, Data Collector!
                        </h1>
                        <p className="text-gray-600">You are a Data Collector</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full px-4 py-3 font-bold text-white transition duration-200 bg-red-500 rounded-lg hover:bg-red-600"
                    >
                        <i className="mr-2 fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DataCollectorPage;