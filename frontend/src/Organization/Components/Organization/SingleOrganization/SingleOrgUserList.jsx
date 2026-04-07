import React from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'

function SingleOrgUserList() {
  return (
    <div>
             <div class="table-container">
      
                <table >
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
  )
}

export default SingleOrgUserList