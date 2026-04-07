import React from 'react'
import { useState } from "react";

function Gallery() {
    // const [fromDate, setFromDate] = useState("");
    // const [toDate, setToDate] = useState("");
    const [selectedQuestion, setSelectedQuestion] = useState("All questions");


    return (
        <div>
            <div className="bg-white w-full p-4 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Image Gallery</h2>

                {/* Filter Section */}
                <div className="flex flex-wrap gap-5 items-center mb-6">
                    {/* Dropdown Filter */}
                    <div className="flex items-center gap-2 w-full md:w-[403px]">
                        <label htmlFor="question-filter" className="text-gray-700">From</label>
                        <select
                            id="question-filter"
                            value={selectedQuestion}
                            onChange={(e) => setSelectedQuestion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        >
                            <option>All questions</option>
                            <option>Question 1</option>
                            <option>Question 2</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-gray-700">Between</label>

                        <div className="relative">
                        <input type="date" id="validDate" />
                        </div>

                        <label className="text-gray-700">and</label>

                        <div className="relative">
                        <input type="date" id="validDate" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Gallery