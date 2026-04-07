import React, { useEffect } from 'react'

function Table() {
        useEffect(() => {
        //   const $ = window.jQuery;
          let table= new window.DataTable('#SingleDataTable')
    
          return () => {
            if (table) {
              table.destroy();
            }
      
          };
        }, []);
  return (
    <div className='overflow-x-auto'>
        <table id='SingleDataTable' className="  border-collapse border border-gray-300 bg-white display">
                            <thead>
                                <tr>
                                    <th>SN</th>
                                    <th>Form</th>
                                    <th>Project</th>
                                    <th>Organization</th>
                                    <th>Total submission</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>Dhaka north</td>
                                    <td>Dhaka Malaria</td>
                                    <td>Global Fund</td>
                                    <td>80</td>
                                </tr>
                                <tr>
                                    <td>2</td>
                                    <td>Lama village</td>
                                    <td>Lama climate</td>
                                    <td>Global Fund</td>
                                    <td>12,785</td>
                                </tr>
                                <tr>
                                    <td>3</td>
                                    <td>Dengu</td>
                                    <td>Dengu_report_24</td>
                                    <td>Global Fund</td>
                                    <td>257</td>
                                </tr>
                                <tr>
                                    <td>4</td>
                                    <td>Covid 20</td>
                                    <td>ReportCOVID</td>
                                    <td>Global Fund</td>
                                    <td>2,341</td>
                                </tr>
                                <tr>
                                    <td>5</td>
                                    <td>Dog vaccine</td>
                                    <td>DOGVaccine21</td>
                                    <td>Global Fund</td>
                                    <td>831</td>
                                </tr>
                                <tr>
                                    <td>6</td>
                                    <td>Flood report</td>
                                    <td>BD_Flood_23</td>
                                    <td>Global Fund</td>
                                    <td>210</td>
                                </tr>
                            </tbody>
                        </table>
                        <button className='text-blue-700 underline' >See More</button>
    </div>
  )
}

export default Table