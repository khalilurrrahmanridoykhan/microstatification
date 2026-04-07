import React, { useEffect } from 'react';
import "./OrgTable.css";
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { FaMosquito } from "react-icons/fa6";
import { FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";

function ProjectTable() {
      useEffect(() => {
        // const $ = window.jQuery;
        let table= new window.DataTable('#AllProjectTable')
  
        return () => {
          if (table) {
            table.destroy();
          }
    
        };
      }, []);

  return (
    <div>
      <div className="p-4 rounded-lg overflow-x-auto shadow-lg bg-white">
        <div class="header"><p className='tab-button active'>Project lists</p> </div>
        <table className='display' id='AllProjectTable'>
          <thead>
            <tr>
              <th>SL No</th>
              <th>Project name</th>
              <th>Form</th>
              <th>Update Date</th>
              <th>Create Date</th>
              <th>Status</th>
              <th>Surveyed Hosts</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01.</td>
              <td>Dengu23</td>
              <td>20</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <FaUser /> <FaUser /> <FaUser />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>02.</td>
              <td>Malaria24</td>
              <td>10</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <GiElephant /> <GiElephant /> <GiElephant />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>03.</td>
              <td>LamaClimate</td>
              <td>50</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <FaVirusCovid /> <FaVirusCovid />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>04.</td>
              <td>Zoono2025</td>
              <td>50</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <FaDog /> <FaDog /> <FaDog />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>05.</td>
              <td>CDC Field</td>
              <td>5</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <PiCowFill /> <PiCowFill /> <PiCowFill />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>06.</td>
              <td>EcoLion</td>
              <td>70</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <FaMosquito /> <FaMosquito /> <FaMosquito />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>07.</td>
              <td>JungleTrack</td>
              <td>55</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <IoBugSharp /> <IoBugSharp /> <IoBugSharp />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
            <tr>
              <td>08.</td>
              <td>BeastWatch</td>
              <td>88</td>
              <td>19-02-25</td>
              <td>19-02-25</td>
              <td>Active</td>
              <td className="species-icons text-[var(--primary2)]">{(
                <div className="flex gap-1">
                  <FaVirusCovid /> <FaVirusCovid />
                </div>
              )}</td>
              <td className="action-buttons">
                <div className="flex gap-2">
                  <button><FaEdit /></button>
                  <button><FaTrash /></button>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Total form</td>
              <td>348</td>
              <td colSpan="5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default ProjectTable;
