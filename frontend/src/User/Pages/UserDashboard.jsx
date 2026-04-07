import React, { useEffect, useState } from "react";
import DashboardCard from "../Components/Dashboard/DashboardCard";
import DashboardChart from "../Components/Dashboard/DashboardChart";
import DashboardMiniCard from "../Components/Dashboard/DashboardMiniCard";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { Link } from "react-router-dom";
import { RiStickyNoteAddFill } from "react-icons/ri";
import { RiSurveyFill } from "react-icons/ri";


const Dashboard = () => {
  const [totalForms, setTotalForms] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    const token = sessionStorage.getItem("authToken");
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const username = userInfo?.username;

    const fetchUserData = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };

        const res = await axios.get(`${BACKEND_URL}/api/users/${username}/`, {
          headers,
        });

        const assignedFormIds = res.data?.profile?.forms || [];
        setTotalForms(assignedFormIds.length);

        // If you want to calculate total submissions across forms later:
        // You’d have to fetch projects -> forms -> submissions (optional)

      } catch (error) {
        console.error("Failed to fetch user data", error);
        setTotalForms(0);
      }
    };

    if (username) {
      fetchUserData();
    }
  }, []);

  return (
    <div className="w-full px-4 h-svh">
      <div className="grid w-full grid-cols-2 gap-4 md:px-4 md:grid-cols-2 lg:grid-cols-2">
        <Link to={"/forms/all"} className="no-underline text-black">
          <DashboardCard color={"white"} Icon={RiSurveyFill} number={totalForms} title={"Forms"} />
        </Link>

        <DashboardCard
          color={"white"}
          number={totalSubmissions}
          title={"Submissions"}
          Icon={RiStickyNoteAddFill}
        />
      </div>
      <div className="flex flex-col lg:flex-row gap-6 md:px-4 items-start mt-20">
        {/* Chart Section */}
        <div className="w-full lg:w-[65%]">
          <DashboardChart />
        </div>

        {/* Mini Card Section */}
        <div className="w-full lg:w-[35%]">
          <DashboardMiniCard setTotalSubmissions={setTotalSubmissions} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
