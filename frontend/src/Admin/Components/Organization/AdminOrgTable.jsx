import React, { useEffect } from 'react';
import { FaEdit, FaTrash, FaUser } from 'react-icons/fa';
import { FaMosquito } from "react-icons/fa6";
import { FaVirusCovid } from "react-icons/fa6";
import { FaDog } from "react-icons/fa";
import { PiCowFill } from "react-icons/pi";
import { GiElephant } from "react-icons/gi";
import { IoBugSharp } from "react-icons/io5";
import { Link } from 'react-router-dom';

function OrgTable() {
  useEffect(() => {
    const $ = window.jQuery;
    let table; // Declare table variable outside the DataTable initialization

    // Initialize DataTable
    const initializeDataTable = () => {
      table = new window.DataTable('#orgTable', {
        footerCallback: function (row, data, start, end, display) {
          let api = this.api();

          // Helper to parse int
          const intVal = i =>
            typeof i === 'string'
              ? i.replace(/[^\d.-]/g, '') * 1
              : typeof i === 'number'
                ? i
                : 0;

          // Calculate totals for Project (column 2) and Form (column 3)
          const projectTotal = api
            .column(2, { page: 'current' })
            .data()
            .reduce((a, b) => intVal(a) + intVal(b), 0);

          const formTotal = api
            .column(3, { page: 'current' })
            .data()
            .reduce((a, b) => intVal(a) + intVal(b), 0);

          // Update footer cells
          $(api.column(2).footer()).html(projectTotal);
          $(api.column(3).footer()).html(formTotal);
        },
      });
    };

    // Initialize DataTable on component mount
    initializeDataTable();


    const filterSelect = document.getElementById('filterOption');
    if (filterSelect) {
      filterSelect.addEventListener('change', function () {
        const filterValue = $(this).val();
        // Assuming the 'Organization Type' is in the first column (index 0)
        table.column(1).search(filterValue).draw();
      });
    }

    return () => {
      if (table) {
        table.destroy();
      }

    };
  }, []);



  return (
    <>


      <div className="p-4 bg-white rounded-lg shadow-lg overflow-x-auto ">
        <div className='w-[50%]'>
          <label for="filterOption">Organization Type:</label>
          <select id="filterOption">
            <option value="">All Organization</option>
            <option value="Government Organizations">Government Organizations</option>
            <option value="Autonomous & Semi-Autonomous Bodies">Autonomous & Semi-Autonomous Bodies</option>
            <option value="Non-Governmental Organizations (NGOs)">Non-Governmental Organizations (NGOs)</option>
            <option value="International Organizations / UN Agencies">International Organizations / UN Agencies</option>
            <option value="Private Sector Organizations">Private Sector Organizations</option>
            <option value="Academic & Research Institutions">Academic & Research Institutions</option>
            <option value="Local Government Institutions">Local Government Institutions</option>
            <option value="Community-Based Organizations (CBOs)">Community-Based Organizations (CBOs)</option>
            <option value="Social Enterprises & Foundations">Social Enterprises & Foundations</option>
          </select>
        </div>

        <table id="orgTable" className='w-full border-collapse table-auto display'>
          <thead>
            <tr>
              <th>SL No</th>
              <th>Organization name</th>
              <th>Project</th>
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
              <td>
                <Link to="/organization/single-org" className='no-underline'>WHO</Link>
              </td>
              <td>20</td>
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
              <td><Link to="/organization/single-org" className='no-underline'>HPW</Link></td>
              <td>10</td>
              <td>20</td>
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
              <td><Link to="/organization/single-org" className='no-underline'>AHRQ</Link></td>
              <td>50</td>
              <td>20</td>
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
              <td><Link to="/organization/single-org" className='no-underline'>CDC</Link></td>
              <td>50</td>
              <td>20</td>
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
              <td><Link to="/organization/single-org" className='no-underline'>CDC</Link></td>
              <td>5</td>
              <td>5</td>
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
              <td>06.</td>
              <td><Link to="/organization/single-org" className='no-underline'>HRSA</Link></td>
              <td>70</td>
              <td>14</td>
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
              <td>07.</td>
              <td><Link to="/organization/single-org" className='no-underline'>ACOG</Link></td>
              <td>55</td>
              <td>9</td>
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
              <td>08.</td>
              <td><Link to="/organization/single-org" className='no-underline'>APHA</Link></td>
              <td>88</td>
              <td>3</td>
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
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="2" className=" text-red-600">Totals:</th>
              <th className='text-red-600'></th> {/* Project total */}
              <th className='text-red-600'></th> {/* Form total */}
              <th colSpan="5"></th>
            </tr>
          </tfoot>
        </table>
      </div> </>
  );
}

export default OrgTable;
