import React from 'react'
import FormDataSidebarIcons from '../FormDataSidebarIcons'
import { BsTable } from 'react-icons/bs';
import { GoDownload } from 'react-icons/go';
import { TbReport } from 'react-icons/tb';
import { PiPictureInPictureThin } from 'react-icons/pi';
import { BiLocationPlus } from 'react-icons/bi';

function SingleFormDataSidebar({setActivePanel}) {

    const showContent = (panelId) => {
        setActivePanel(panelId);
    };


  return (
    <div>
         <div className='flex bg-white justify-center md:flex-col  gap-4 shadow-sm md:shadow-lg p-2 w-full md:w-[250px]'>
                <div className='p-1 border-b mt-0' onClick={() => showContent('table')}>
                   <FormDataSidebarIcons Icon={BsTable} title="Table" />
                </div>
                <div className=' p-1 border-b' onClick={() => showContent('reports')}>
                <FormDataSidebarIcons Icon={TbReport} title="Report" />
                </div>
                <div className=' p-1 border-b' onClick={() => showContent('gallery')}>
                <FormDataSidebarIcons Icon={PiPictureInPictureThin} title="Gellary" />
                </div>
                <div className=' p-1 border-b' onClick={() => showContent('downloads')}>
                <FormDataSidebarIcons Icon={GoDownload} title="Downloads" />
                </div>
                <div className=' p-1' onClick={() => showContent('maps')}>
                <FormDataSidebarIcons Icon={BiLocationPlus} title="Map" />
                </div>
            </div>
    </div>
  )
}

export default SingleFormDataSidebar