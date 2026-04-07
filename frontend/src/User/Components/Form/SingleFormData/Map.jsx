/* eslint-disable no-undef */
import React, { useEffect, useRef } from 'react';

const Map = () => {
  const mapRef = useRef(null);

  useEffect(() => {

    if (!mapRef.current._leaflet_id) {
  
      const map = L.map(mapRef.current).setView([23.754231,  90.365476], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker([23.754231,  90.365476])
        .addTo(map)
        .bindPopup('Lalmatia, Mohammedpur, gmgi')
        .openPopup();
    }
  }, []);

  return (
    <div
      id="map"
      ref={mapRef}
      style={{ height: '400px', width: '100%' }}
    ></div>
  );
};

export default Map;
