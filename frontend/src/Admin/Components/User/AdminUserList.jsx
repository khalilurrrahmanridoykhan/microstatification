import React, { useEffect } from 'react'
import "./UserList.css"
import { Link, useNavigate } from 'react-router-dom'
import { FaEdit, FaTrash } from 'react-icons/fa'
import axios from "axios";
import { BACKEND_URL } from "../../../config";

function UserList() {

  const [users, setUsers] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {

    // const token = sessionStorage.getItem("authToken"); // or localStorage.getItem("authToken")
    // axios
    //   .get(`${BACKEND_URL}/api/users/`, {
    //     headers: {
    //       Authorization: `Token ${token}`,
    //     },
    //   })
    //   .then((res) => setUsers(res.data))
    //   .catch((err) => setUsers([]));


    //   const $ = window.jQuery;
    let table = new window.DataTable('#AllUserTable')

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

          <table id='AllUserTable' className='display' >
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
                <td><Link to="/user/single-user">Ridoy Khan</Link></td>
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
                <td><Link to="/user/single-user">sabber</Link></td>
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
                <td><Link to="/user/single-user">Ayon</Link></td>
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
                <td><Link to="/user/single-user">Mridul</Link></td>
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
                <td><Link to="/user/single-user">Ashraf</Link></td>
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
                <td><Link to="/user/single-user">Ridoy</Link></td>
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
                <td><Link to="/user/single-user">Sabber</Link></td>
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
                <td><Link to="/user/single-user">jack</Link></td>
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
                <td><Link to="/user/single-user">Hassan</Link></td>
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

export default UserList