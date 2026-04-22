'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPreviewStop {
  Latitude: string;
  Longitude: string;
  Name: string;
  Time: string;
}

interface MapPreviewProps {
  stops: MapPreviewStop[];
  highlightIndex: number | null;
}

// Fixed: Invalidate size on load to fix "gray screen" issue
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export default function MapPreview({ stops, highlightIndex }: MapPreviewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.5, 127.5]);
  const [zoom, setZoom] = useState(7);

  // Update map when highlightIndex changes
  useEffect(() => {
    if (highlightIndex !== null && stops[highlightIndex]) {
      const stop = stops[highlightIndex];
      const lat = parseFloat(stop.Latitude);
      const lng = parseFloat(stop.Longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMapCenter([lat, lng]);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoom(16);
      }
    }
  }, [highlightIndex, stops]);

  const validStops = stops.filter(s => !isNaN(parseFloat(s.Latitude)) && !isNaN(parseFloat(s.Longitude)));
  const polylinePoints = validStops.map(s => [parseFloat(s.Latitude), parseFloat(s.Longitude)] as [number, number]);

  if (typeof window === 'undefined') return null;

  return (
    <div className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200 relative bg-slate-50">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={true}
      >
        <MapController center={mapCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validStops.map((stop, idx) => (
          <Marker 
            key={idx} 
            position={[parseFloat(stop.Latitude), parseFloat(stop.Longitude)]}
            eventHandlers={{
                click: () => {
                    setMapCenter([parseFloat(stop.Latitude), parseFloat(stop.Longitude)]);
                    setZoom(16);
                }
            }}
          >
            <Popup>
              <div className="font-bold text-slate-800">#{idx + 1} {stop.Name}</div>
              <div className="text-xs text-slate-500">{stop.Time}</div>
            </Popup>
          </Marker>
        ))}

        {polylinePoints.length > 1 && (
            <Polyline positions={polylinePoints} color="#4f46e5" weight={3} opacity={0.5} dashArray="10, 10" />
        )}
      </MapContainer>
      
      <div className="absolute bottom-6 right-6 z-[1000] bg-white/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 border border-white shadow-sm">
        REAL-TIME COORDINATE PREVIEW
      </div>
    </div>
  );
}
