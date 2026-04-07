import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import FormCreateUsers from "./FormCreateUser";
import FormUserUserList from "./FormUserUserList";


function FormUsers() {
  const [activeTab, setActiveTab] = useState("userList");
  
    const switchTab = (tabId) => {
    setActiveTab(tabId);
  };


  return (
    <div>
      <div class="p-4 bg-white rounded-lg shadow-md">
        <div class="header">
     <button
              className={` tab-button  ${activeTab === "userList" ? "active" : ""}`}
              onClick={() => switchTab("userList")}
            >
              User List
            </button>
          <button
            className={` bg-[var(--primary2)]  px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn`}
            onClick={() => switchTab("createUser")}
          >
            Create User
          </button>

        </div>


        {activeTab === "userList" && (
          <div>
<FormUserUserList/>
        </div>)}

        {activeTab === "createUser" && (
          <FormCreateUsers />
        )}


      </div>
    </div>
  )
}

export default FormUsers