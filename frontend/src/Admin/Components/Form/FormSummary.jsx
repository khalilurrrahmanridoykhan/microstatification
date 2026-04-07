import React from "react";
import { useParams } from "react-router-dom";
import SummaryChart from "./SummaryChart";
import SummaryChart2 from "./SummaryChart2";
import FormTeamComponent from "./FormTeamComponent";
import FormDetails from "./FormDetails";

function FormSummary({
  formMeta = null,
  summaryStats = null,
  loadingFormMeta = false,
  loadingSummaryStats = false,
}) {
  const { projectId, formId } = useParams();
  // console.log("FormSummary component rendered with peoject and form id:", projectId, formId);

  return (
    <div className="flex flex-col w-full">

      <div>
        <FormDetails
          formId={formId}
          projectId={projectId}
          formMeta={formMeta}
          summaryStats={summaryStats}
          loadingFormMeta={loadingFormMeta}
        />
      </div>

      <div className="md:w-[100%]">
        <SummaryChart
          formId={formId}
          summaryStats={summaryStats}
          loading={loadingSummaryStats}
        />
      </div>
      {/* <div>
       <SummaryChart2/>
       <FormTeamComponent/>
      </div> */}
    </div>
  );
}

export default FormSummary;
