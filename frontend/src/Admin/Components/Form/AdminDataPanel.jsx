import React, { useState} from 'react';
import Gallery from './SingleFormData/AdminGallery';
import Table from './SingleFormData/Table';
import Download from './SingleFormData/AdminDownload';
import Map from './SingleFormData/AdminMap';
import SingleFormDataSidebar from './SingleFormData/AdminSingleFormDataSidebar';
import Report from './SingleFormData/AdminReport';


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