import React, { useState } from 'react';
import Gallery from './SingleFormData/Gallery';
import Table from './SingleFormData/Table';
import Download from './SingleFormData/Download';
import Map from './SingleFormData/Map';
import SingleFormDataSidebar from './SingleFormData/SingleFormDataSidebar';
import Report from './SingleFormData/Report';

function DataPanel() {
    const [activePanel, setActivePanel] = useState('table');

    return (
        <div className="flex flex-col md:flex-row w-full h-full gap-4 px-2 py-4 ">

            {/* Sidebar */}
            <aside className="w-fit  rounded p-2">
                <SingleFormDataSidebar
                    setActivePanel={setActivePanel}
                    activePanel={activePanel}
                />
            </aside>

            {/* Main Panel */}
            <section className="w-full text-xl  rounded overflow-y-auto">
                {activePanel === 'table' && <Table />}
                {activePanel === 'gallery' && <Gallery />}
                {activePanel === 'downloads' && <Download />}
                {activePanel === 'maps' && <Map />} {/* Optional: add Google Map sizing */}
                {activePanel === 'reports' && <Report />}
            </section>
        </div>
    );
}

export default DataPanel;
