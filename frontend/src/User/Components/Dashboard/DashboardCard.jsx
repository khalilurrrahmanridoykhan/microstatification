import React from "react";
import { GoArrowUpRight } from "react-icons/go";

function DashboardCard({ title, number, Icon = null, color = "white" }) {
  return (
    <div className="flex items-center justify-center w-full group">
      <div
        className={`rounded-2xl shadow-md flex items-center p-4 w-full md:w-full  transition-all duration-300
          bg-${color} group-hover:shadow-xl group-hover:ring-2 group-hover:ring-blue-400 line-clamp-1`}
      >
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br bg-color-custom to-gray-500">
            {Icon ? (
              <Icon className="w-8 h-8 text-white" />
            ) : (
              <span className="text-2xl text-white">🌤️</span>
            )}
          </div>
        </div>

        <div className="flex-1 ml-4 text-black">
          <div className="text-[26px] font-semibold">{number}</div>
          <div className=" md:text-[16px] lg:text-[16px] xl:text-[18px] text-gray-600">{title}</div>
        </div>

        {/* Redirect icon shows on hover */}
        {title === "Forms" && (<GoArrowUpRight className="w-8 h-8 text-gray-500 transition-opacity duration-500 opacity-30 group-hover:scale-125 group-hover:opacity-100" />)}

      </div>
    </div>
  );
}

export default DashboardCard;
