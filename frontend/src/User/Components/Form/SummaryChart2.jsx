import React from 'react'
import "./SummaryChart2.css"

function SummaryChart2() {
    const legends = [
        { label: 'GMGI', color: '#3f51b5' },
        { label: 'WHO', color: '#00bcd4' },
        { label: 'BRAC', color: '#f48fb1' },
        { label: 'Global fund', color: '#ffc107' },
      ];

  return (
    <div>
        <div class="donut-chart-container container">
        <div class="donut-chart">
            <img src="/piechart.svg" alt=""/>
        </div>
        <div class="legend-container">
        {legends.map((item, index) => (
      <div key={index} className="legend-item">
        <span className="legend-color" style={{ backgroundColor: item.color }}></span> {item.label}
      </div>
    ))}
        </div>
    </div>
    </div>
  )
}

export default SummaryChart2