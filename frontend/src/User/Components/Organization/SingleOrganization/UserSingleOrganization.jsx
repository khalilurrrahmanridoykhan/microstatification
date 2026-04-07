import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { BACKEND_URL } from "../../../../config";

import SingleOrgTabPanel from "./SingleOrgTabPanel";
import DashboardCard from "../../Dashboard/DashboardCard";


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


      <div className="grid w-full grid-cols-1 gap-4 px-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 md:px-4">
        <DashboardCard color={"white"} number={12} title={"Project"} />
        <DashboardCard color={"white"} number={50} title={"Form"} />
        <DashboardCard color={"white"} number={140} title={"User"} />
        <DashboardCard color={"white"} number={276} title={"Submission"} />
      </div>

      {/* Organzation details Card */}
      <div className="bg-white py-2 shadow-md rounded-2xl mb-1 w-[100%]  mt-4 md:mt-8 px-4 ">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <h2 className="text-2xl font-semibold text-gray-800 m-0">{organization.name}</h2>
          <span
            className={`font-semibold ${organization.active_user ? 'text-green-600' : 'text-red-600'
              }`}
          >
            {organization.active_user ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1 text-gray-700">
          <p>
            <span className="font-medium">Type:</span> {organization.type}
          </p>
          <p>
            <span className="font-medium">Location:</span> {organization.location}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <p>
            <span className="font-medium">Website:</span> {organization.website}
          </p>
          <p>
            <span className="font-medium">Email:</span> {organization.email}
          </p>
        </div>
      </div>


      <div className="px-1 mt-4 md:mt-8 md:px-4">
        <SingleOrgTabPanel organizationId={organization.id} />
      </div>
    </div>
  );
}

export default SingleOrganization;
