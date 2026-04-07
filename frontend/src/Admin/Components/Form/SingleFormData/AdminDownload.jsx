import React from 'react'

function Download() {
  return (
    <div>
      <div class="bg-white w-full p-4 rounded-lg shadow-md">
        <h2>Downloads</h2>

        <div class="section">
          <div class="row">
            <div class="col">
              <label for="export-type">Select export type</label>
              <select id="export-type">
                <option>XLS</option>
                <option>CSV</option>
                <option>GeoJSON</option>
                <option>SPSS Labels</option>
                <option>CSV (legacy)</option>
                <option>GPS coordinates (KML)</option>
                <option>XLS (legacy)</option>
                <option>Media Attachments (ZIP)</option>
              </select>
            </div>
            <div class="col">
              <label for="header-format">Value and header format</label>
              <select id="header-format">
                <option>XML values and headers</option>
                <option>Labels</option>
              </select>
            </div>
          </div>

          {/* <div class="advanced text-muted">Advanced options ▼</div> */}

          <div className='my-4'>
            <label for="saved-settings">Apply saved export settings</label>
            <select id="saved-settings">
              <option>No export settings selected</option>
            </select>
          </div>


          <div class="export-btn-wrapper">
            <button class="export-btn">Export</button>
          </div>
        </div>

        <div class="table-section">
          <h3>Exports</h3>
          <div class="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Language</th>
                  <th>Include Groups</th>
                  <th>Multiple Versions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>XLS</td>
                  <td>February 27, 2025</td>
                  <td>_default</td>
                  <td>No</td>
                  <td>Yes</td>
                  <td>
                    <div class="action-buttons">
                      <button class="p-2 no-underline bg-blue-200 text-blue-700 rounded-lg">Download</button>
                      <button class=" bg-red-200 text-red-700 rounded-lg">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Download