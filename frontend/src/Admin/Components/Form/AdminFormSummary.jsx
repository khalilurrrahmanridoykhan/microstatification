import React from 'react'
import SummaryChart from './AdminSummaryChart'
import SummaryChart2 from './SummaryChart2'
import FormTeamComponent from './FormTeamComponent'

function FormSummary() {
  return (
    <div className='w-full flex flex-col md:flex-row'>
      <div className='md:w-[65%]'>
        <SummaryChart />
      </div>

      <div>
       <SummaryChart2/>
       <FormTeamComponent/>
      </div>
    </div>
  )
}

export default FormSummary