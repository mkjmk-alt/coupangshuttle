'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
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
  onApplyCoordinate?: (latitude: string, longitude: string) => void;
}

interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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

function CoordinatePicker({ onSelect }: { onSelect: (coordinate: [number, number]) => void }) {
  useMapEvents({
    click: (event) => {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function MapPreview({ stops, highlightIndex, onApplyCoordinate }: MapPreviewProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.5, 127.5]);
  const [zoom, setZoom] = useState(7);
  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number] | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'searching' | 'error'>('idle');
  const [searchMessage, setSearchMessage] = useState('');

  // Update map when highlightIndex changes
  useEffect(() => {
    if (highlightIndex !== null && stops[highlightIndex]) {
      const stop = stops[highlightIndex];
      const lat = parseFloat(stop.Latitude);
      const lng = parseFloat(stop.Longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Highlight selection intentionally synchronizes the controlled map view.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMapCenter([lat, lng]);
        setZoom(16);
        setSelectedCoordinate([lat, lng]);
        setSelectedPlaceName(stop.Name);
        setCopyState('idle');
      }
    }
  }, [highlightIndex, stops]);

  const validStops = stops.filter(s => !isNaN(parseFloat(s.Latitude)) && !isNaN(parseFloat(s.Longitude)));
  const polylinePoints = validStops.map(s => [parseFloat(s.Latitude), parseFloat(s.Longitude)] as [number, number]);
  const selectedLatitude = selectedCoordinate?.[0].toFixed(6) ?? '';
  const selectedLongitude = selectedCoordinate?.[1].toFixed(6) ?? '';

  const handleCoordinateSelect = (coordinate: [number, number]) => {
    setSelectedCoordinate(coordinate);
    setSelectedPlaceName('');
    setCopyState('idle');
  };

  const handleLocationSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchState('error');
      setSearchMessage('장소명이나 주소를 두 글자 이상 입력해 주세요.');
      return;
    }

    setSearchState('searching');
    setSearchMessage('');
    setSearchResults([]);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const payload = await response.json() as {
        results?: LocationSearchResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || '위치 검색에 실패했습니다.');
      }

      const results = payload.results ?? [];
      setSearchResults(results);
      setSearchState('idle');
      setSearchMessage(results.length === 0 ? '검색 결과가 없습니다. 주소를 조금 더 자세히 입력해 보세요.' : '');
    } catch (error) {
      setSearchState('error');
      setSearchMessage(error instanceof Error ? error.message : '위치 검색에 실패했습니다.');
    }
  };

  const handleSearchResultSelect = (result: LocationSearchResult) => {
    const coordinate: [number, number] = [result.latitude, result.longitude];
    setMapCenter(coordinate);
    setZoom(17);
    setSelectedCoordinate(coordinate);
    setSelectedPlaceName(result.name);
    setSearchQuery(result.name);
    setSearchResults([]);
    setSearchMessage('검색한 위치를 선택했습니다. 아래에서 좌표를 확인하거나 정류장에 적용하세요.');
    setSearchState('idle');
    setCopyState('idle');
  };

  const handleCopyCoordinate = async () => {
    if (!selectedCoordinate) return;

    try {
      await navigator.clipboard.writeText(`${selectedLatitude}, ${selectedLongitude}`);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

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
        <CoordinatePicker onSelect={handleCoordinateSelect} />
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
                    const coordinate: [number, number] = [parseFloat(stop.Latitude), parseFloat(stop.Longitude)];
                    setMapCenter(coordinate);
                    setZoom(16);
                    handleCoordinateSelect(coordinate);
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

        {selectedCoordinate && (
          <Marker position={selectedCoordinate}>
            <Popup>
              <div className="font-bold text-slate-800">{selectedPlaceName || '선택한 위치'}</div>
              <div className="text-xs text-slate-500 font-mono">
                {selectedLatitude}, {selectedLongitude}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="absolute left-4 right-4 top-4 z-[1000]">
        <form
          onSubmit={handleLocationSearch}
          className="flex gap-2 rounded-2xl border border-white bg-white/95 p-2 shadow-xl backdrop-blur-md"
          role="search"
        >
          <label htmlFor="map-location-search" className="sr-only">장소 또는 주소 검색</label>
          <input
            id="map-location-search"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              if (searchMessage) setSearchMessage('');
            }}
            placeholder="장소명 또는 주소 검색"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={searchState === 'searching'}
            className="shrink-0 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"
          >
            {searchState === 'searching' ? '검색 중' : '위치 검색'}
          </button>
        </form>

        {(searchResults.length > 0 || searchMessage) && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/98 shadow-xl">
            {searchResults.length > 0 && (
              <ul className="max-h-60 overflow-y-auto py-1">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => handleSearchResultSelect(result)}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                    >
                      <span className="block text-sm font-black text-slate-800">{result.name}</span>
                      <span className="mt-1 block text-[11px] font-medium leading-relaxed text-slate-500">
                        {result.address}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchMessage && (
              <p
                className={`px-4 py-3 text-xs font-bold ${searchState === 'error' ? 'text-rose-600' : 'text-slate-600'}`}
                role="status"
              >
                {searchMessage}
              </p>
            )}
            {searchResults.length > 0 && (
              <p className="border-t border-slate-100 px-4 py-2 text-[9px] font-bold text-slate-400">
                검색 데이터 © OpenStreetMap contributors
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl border border-white bg-white/95 p-3 shadow-xl backdrop-blur-md">
        {selectedCoordinate ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">선택한 위치 좌표</p>
              <p className="mt-1 break-all font-mono text-xs font-black text-slate-700">
                위도 {selectedLatitude} · 경도 {selectedLongitude}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={handleCopyCoordinate}
                className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-600 transition hover:bg-slate-200"
              >
                {copyState === 'copied' ? '복사됨' : copyState === 'failed' ? '복사 실패' : '좌표 복사'}
              </button>
              {highlightIndex !== null && onApplyCoordinate && (
                <button
                  type="button"
                  onClick={() => onApplyCoordinate(selectedLatitude, selectedLongitude)}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-slate-900"
                >
                  선택 정류장에 적용
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-[10px] font-black text-slate-500">
            지도를 클릭하면 그 위치의 위도·경도가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
