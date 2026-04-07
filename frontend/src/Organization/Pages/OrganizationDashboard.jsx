import React, { useEffect, useState } from "react";
import DashboardCard from "../Components/Dashboard/DashboardCard";
import DashboardChart from "../Components/Dashboard/DashboardChart";
import DashboardMiniCard from "../Components/Dashboard/DashboardMiniCard";
import { Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../config";

import { HiBuildingOffice2 } from "react-icons/hi2";
import { MdWork } from "react-icons/md";
import { RiSurveyFill } from "react-icons/ri";
import { IoPeople } from "react-icons/io5";

const Dashboard = () => {
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [totalProjects, setTotalProjs] = useState(0);
  const [totalForms, setTotalForms] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const token = sessionStorage.getItem("authToken");
  const headers = { Authorization: `Token ${token}` };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const summaryRes = await axios.get(
          `${BACKEND_URL}/api/dashboard/summary/`,
          { headers }
        );
        const totals = summaryRes.data?.totals || {};

        setTotalOrgs(totals.organizations || 0);
        setTotalProjs(totals.projects || 0);
        setTotalForms(totals.forms || 0);
        setTotalUsers(totals.users || 0);
      } catch (err) {
        console.error("Unexpected error:", err);
        setTotalOrgs(0);
        setTotalProjs(0);
        setTotalForms(0);
        setTotalUsers(0);
      }
    };

    loadStats();
  }, []);


  return (
    <div className="w-full px-4  overflow-x-hidden">

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
        <Link to={"/organization/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={HiBuildingOffice2} number={totalOrgs} title={"Organization"} />
        </Link>
        <Link to={"/projects/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={MdWork} number={totalProjects} title={"Project"} />
        </Link>
        <Link to={"/forms/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={RiSurveyFill} number={totalForms} title={"Form"} />
        </Link>
        <Link to={"/user/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={IoPeople} number={totalUsers} title={"Users"} />
        </Link>
      </div>

      {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full px-4 mt-2">
        <DashboardCard color={"white"} number={70} title={"Active Projects"} />
        <DashboardCard color={"white"} number={750} title={"Submission"} />
        <DashboardCard color={"white"} number={6} title={"Map"} />
        <DashboardCard color={"white"} number={18} title={"Visualization"} />
      </div> */}

      <div className=" px-4 grid grid-cols-1 md:grid-cols-2 w-full">
        <div className="w-[95%] md:w-[120%] ">
          <DashboardChart />
        </div>
        <div className="w-[100%] md:ml-[25%] mt-2 md:mt-0">
          <DashboardMiniCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
