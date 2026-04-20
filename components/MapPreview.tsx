'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPreviewProps {
  stops: any[];
  highlightIndex: number | null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
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
        setMapCenter([lat, lng]);
        setZoom(16);
      }
    } else if (stops.length > 0) {
        // Fit all stops
    }
  }, [highlightIndex, stops]);

  const validStops = stops.filter(s => !isNaN(parseFloat(s.Latitude)) && !isNaN(parseFloat(s.Longitude)));
  const polylinePoints = validStops.map(s => [parseFloat(s.Latitude), parseFloat(s.Longitude)] as [number, number]);

  return (
    <div className="h-full w-full rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <ChangeView center={mapCenter} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
