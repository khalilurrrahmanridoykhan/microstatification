import React from 'react'
import DashboardCard from '../../Components/Dashboard/DashboardCard'
import OrgUserList from '../../Components/Organization/OrgUserList'
import "../../Components/Organization/OrgUserTypeInput.css"

function OrganizationUser() {
  return (
    <div>
      {/* <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full px-4'>
        <DashboardCard color={"white"} number={120} title={"User"} />
        <DashboardCard color={"white"} number={23} title={"Active user"} />
        <DashboardCard color={"white"} number={543} title={"Inactive user"} />
      </div>

      <div>
        <div class="form-group px-4 my-4">
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

      </div> */}
      <div className='mt-4 px-4'>
        <OrgUserList />
      </div>
    </div>
  )
}

export default OrganizationUser
