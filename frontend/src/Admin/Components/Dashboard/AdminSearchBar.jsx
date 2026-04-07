import React from 'react';

const SearchBar = () => {
  return (
    <div className=" hidden md:flex items-center relative w-[80%] leading-7">
      <svg
        className="absolute left-4 w-4 h-4 fill-[#9e9ea7]"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <g>
          <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
        </g>
      </svg>
      <input
        type="search"
        placeholder="Search for something"
        className="w-full h-10 pl-10 pr-4 border-2 border-transparent rounded-full bg-[#f3f3f4] text-[#0d0c22] transition duration-300 ease-in-out placeholder:text-[#9e9ea7] focus:outline-none hover:border-[var(--primary2)] focus:border-[var(--primary2)] focus:bg-white focus:shadow-[var(--primary2)/]"
      />
    </div>
  );
};

export default SearchBar;
