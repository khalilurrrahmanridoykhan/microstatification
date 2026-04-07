import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';

// Fix Leaflet marker icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to show a label on the map at the center of a polygon
function PolygonLabel({ position, count }) {
    const map = useMap();
    useEffect(() => {
        if (!position) return;
        const icon = L.divIcon({
            className: 'polygon-label',
            html: `<div style="background:green;color:white;padding:2px 8px;border-radius:12px;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2);">${count}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
        const marker = L.marker(position, { icon, interactive: false }).addTo(map);
        return () => map.removeLayer(marker);
    }, [map, position, count]);
    return null;
}

// Helper component to move/zoom map to a given center and zoom
function FlyToLocation({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center && zoom) {
            map.setView(center, zoom, { animate: true });
        }
    }, [center, zoom, map]);
    return null;
}

const MapComponent = ({ data = [] }) => {
    const [geoJsonData, setGeoJsonData] = useState(null);

    useEffect(() => {
        fetch('/src/data/country.json')
            .then(res => res.json())
            .then(json => setGeoJsonData(json))
            .catch(err => console.error("Failed to load GeoJSON:", err));
    }, []);

    const getGeoCenter = (feature) => {
        const coords = feature.geometry.coordinates;
        let lat = 0, lng = 0, count = 0;

        if (feature.geometry.type === "Polygon") {
            coords[0].forEach(([lngCoord, latCoord]) => {
                lat += latCoord;
                lng += lngCoord;
                count++;
            });
        } else if (feature.geometry.type === "MultiPolygon") {
            coords[0][0].forEach(([lngCoord, latCoord]) => {
                lat += latCoord;
                lng += lngCoord;
                count++;
            });
        }

        return count > 0 ? [lat / count, lng / count] : [0, 0];
    };

    // Calculate counts per location
    const locationCounts = {};
    data.forEach(d => {
        if (d.location) {
            const key = d.location.toLowerCase();
            locationCounts[key] = (locationCounts[key] || 0) + 1;
        }
    });

    // Find location with most entries
    let maxLocation = null;
    let maxCount = 0;
    Object.entries(locationCounts).forEach(([loc, count]) => {
        if (count > maxCount) {
            maxCount = count;
            maxLocation = loc;
        }
    });

    // Find feature and center for max location
    let maxFeature = null, maxCenter = [20, 0];
    if (maxLocation && geoJsonData) {
        maxFeature = geoJsonData.features.find(
            feature => feature.properties.name.toLowerCase() === maxLocation
        );
        if (maxFeature) {
            maxCenter = getGeoCenter(maxFeature);
        }
    }

    return (
        <div className="p-[4px] bg-white w-[75%] h-[250px] rounded-xl  overflow-hidden">
            <MapContainer
                center={maxCenter}

                scrollWheelZoom={true}
                className="w-full h-full"
            >
                {/* This will force the map to fly to the most entries location */}
                {maxCount > 0 && <FlyToLocation center={maxCenter} zoom={4} />}

                <TileLayer
                    attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}.png"
                />

                {geoJsonData && Object.keys(locationCounts).map(loc => {
                    const feature = geoJsonData.features.find(
                        f => f.properties.name.toLowerCase() === loc
                    );
                    if (!feature) return null;
                    const center = getGeoCenter(feature);
                    const count = locationCounts[loc];

                    return (
                        <React.Fragment key={loc}>
                            <GeoJSON
                                data={feature}
                                style={{ color: 'green', weight: 1, fillOpacity: 0.3 }}
                                onEachFeature={(feature, layer) => {
                                    layer.on('click', () => {
                                        const itemsAtLocation = data.filter(
                                            d => d.location && d.location.toLowerCase() === feature.properties.name.toLowerCase()
                                        );
                                        const popupContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width:220px; max-width:320px;">
                <div style="font-size:1.1rem; font-weight:600; color:#1814f3; margin-bottom:4px;">
                    <span style="vertical-align:middle;">${feature.properties.name}</span>
                </div>
                <div style="margin-bottom:8px;">
                    <span style="display:inline-block; background:#22c55e; color:#fff; font-size:0.95rem; font-weight:500; border-radius:12px; padding:2px 10px;">
                        ${itemsAtLocation.length} entr${itemsAtLocation.length === 1 ? 'y' : 'ies'}
                    </span>
                    <span style="color:#888; font-size:0.92rem; margin-left:6px;">
                        from this location
                    </span>
                </div>
                <ul style="list-style:none; padding:0; margin:0; max-height:110px; overflow-y:auto;">
                    ${itemsAtLocation.map(i => `
                        <li style="padding:6px 0; border-bottom:1px solid #f0f0f0;">
                            <span style="font-weight:500; color:#222;">${i.name}</span>
                            <span style="color:#666; font-size:0.92rem; margin-left:6px;">(${i.type})</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
                                        layer.bindPopup(popupContent).openPopup();
                                    });
                                }}
                            />
                            <PolygonLabel position={center} count={count} />
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default MapComponent;