import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AllFormsList from "./AllForm/AllForms";

function FormUserList() {
  return (
    <div>
      <div class=" ">
        <div class="">
          <h2 className="inline-block mb-4  text-black text-[22px] border-b-2 border-blue-400 border-solid">
            All Forms
          </h2>
          {/* <button
                        className={` bg-[var(--primary2)] text-white px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn`}

                    >
                        <Link to="/forms/create" className='text-white no-underline'> Create Form</Link>
                    </button> */}
        </div>
        <AllFormsList />
      </div>
    </div>
  );
}

export default FormUserList;
