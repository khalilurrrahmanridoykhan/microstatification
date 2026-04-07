import React, { useState} from 'react';
import Gallery from './SingleFormData/Gallery';
import Table from './SingleFormData/Table';
import Download from './SingleFormData/Download';
import Map from './SingleFormData/Map';
import SingleFormDataSidebar from './SingleFormData/SingleFormDataSidebar';
import Report from './SingleFormData/Report';


function DataPanel() {
    const [activePanel, setActivePanel] = useState('table');



    return (
        <div className='flex flex-col md:flex-row gap-4 md:gap-10 px-4 w-full'>
           <SingleFormDataSidebar setActivePanel={setActivePanel}/>

            <div className='w-[75%]'>
                {activePanel === 'table' && (
                    <div >
                        <Table/>
                    </div>
                )}

                {activePanel === 'reports' && (
                    <div >
                        <Report/>
                    </div>
                )}

                {activePanel === 'gallery' && (
                    <div >
                       <Gallery/>
                    </div>
                )}

                {activePanel === 'downloads' && (
                    <div >
                        <Download/>
                    </div>
                )}

                {activePanel === 'maps' && (
                    <div >
                        <Map/>
                    </div>
                )}
            </div>
        </div>
    );
}



export default DataPanel;