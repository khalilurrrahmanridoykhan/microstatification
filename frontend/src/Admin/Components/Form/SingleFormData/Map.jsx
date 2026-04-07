/* eslint-disable no-undef */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { useParams } from 'react-router-dom';
import { BACKEND_URL } from '../../../../config';
import { BsFillCircleFill } from "react-icons/bs";
import 'leaflet.heat';

const Map = () => {
  const mapRef = useRef(null);                 // DOM ref
  const mapInstanceRef = useRef(null);         // Leaflet map instance
  const backgroundMapRef = useRef(null);       // Fallback background map
  const markersRef = useRef(null);             // MarkerClusterGroup instance

  const [hasGeoPoint, setHasGeoPoint] = useState(false);
  const [geoQuestions, setGeoQuestions] = useState([]);
  const [geoPoints, setGeoPoints] = useState([]);
  const [forms, setForms] = useState({ questions: [], submission: [] });
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const { formId } = useParams();

  // Fetch form and initialize filters
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        const res = await axios.get(`${BACKEND_URL}/api/forms/${formId}/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const form = res.data;
        const geoQs = form.questions.filter(q => q.type === 'geopoint');
        setGeoQuestions(geoQs);

        if (geoQs.length === 0) {
          setHasGeoPoint(false);
          return;
        }

        setHasGeoPoint(true);
        setForms(form);
        setSubmissions(form.submission);

        const initialFilters = {};
        form.questions.forEach(q => {
          initialFilters[q.name] = '';
        });
        setFilters(initialFilters);
      } catch (error) {
        console.error("Failed to fetch form metadata:", error);
      }
    };

    fetchMeta();
  }, [formId]);

  // Recalculate geoPoints based on filters
  useEffect(() => {
    if (!geoQuestions.length) return;

    const geoKey = geoQuestions[0].name;

    const filtered = submissions.filter(sub =>
      Object.entries(filters).every(([key, val]) => !val || sub.data[key] === val)
    );

    const points = filtered
      .map(sub => {
        const raw = sub.data[geoKey];
        if (!raw) return null;
        const [lat, lng] = raw.split(' ').map(parseFloat);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng, data: sub.data };
      })
      .filter(Boolean);

    setGeoPoints(points);
  }, [filters, submissions, geoQuestions]);

  // Initialize the Leaflet map once
  useEffect(() => {
    if (!hasGeoPoint || mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current).setView([23.754231, 90.365476], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = L.markerClusterGroup();
    markersRef.current = markers;
    map.addLayer(markers);

    mapInstanceRef.current = map;
  }, [hasGeoPoint]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasGeoPoint) return;

    const refreshSize = () => {
      map.invalidateSize();
    };

    const timeoutId = setTimeout(refreshSize, 200);
    window.addEventListener('resize', refreshSize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', refreshSize);
    };
  }, [hasGeoPoint]);

  // Update markers whenever filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    if (!map || !markers || !geoQuestions.length) return;

    markers.clearLayers();

    const geoKey = geoQuestions[0].name;

    const filtered = submissions.filter(sub =>
      Object.entries(filters).every(([key, val]) => !val || sub.data[key] === val)
    );

    const iconHtml = renderToStaticMarkup(
      <div><BsFillCircleFill className='w-10 h-10 text-[#2094f38c]' /></div>
    );

    const customIcon = L.divIcon({
      html: iconHtml,
      className: 'custom-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    filtered.forEach((submission, i) => {
      const answers = submission.data;
      const raw = answers[geoKey];
      if (!raw) return;

      const [lat, lng] = raw.split(' ').map(parseFloat);
      if (isNaN(lat) || isNaN(lng)) return;

      const detailsHtml = forms.questions.map(q => {
        const label = q.label || q.name;
        const answer = answers[q.name] ?? "<i>Not answered</i>";
        return `<strong>${label}</strong>: ${answer}`;
      }).join("<br>");

      const popupContent = `
        <div style="max-height: 200px; overflow-y: auto;">
          <strong>Submission ${i + 1}</strong><br>
          <strong>Lat:</strong> ${lat}<br>
          <strong>Lng:</strong> ${lng}<br><hr>
          ${detailsHtml}
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
      markers.addLayer(marker);
    });

    const bounds = markers.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  }, [filters, geoQuestions, submissions, forms]);

  // Fallback background map
  useEffect(() => {
    if (hasGeoPoint || !backgroundMapRef.current || backgroundMapRef.current._leaflet_id) return;

    const map = L.map(backgroundMapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([23.754231, 90.365476], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  }, [hasGeoPoint]);

  // Fallback UI if no geopoint
  if (!hasGeoPoint) {
    return (
      <div className="relative h-screen bg-gray-100 border border-black/70 rounded-lg">
        <div ref={backgroundMapRef} className="absolute inset-0 opacity-30 pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="text-xl font-medium text-gray-800">
            The map does not show data because this form does not have a <span className='text-blue-600'>"geopoint"</span> field.
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Filter Panel */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 0 5px rgba(0,0,0,0.3)',
          zIndex: 1000,
          width: showFilters ? '280px' : 'auto',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <button
          onClick={() => setShowFilters(prev => !prev)}
          style={{ marginBottom: '10px', padding: '6px 8px', cursor: 'pointer' }}
        >
          {showFilters ? '↓ Hide Filters' : '↑ Show Filters'}
        </button>

        {showFilters && (
          <div style={{ maxHeight: '40vh', overflowY: 'auto', fontSize: '14px' }}>
            {forms.questions.map(question => {
              const uniqueAnswers = [...new Set(submissions.map(sub => sub.data[question.name]).filter(Boolean))];
              return (
                <div key={question.name} style={{ marginBottom: '12px' }}>
                  <label htmlFor={`filter_${question.name}`} style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                    {question.label || question.name}
                  </label>
                  <select
                    id={`filter_${question.name}`}
                    value={filters[question.name] || ''}
                    onChange={e => setFilters(f => ({ ...f, [question.name]: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">All</option>
                    {uniqueAnswers.map(ans => (
                      <option key={ans} value={ans}>{ans}</option>
                    ))}
                  </select>
                </div>
              );
            })}
            <button
              onClick={() => {
                const reset = {};
                forms.questions.forEach(q => reset[q.name] = '');
                setFilters(reset);
              }}
              style={{ marginTop: '10px', cursor: 'pointer', padding: '6px 12px' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        id="map"
        ref={mapRef}
        className="h-screen border border-black/70 rounded-lg"
      />
    </div>
  );
};

export default Map;
