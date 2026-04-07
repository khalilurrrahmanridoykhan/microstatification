import React, { useState } from "react";
import CreateUser from "../../Components/Organization/CreateUser";

function CreateOrganization() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrganizationCreated = (newOrganization) => {
    console.log("Organization created:", newOrganization);

    // Trigger a refresh of organization lists elsewhere in the app
    setRefreshTrigger((prev) => prev + 1);

    // You can also dispatch a custom event for other components to listen to
    window.dispatchEvent(
      new CustomEvent("organizationListRefresh", {
        detail: { organization: newOrganization, timestamp: Date.now() },
      })
    );
  };

  return (
    <div>
      <CreateUser onOrganizationCreated={handleOrganizationCreated} />
    </div>
  );
}

export default CreateOrganization;
