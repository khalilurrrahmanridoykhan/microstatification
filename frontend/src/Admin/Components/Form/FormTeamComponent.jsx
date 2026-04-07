import React from 'react'
import { BiUser } from 'react-icons/bi'

function FormTeamComponent() {
  return (
    <div>
        <div class="container">
        <div class="header">
            <h2>Team members</h2>
            <div class="add-member-icon">
                <button>
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                    <path fill-rule="evenodd" d="M12 1a1 1 0 011 1v9h9a1 1 0 110 2h-9v9a1 1 0 11-2 0v-9H2a1 1 0 110-2h9V2a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                </button>
               
            </div>
        </div>
        <ul class="flex flex-col gap-4">
        <li class="flex gap-2">
               <BiUser className='w-8 h-8 bg-yellow-400 p-1 rounded-lg'/>
                <span class="text-md">hasangmgi</span>
            </li>
            <li class="flex gap-2">
               <BiUser className='w-8 h-8 bg-red-400 p-1 rounded-lg'/>
                <span class="text-md">ridoygmgi</span>
            </li>
            
            </ul>
    </div>
    </div>
  )
}

export default FormTeamComponent