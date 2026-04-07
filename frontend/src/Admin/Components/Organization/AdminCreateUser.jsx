import React from 'react'
import "./CreateUser.css"

function CreateUser() {
  return (
<div class="container">
        <h2>Create</h2>
        <form>
            <div class="form-group">
                <label for="organizationName">Organization Name</label>
                <input type="text" id="organizationName" placeholder="Enter organization name"/>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="organizationType">Organization Type</label>
                    <select id="organizationType">
                        <option>Government Organizations</option>
                        <option>Autonomous & Semi-Autonomous Bodies</option>
                        <option>Non-Governmental Organizations (NGOs)</option>
                        <option>International Organizations / UN Agencies</option>
                        <option>Private Sector Organizations</option>
                        <option>Academic & Research Institutions</option>
                        <option>Local Government Institutions</option>
                        <option>Community-Based Organizations (CBOs)</option>
                        <option>Social Enterprises & Foundations</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="organizationWebsite">Organization Website</label>
                    <input type="url" id="organizationWebsite" placeholder="Enter website URL"/>
                </div>
            </div>
            <div class="form-group">
                <label for="organizationMail">Organization Mail</label>
                <input type="email" id="organizationMail" placeholder="Enter organization email"/>
            </div>
            <div class="form-group">
                <label for="location">Location</label>
                <select id="location">
                    <option>Canada</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Bangladesh</option>
                    <option>Other</option>
                </select>
            </div>

            <h3>Notification</h3>
            <div class="notification-item">
                <input type="checkbox" id="activeUser" class="toggle-input" />
                <label for="activeUser" class="toggle-switch"></label>
                <label for="activeUser" class="notification-label">Active user for work</label>
            </div>
            <div class="notification-item">
                <input type="checkbox" id="receiveUpdates" class="toggle-input"/>
                <label for="receiveUpdates" class="toggle-switch"></label>
                <label for="receiveUpdates" class="notification-label">I receive all updates</label>
            </div>

            <div class="button-container">
                <button type="submit" class="save-button">Save</button>
            </div>
        </form>
    </div>
  )
}

export default CreateUser
