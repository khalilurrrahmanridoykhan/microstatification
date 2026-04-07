import React from "react";
import DashboardCard from "../../Components/Dashboard/DashboardCard";
import ProjectUserList from "../../Components/Project/ProjectUserList";


function ProjectUser() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 w-full px-4">
        <DashboardCard color={"white"} number={120} title={"User"} />
        <DashboardCard color={"white"} number={23} title={"Active user"} />
        <DashboardCard color={"white"} number={543} title={"Inactive user"} />
      </div>
       
      <div className='mt-4 px-4'>
                <ProjectUserList/>
              </div>

    </div>
  );
}

export default ProjectUser;
