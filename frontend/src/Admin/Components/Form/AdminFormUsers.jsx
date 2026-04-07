import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaEdit, FaTrash } from 'react-icons/fa'

function FormUsers() {
      useEffect(() => {
      //   const $ = window.jQuery;
        let table= new window.DataTable('#FormUserTable')
  
        return () => {
          if (table) {
            table.destroy();
          }
    
        };
      }, []);


  return (
    <div>
      <div class="p-4 bg-white rounded-lg shadow-md">
        <div class="header">
          <button
            className={` tab-button active `}
          >
            User List
          </button>
          <button
            className={` bg-[var(--primary2)]  px-5 py-2 rounded-lg cursor-pointer text-base transition-all duration-300 ease-in-out outline-none hover:bg-[#1814f3cb] hover:text-white hover:shadow-[0_4px_12px_rgba(53,153,219,0.3)] mt-btn`}
          >
            <Link to={"/user/create"} class="no-underline text-white">Create User</Link>
          </button>
         
        </div>
        <div class="table-container">

          <table id='FormUserTable' className='display' >
            <thead>
              <tr>
                <th>SL No.</th>
                <th>Name</th>
                <th>Username</th>
                <th>Organization</th>
                <th>Project</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01.</td>
                <td>ridoy</td>
                <td>ABCD</td>
                <td>GMGI</td>
                <td>Dhaka Malaria</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td> </tr>
              <tr>
                <td>02</td>
                <td>ridoy</td>
                <td>ABCD</td>
                <td>WHO</td>
                <td>FLODDx78</td>
                <td>moderator</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>03</td>
                <td>sabber</td>
                <td>ABCD</td>
                <td>GroupMappers</td>
                <td>Village mapping</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>04</td>
                <td>ayon</td>
                <td>ABCD</td>
                <td>WHO</td>
                <td>LAMA Climate</td>
                <td>Editor</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>05</td>
                <td>mridul</td>
                <td>ABCD</td>
                <td>global fund</td>
                <td>LAMA Climate</td>
                <td>Editor</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>06</td>
                <td>sabber</td>
                <td>ABCD</td>
                <td>GMGI</td>
                <td>Dhaka Malaria</td>
                <td>moderator</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>07</td>
                <td>asraf</td>
                <td>ABCD</td>
                <td>GMGI</td>
                <td>Dhaka Malaria</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>08</td>
                <td>David</td>
                <td>ABCD</td>
                <td>WHO</td>
                <td>LAMA Climate</td>
                <td>moderator</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td>09</td>
                <td>hasan</td>
                <td>ABCD</td>
                <td>WHO</td>
                <td>bus accident</td>
                <td>Admin</td>
                <td className="action-buttons">
                  <div className="flex gap-2">
                    <button><FaEdit /></button>
                    <button><FaTrash /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}

export default FormUsers