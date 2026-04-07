import React from 'react'
import FormDataSidebarIcons from '../FormDataSidebarIcons'
import { BsTable } from 'react-icons/bs';
import { GoDownload } from 'react-icons/go';
import { TbReport } from 'react-icons/tb';
import { PiPictureInPictureThin } from 'react-icons/pi';
import { BiLocationPlus } from 'react-icons/bi';

function SingleFormDataSidebar({ setActivePanel, activePanel }) {

  const showContent = (panelId) => {
    setActivePanel(panelId);
  };

  // console.log("Active Panel:", activePanel);


  return (
    <div>
      <div className='flex sm:flex-row md:flex-col bg-white border border-black/70 rounded-lg p-2 w-full  justify-start items-start text-[15px]'>
        <div className={`relative p-1 pl-2 mt-0 w-full cursor-pointer ${activePanel === "table" ? 'bg-blue-50' : ""}`} onClick={() => showContent('table')}>
          {activePanel === "table" && <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-blue-500"></div>}
          <FormDataSidebarIcons Icon={BsTable} title="Table" />
        </div>

        <div className={`relative p-1 pl-2 mt-0 w-full cursor-pointer ${activePanel === "gallery" ? 'bg-blue-50' : ""}`} onClick={() => showContent('gallery')}>
          {activePanel === "gallery" && <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-blue-500"></div>}
          <FormDataSidebarIcons Icon={PiPictureInPictureThin} title="Gallery" />
        </div>

        <div className={`relative p-1 pl-2 mt-0 w-full cursor-pointer ${activePanel === "downloads" ? 'bg-blue-50' : ""}`} onClick={() => showContent('downloads')}>
          {activePanel === "downloads" && <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-blue-500"></div>}
          <FormDataSidebarIcons Icon={GoDownload} title="Downloads" />
        </div>

        <div className={`relative p-1 pl-2 mt-0 w-full cursor-pointer ${activePanel === "maps" ? 'bg-blue-50' : ""}`} onClick={() => showContent('maps')}>
          {activePanel === "maps" && <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-blue-500"></div>}
          <FormDataSidebarIcons Icon={BiLocationPlus} title="Map" />
        </div>
      </div>
    </div>
  )
}

export default SingleFormDataSidebar
