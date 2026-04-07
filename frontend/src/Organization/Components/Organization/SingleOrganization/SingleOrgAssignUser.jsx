import React from "react";

function SingleOrgAssignUser() {
    // const [showPassword, setShowPassword] = useState(false);

    // const togglePassword = () => {
    //     setShowPassword((prev) => !prev);
    // };

    return (
        <div className="shadow-sm bg-white p-4 rounded-lg">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div class="form-group">
                    <label htmlFor="users">Users</label>
                    <select id="users" className="w-full px-3 py-2 border rounded">
                        <option>Ridoy</option>
                        <option>Hasan</option>
                        <option>Ayon</option>
                        <option>Mridul</option>
                    </select>
                </div>
                <div class="form-group col-span-1">
                    <label htmlFor="projectList">Project List</label>
                    <select id="projectList" className="w-full px-3 py-2 border rounded">
                        <option>Lama village case</option>
                        <option>Dengue case in Gazipur</option>
                        <option>Malaria Project 25</option>
                    </select>
                </div>


                <div className="form-group">
                    <label htmlFor="validDate">Valid Date</label>
                    <input type="date" id="validDate" />
                </div>

                <div className='w-[100%]'>
                    <label for="filterOption">Organization Type:</label>
                    <select id="filterOption">
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


                <div className="col-span-2"> {/* Make Notification span both columns */}
                    <h3 className="mt-6 mb-2 text-lg font-semibold">Notification</h3>
                    <div className="flex items-center mb-2">
                        <input type="checkbox" id="activeUser" class="toggle-input mr-2" />
                        <label htmlFor="activeUser" class="toggle-switch mr-2"></label>
                        <label htmlFor="activeUser" class="notification-label">
                            Active user for work
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" id="receiveUpdates" class="toggle-input mr-2" />
                        <label htmlFor="receiveUpdates" class="toggle-switch mr-2"></label>
                        <label htmlFor="receiveUpdates" class="notification-label">
                            I receive all updates
                        </label>
                    </div>
                </div>
                <div className="col-span-2 button-container mt-6"> {/* Make Save button span both columns */}
                    <button type="submit" class="save-button">
                        Save
                    </button>
                </div>
            </form>

        </div>
    )
}

export default SingleOrgAssignUser
