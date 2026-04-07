import React from "react";
import ManageTranslationsModalBase from "../../../../shared/ManageTranslationsModalBase";
import UpdateTranslationsModal from "./UpdateTranslationsModal";
import UpdateOtherTranslationsModal from "./UpdateOtherTranslationsModal";

const ManageTranslationsModal = (props) => (
  <ManageTranslationsModalBase
    {...props}
    UpdateTranslationsComponent={UpdateTranslationsModal}
    UpdateOtherTranslationsComponent={UpdateOtherTranslationsModal}
  />
);

export default ManageTranslationsModal;
