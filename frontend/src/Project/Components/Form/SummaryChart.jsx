import React from 'react'
import "./SummaryChart.css"

function SummaryChart() {
    return (
        <div>
            <div class="container">
                <div class="submission-card">
                    <h5 class="mb-3 fw-bold">Submission</h5>
                    <div class="texts  d-flex justify-content-between align-items-center mb-2">
                        <p class="mb-0 text-sm">2190 submission &amp; 321 forms Credited in this Week</p>
                        <div class="legend">
                            <div class="legend-item">
                                <span class="legend-color"></span> submitted
                            </div>
                        </div>
                    </div>
                    <div class="bar-chart">
                        <div className="bar" style={{ height: '60%' }}></div>
                        <div className="bar" style={{ height: '100%' }}></div>
                        <div className="bar" style={{ height: '40%' }}></div>
                        <div className="bar" style={{ height: '70%' }}></div>
                        <div className="bar" style={{ height: '30%' }}></div>
                        <div className="bar" style={{ height: '80%' }}></div>
                        <div className="bar" style={{ height: '90%' }}></div>

                    </div>
                    <div class="d-flex justify-content-around">
                        <div class="day">Sat</div>
                        <div class="day">Sun</div>
                        <div class="day">Mon</div>
                        <div class="day">Tue</div>
                        <div class="day">Wed</div>
                        <div class="day">Thu</div>
                        <div class="day">Fri</div>
                    </div>
                    <div class="submission d-flex justify-content-around mt-4">
                        <div class="submission-info">
                            <div class="icon-container">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-file-earmark-text icon" viewBox="0 0 16 16">
                                    <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                </svg>
                            </div>
                            <div class="text-container">
                                <div class="date-range">6 mar, 2025 - Today</div>
                                <div class="count">356</div>
                            </div>
                        </div>
                        <div class="submission-info">
                            <div class="icon-container">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-file-earmark-text icon" viewBox="0 0 16 16">
                                    <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                                </svg>
                            </div>
                            <div class="text-container">
                                <div class="label">total submission</div>
                                <div class="count">3897</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SummaryChart