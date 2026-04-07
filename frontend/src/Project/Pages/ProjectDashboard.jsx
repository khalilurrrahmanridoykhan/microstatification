import React, { useEffect, useState } from "react";
import DashboardCard from "../Components/Dashboard/DashboardCard";
import DashboardChart from "../Components/Dashboard/DashboardChart";
import DashboardMiniCard from "../Components/Dashboard/DashboardMiniCard";
import { Link } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../config";

import { MdWork } from "react-icons/md";
import { RiSurveyFill } from "react-icons/ri";
import { IoPeople } from "react-icons/io5";
import { RiStickyNoteAddFill } from "react-icons/ri";

const Dashboard = () => {
  const [totalProjects, setTotalProjs] = useState(0);
  const [totalForms, setTotalForms] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

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

        setTotalUsers(totals.users || 0);
        setTotalProjs(totals.projects || 0);
        setTotalForms(totals.forms || 0);

        const projectsRes = await axios.get(
          `${BACKEND_URL}/api/projects/user-projects/?include_forms=true`,
          { headers }
        );
        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];
        const totalSubmissions = projects.reduce((sum, project) => {
          return sum + (project.forms || []).reduce(
            (subSum, form) => subSum + ((form.submission || []).length),
            0
          );
        }, 0);
        setTotalSubmissions(totalSubmissions);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setTotalUsers(0);
        setTotalProjs(0);
        setTotalForms(0);
        setTotalSubmissions(0);
      }
    };

    loadStats();
  }, []);



  return (
    <div className="w-full   overflow-x-hidden">

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">

        <Link to={"/projects/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={MdWork} number={totalProjects} title={"Project"} />
        </Link>
        <Link to={"/forms/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={RiSurveyFill} number={totalForms} title={"Form"} />
        </Link>
        <Link to={"/user/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={IoPeople} number={totalUsers} title={"Users"} />
        </Link>
        <Link to={"/forms/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={RiStickyNoteAddFill} number={totalSubmissions} title={"Submissions"} />
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
