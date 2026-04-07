import React from 'react';
import { BiPencil, BiShuffle, BiDotsVerticalRounded, BiGlobe } from 'react-icons/bi';
import { BsEyeFill } from 'react-icons/bs';

const SingleFormPanel = () => {
    return (
        <div className="w-full px-4 mx-auto mt-6 p-6 bg-white rounded-lg shadow">
            {/* Header with Icons */}
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-xl font-medium text-gray-800">Current version</h1>
                <div className="flex gap-3 text-gray-700 mt-1">
                    <button><BiPencil className="w-6 h-6" /> </button>
                    <button><BsEyeFill className="w-6 h-6" /> </button>
                    <button> <BiShuffle className="w-6 h-6" /> </button>
                    <button><BiDotsVerticalRounded className="w-6 h-6" /> </button>
                </div>
            </div>

            {/* Form Info Section */}
            <div className="bg-white p-4 rounded-md border border-gray-200 mb-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                    <div className="flex items-center gap-3">
                        <span className="text-blue-500 font-medium text-base">v1</span>
                        <span className="text-sm text-gray-500">Last Modified: February 17, 2025 - 5 questions</span>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
                        REDEPLOY
                    </button>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span><span className='font-semibold'>Languages</span>: This project has no languages defined yet</span>
                    <button> <BiGlobe className="w-6 h-6" /> </button>
                   
                </div>
            </div>

            {/* Collect Data Section */}
            <div className="bg-white p-4 rounded-md border border-gray-200">
                <h3 className="text-xl font-medium text-gray-700 mb-3">Collect data</h3>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                    <div className="relative w-full md:w-auto flex-1">
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm appearance-none pr-8 bg-white">
                            <option>Online-Offline (multiple submission)</option>
                            <option>Online Only (multiple submission) </option>
                            <option>Online Only (signle submission) </option>
                            <option>Online Only (once per respondent) </option>
                            <option>Embeddable web form code </option>
                            <option>View only </option>
                            <option>Android application </option>
                        </select>
                        <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50">
                            Copy
                        </button>
                        <button className="border border-blue-500 text-blue-500 px-4 py-2 rounded-md text-sm hover:bg-blue-50">
                            Open
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                    This allows online and offline submissions and is the best option for collecting data in the field.
                </p>

                {/* Toggle switch */}
                <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full peer transition-all duration-300 ease-in-out"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                    </label>
                    <span className="text-sm text-gray-600">
                        Allow submissions to this form without a username and password?
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SingleFormPanel;
