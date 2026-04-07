import React from "react";
import DashboardCard from "../../Components/Dashboard/DashboardCard";
import UserList from "../../Components/User/UserList"


function Alluser() {
  return (
    <div>
      {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full px-4">
        <DashboardCard color={"white"} number={12} title={"Total user"} />
        <DashboardCard color={"white"} number={50} title={"Total project"} />
        <DashboardCard color={"white"} number={140} title={"Organization"} />
        <DashboardCard color={"white"} number={2} title={"Draft"} />
      </div> */}

      <div className="mt-4 md:mt-8 px-4 w-full">
        <UserList />
      </div>
    </div>
  );
}

export default Alluser;
