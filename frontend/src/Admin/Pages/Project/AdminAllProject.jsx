import React from 'react'
import DashboardCard from '../../Components/Dashboard/DashboardCard'
import ProjectTable from '../../Components/Project/ProjectTable'


function AllProject() {
  return (
    <div>
      {/* <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full px-4'>
        <DashboardCard color={"white"} number={10} title={"Count"} />
        <DashboardCard color={"white"} number={56} title={"Published"} />
        <DashboardCard color={"white"} number={110} title={"Form"} />
        <DashboardCard color={"white"} number={4} title={"Draft"} />
      </div> */}


      <div className='mt-4 md:mt-8 px-4'>
        <ProjectTable />
      </div>
    </div>
  )
}

export default AllProject