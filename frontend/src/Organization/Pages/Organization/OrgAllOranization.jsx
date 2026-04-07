import React from 'react'
import OrgTable from '../../Components/Organization/OrgTable'
import DashboardCard from '../../Components/Dashboard/DashboardCard'

function OrgAllOrganization() {
    return (
        <div className=''>

            {/* <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full px-4'>
        <DashboardCard color={"white"} number={12} title={"Count"} />
        <DashboardCard color={"white"} number={50} title={"Published"} />
        <DashboardCard color={"white"} number={140} title={"Form"} />
        <DashboardCard color={"white"} number={2} title={"Draft"} />
      </div> */}


            <div className='mt-4 md:mt-8 px-4'>
                <OrgTable />
            </div>

        </div>
    )
}

export default OrgAllOrganization