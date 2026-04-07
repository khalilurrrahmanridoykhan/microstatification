import React from 'react'

function MenuItem({title, Icon}) {
  return (
    <div className='flex gap-1 items-center justify-start place-content-center'>
        <Icon className="w-4 h-4"/>
        <p className='!m-0'> {title}</p>
    </div>
  )
}

export default MenuItem