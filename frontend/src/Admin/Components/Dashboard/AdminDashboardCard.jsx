import React from 'react';

function DashboardCard({ title, number }) {

  return (
    <div className="bg-white">
      <div className=" hover:bg-[var(--primary2)] hover:text-white rounded-lg p-3 border border-gray-200 shadow-md shadow-[#1814f3]/30 transition-colors duration-300">
        <div className="">
          <p className="text-center text-opacity-60 text-ellipsis whitespace-nowrap overflow-hidden">{title}</p>
        </div><h1 className="text-center text-[16px] font-bold">{number}</h1>
      </div>
    </div>
  );
}

export default DashboardCard;
