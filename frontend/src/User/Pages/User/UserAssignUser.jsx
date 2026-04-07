import React from 'react'
import DashboardCard from '../../Components/Dashboard/DashboardCard'
import AssignUserCard from "../../Components/User/AssignUsersCard"

function AssignUser() {
  return (
    <div>
      {/* <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full px-4">
        <DashboardCard color={"white"} number={120} title={"User"} />
        <DashboardCard color={"white"} number={23} title={"Active user"} />
        <DashboardCard color={"white"} number={543} title={"Inactive user"} />
      </div> */}

      <div className='px-4 py-4'>
        <AssignUserCard />
      </div>
    </div>
  )
}

export default AssignUser