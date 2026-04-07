import React from "react";
import { useParams, Link } from "react-router-dom";
import AllRowsDataTable from "../../Components/Project/AllRowsDataTable";

const ProjectAllRowsView = () => {
  const { projectId } = useParams();

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link
          to="/admin/projects/follow-up"
          className="text-blue-600 underline hover:text-blue-800"
        >
          ← Back to Follow Up
        </Link>
      </div>

      <h2 className="inline-block mb-4 text-black text-[22px] border-b-2 border-blue-400 border-solid">
        All Submissions Data - Projects {projectId}
      </h2>

      <AllRowsDataTable projectId={projectId} />
    </div>
  );
};

export default ProjectAllRowsView;
