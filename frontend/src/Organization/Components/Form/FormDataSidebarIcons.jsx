import React from 'react'

function FormDataSidebarIcons({Icon, title}) {
  return (
    <div>
        <div className='flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md'>
            <Icon className=" text-gray-500" size={24} />
            <span className='text-gray-500 hidden md:block'>{title}</span>
        </div>
    </div>
  )
}

export default FormDataSidebarIcons 