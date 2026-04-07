import React from 'react'

function OrganizationSingleUser() {
  return (
    <div className="shadow-sm bg-white p-4 rounded-lg">
    <h2 className="text-sm border-b-2 border-blue-600 border-solid inline-block mb-4">
      Assign User
    </h2>
    <form className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div class="form-group">
        <label htmlFor="users">Users</label>
        <select id="users" className="w-full px-3 py-2 border rounded">
          <option selected>Ridoy</option>
          
        </select>
      </div>
      <div class="form-group">
          <label htmlFor="role">Roll</label>
          <select id="role" className="w-full px-3 py-2 border rounded">
            <option>Admin</option>
            <option>Organizer</option>
            <option>Project Manager</option>
          </select>
        </div>

      
      <div className="form-group">
          <label htmlFor="validDate">Valid Date</label>
          <input type="date" id="validDate" />
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

export default OrganizationSingleUser