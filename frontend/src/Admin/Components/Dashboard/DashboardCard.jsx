import React from "react";
import { GoArrowUpRight } from "react-icons/go";

function DashboardCard({ title, number, Icon = null, color = "white" }) {
  return (
    <div className="flex items-center justify-center w-full group mt-1">
      <div
        className={` rounded-2xl shadow-md flex items-center p-4 w-full transition-all duration-300
          bg-${color} group-hover:shadow-xl group-hover:ring-2 group-hover:ring-blue-400 line-clamp-1 border border-black/70`}
      >
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-color-custom bg-gradient-to-br to-gray-500">
            {Icon ? (
              <Icon className="w-6 h-6 text-white" />
            ) : (
              <span className="text-xl text-white">🌤️</span>
            )}
          </div>
        </div>

        <div className="flex-1 ml-4 text-black">
          <div className="text-[26px] font-semibold">{number}</div>
          <div className="text-[16px] text-gray-600 text-wrap"> {title}</div>
        </div>

        {/* Redirect icon shows on hover */}
        {/* <GoArrowUpRight className="w-8 h-8 text-gray-500 transition-opacity duration-500 opacity-30 group-hover:scale-125 group-hover:opacity-100" /> */}
      </div>
    </div>
  );
}

export default DashboardCard;
