import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaUserShield,
  FaIdBadge,
  FaBuilding,
  FaProjectDiagram,
  FaWpforms,
} from "react-icons/fa";
import { BACKEND_URL } from "../config";

const roleLabels = {
  1: "Admin",
  2: "Organization admin",
  3: "Project admin",
  4: "User",
  5: "Data Collector",
  6: "Officer",
  7: "Microstatification Admin",
  8: "SK",
  9: "SHW",
}

const UserProfile = () => {
  const sessionUser = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
  const [user, setUser] = useState(sessionUser);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/users/${sessionUser.username}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        setUser(sessionUser);
      }
    };
    if (sessionUser.username) fetchUser();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-2  space-y-6">
      <p className="text-xl font-bold text-center text-gray-700 border-b pb-3">
        User Profile
      </p>

      {/* Basic Info */}
      <div className=" bg-white border border-black/70 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-b pb-1">
        <div>
          <p className="text-sm text-gray-500">Username</p>
          <p className="text-gray-800  break-all">{user.username || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="text-gray-800  break-all">{user.email || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="text-gray-800 ">
            {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "—"}
          </p>
        </div>
      </div>

      {/* Role & Staff */}
      <div className="bg-white border border-black/70 rounded-xl p-6  grid grid-cols-1 sm:grid-cols-2 gap-6 border-b pb-1">
        <div className="flex items-center space-x-4">
          <FaUserShield className="text-[#2094F3] w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-gray-800">{roleLabels[user.role] || "Unknown Role"}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <FaIdBadge className="text-[#2094F3] w-6 h-6" />
          <div>
            <p className="text-sm text-gray-500">Staff Status</p>
            <p className="text-gray-800 ">
              {user.is_staff ? "Staff" : "Regular User"}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Metrics */}
      <div className="">
        <h3 className=" text-lg  text-center text-gray-700 ">
          Profile Metrics
        </h3>
        <div className="bg-white border border-black/70 rounded-xl p-4 flex justify-between flex-col md:flex-row items-center text-center">
          <div className="items-center flex-1">
            <div className="flex gap-2">
              <p className="text-sm text-gray-600">Organizations</p>
              <p className="text-gray-900 ">
                {user.profile?.organizations?.length || 0}
              </p>
            </div>


          </div>
          <div className="flex flex-col items-center flex-1">

            <div className="flex gap-2">
              <p className="text-sm text-gray-600">Projects</p>
              <p className="text-gray-900 ">
                {user.profile?.projects?.length || 0}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center flex-1">

            <div className="flex gap-2">
              <p className="text-sm text-gray-600">Forms</p>
              <p className="text-gray-900 ">
                {user.profile?.forms?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
