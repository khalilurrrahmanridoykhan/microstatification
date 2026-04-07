import React from 'react'
import "./MiniCard.css"

function DashboardMiniCard() {
  return (
    <div>
         <div class="new-data-section shadow-md">
        <h2 class="new-data-title">New Data</h2>
        <ul class="new-data-list">
            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container napm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">NAPM</div>
                        <div class="data-time">5h ago</div>
                    </div>
                </div>
                <div class="data-value">450</div>
            </li>
            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container who">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 13.17l3.59-3.59L16 11l-5 5z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">WHO</div>
                        <div class="data-time">2 days ago</div>
                    </div>
                </div>
                <div class="data-value">160</div>
            </li>
            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container bd-health">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h4v-4h-4v4zm0-8h4V6h-4v2z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">BD Health</div>
                        <div class="data-time">5 days ago</div>
                    </div>
                </div>
                <div class="data-value">1085</div>
            </li>
            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container usa-health">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 8h-3v4h-2V8H8V6h8v4z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">USA Health</div>
                        <div class="data-time">10 days ago</div>
                    </div>
                </div>
                <div class="data-value">90</div>
            </li>


            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container bd-health">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h4v-4h-4v4zm0-8h4V6h-4v2z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">BD Health</div>
                        <div class="data-time">5 days ago</div>
                    </div>
                </div>
                <div class="data-value">1085</div>
            </li>

            <li class="new-data-item">
                <div class="data-info">
                    <div class="data-icon-container bd-health">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14h4v-4h-4v4zm0-8h4V6h-4v2z"/>
                        </svg>
                    </div>
                    <div class="data-details">
                        <div class="data-name">BD Health</div>
                        <div class="data-time">5 days ago</div>
                    </div>
                </div>
                <div class="data-value">1085</div>
            </li>




        </ul>
    </div>
    </div>
  )
}

export default DashboardMiniCard