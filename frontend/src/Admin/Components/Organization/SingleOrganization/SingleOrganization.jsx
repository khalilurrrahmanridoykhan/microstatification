import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

import SingleOrgTabPanel from "./SingleOrgTabPanel";
import DashboardCard from "../../Dashboard/DashboardCard";
import ProjectTable from "../../Project/ProjectTable";
import { FaGlobe, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaUserCheck, FaUserTimes } from "react-icons/fa";
import { GrMapLocation } from "react-icons/gr";
import { HiOfficeBuilding } from "react-icons/hi";

function SingleOrganization() {
  const { id } = useParams();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/organizations/${id}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setOrganization(res.data);
      } catch (error) {
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganization();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!organization) return <div>Organization not found.</div>;

  return (
    <div>


      {/* <div className="grid w-full grid-cols-1 gap-4 px-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 md:px-4">
        <DashboardCard color={"white"} number={12} title={"Project"} />
        <DashboardCard color={"white"} number={50} title={"Form"} />
        <DashboardCard color={"white"} number={140} title={"User"} />
        <DashboardCard color={"white"} number={276} title={"Submission"} />
      </div> */}

      {/* Organzation details Card */}
      <div className="px-4">
        <OrganizationProfile organization={organization} />
      </div>


      <div className="px-1 mt-4 md:mt-8 md:px-4">
        <SingleOrgTabPanel organizationId={organization.id} />
      </div>
    </div>
  );
}

export default SingleOrganization;

const OrganizationProfile = ({ organization }) => {
  return (
    <div className="">
      {/* Title */}
      <p className="text-[16px] font-medium px-4 py-2  text-gray-700">
        Organization Details
      </p>

      <div className="w-full p-4 bg-white border lg:p-8 rounded-lg border-black/70">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 border-b ">
          <div className="md:border-r">
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Name
            </p>
            <p className="text-base text-gray-800">{organization.name || "—"}</p>
          </div>

          <div className="md:border-r">
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Status
            </p>
            <p
              className={`text-base font-semibold ${organization.active_user ? "text-green-600" : "text-red-600"
                }`}
            >
              {organization.active_user ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="md:border-r">
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Type
            </p>
            <p className="text-base text-gray-800">
              {organization.type || "—"}
            </p>
          </div>

          <div >
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Location
            </p>
            <div className="flex items-center gap-2">
              <GrMapLocation className="w-4 h-4 text-gray-500" />
              <p className="text-base text-gray-800 m-0">
                {organization.location || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid mt-2 grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 md:border-r">
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Website
            </p>
            <div className="flex items-center justify-start gap-2">
              <FaGlobe className="w-5 h-5 text-[#2094F3]" />
              <p className="text-base text-gray-800 m-0">
                {organization.website || "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium tracking-wide text-gray-500 text-md">
              Email
            </p>
            <div className="flex items-center gap-2">
              <FaEnvelope className="w-5 h-5 text-[#2094F3]" />
              <p className="text-base text-gray-800 m-0">
                {organization.email || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>



    </div>
  );

};
