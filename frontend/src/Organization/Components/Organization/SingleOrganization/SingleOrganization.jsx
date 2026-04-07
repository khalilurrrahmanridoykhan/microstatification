import React from 'react'

import SingleOrgTabPanel from './SingleOrgTabPanel'
import DashboardCard from '../../Dashboard/DashboardCard'
import ProjectTable from '../../Project/ProjectTable'

function SingleOrganization() {
    return (
        <div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full px-1 md:px-4'>
                <DashboardCard color={"white"} number={12} title={"Project"} />
                <DashboardCard color={"white"} number={50} title={"Form"} />
                <DashboardCard color={"white"} number={140} title={"User"} />
                <DashboardCard color={"white"} number={276} title={"Submission"} />
            </div>

            <div className='mt-4 md:mt-8 px-1 md:px-4'>
                <ProjectTable />
            </div>



            <div className='mt-4 md:mt-8 px-1 md:px-4'>
                <SingleOrgTabPanel />
            </div>
            {/* <div className='w-full flex flex-col md:flex-row gap-2 mt-8 md:mt-8 px-1 md:px-4'>

                <div className='w-[100%] md:w-[50%]'>
                    <FormUserList/>
                </div>

                <div className='w-[100%] md:w-[50%]'>
                    <UserList/>
                </div>

            </div> */}


        </div>
    )
}

export default SingleOrganization