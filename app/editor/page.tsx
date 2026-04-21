'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import Map component to avoid SSR issues
const MapPreview = dynamic(() => import('@/components/MapPreview'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex items-center justify-center animate-pulse rounded-[2.5rem] border-2 border-dashed border-slate-200">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-bold text-xs">지도 엔진 준비 중...</p>
      </div>
    </div>
  )
});

interface Stop {
  'Center (EN)': string;
  Shift: string;
  'Route Name': string;
  Order: number;
  Type: string;
  Time: string;
  Name: string;
  Address: string;
  Latitude: string;
  Longitude: string;
  'Image URL'?: string;
  Remarks?: string;
  'Naver Map'?: string;
  'Kakao Map'?: string;
  'Kakao Place ID'?: string;
}

interface RouteMap {
  [routeName: string]: Stop[];
}

interface ShiftMap {
  [shiftName: string]: RouteMap;
}

interface centerData {
  name: string;
  address: string;
  lat: string | number;
  lng: string | number;
}

interface FCCard {
  code: string;
  center: centerData;
  shifts: ShiftMap;
}

interface ShuttleData {
  [fcCode: string]: FCCard;
}

function EditorContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');

  const [data, setData] = useState<ShuttleData | null>(null);
  const [baseData, setBaseData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [highlightedStopIndex, setHighlightedStopIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resCurrent, resBase] = await Promise.all([
          fetch('/data/shuttle_data.json'),
          fetch('/data/shuttle_base.json')
        ]);

        const jsonCurrent = await resCurrent.json();
        const jsonBase = await resBase.json();

        setData(jsonCurrent);
        setBaseData(jsonBase);
      } catch (err) {
        console.error('Error loading shuttle data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fcList = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).map(key => ({
      code: key,
      name: data[key].center?.name || key
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko-KR', { numeric: true }));
  }, [data]);

  const shiftList = useMemo(() => {
    if (!data || !selectedFC) return [];
    const shifts = Object.keys(data[selectedFC]?.shifts || {});
    
    const priority: Record<string, number> = {
      '주간조': 1,
      '오후조': 2,
    };

    return shifts.sort((a, b) => {
      const pA = priority[a] || 3;
      const pB = priority[b] || 3;
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b, 'ko-KR', { numeric: true });
    });
  }, [data, selectedFC]);

  const routeList = useMemo(() => {
    if (!data || !selectedFC || !selectedShift) return [];
    return Object.keys(data[selectedFC].shifts[selectedShift] || {}).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
  }, [data, selectedFC, selectedShift]);

  const currentStops = useMemo(() => {
    if (!data || !selectedFC || !selectedShift || !selectedRoute) return [];
    return data[selectedFC].shifts[selectedShift][selectedRoute] || [];
  }, [data, selectedFC, selectedShift, selectedRoute]);

  const handleStopChange = (index: number, field: keyof Stop, value: string | number) => {
    if (!data || !selectedFC || !selectedShift || !selectedRoute) return;

    const newData = JSON.parse(JSON.stringify(data));
    const stops = newData[selectedFC].shifts[selectedShift][selectedRoute];
    
    stops[index] = {
      ...stops[index],
      [field]: value
    };

    setData(newData);
  };

  const handleRollback = () => {
    if (!data || !baseData || !selectedFC || !selectedShift || !selectedRoute) return;

    const baseStops = baseData[selectedFC]?.shifts?.[selectedShift]?.[selectedRoute];
    
    if (!baseStops) {
      alert('기본 데이터에 해당 노선 정보가 없습니다.');
      return;
    }

    if (!confirm(`'${selectedRoute}' 노선을 처음 데이터 상태로 되돌리시겠습니까?\n현재 수정중인 내용은 사라집니다.`)) return;

    const newData = JSON.parse(JSON.stringify(data));
    newData[selectedFC].shifts[selectedShift][selectedRoute] = JSON.parse(JSON.stringify(baseStops));
    
    setData(newData);
    setMessage({ type: 'success', text: '기본 데이터로 롤백되었습니다.' });
  };

  const handleAddStop = () => {
    if (!data || !selectedFC || !selectedShift || !selectedRoute) return;

    const newData = JSON.parse(JSON.stringify(data));
    const stops = newData[selectedFC].shifts[selectedShift][selectedRoute];
    
    const lastStop = stops[stops.length - 1];
    const newStop: Stop = {
      'Center (EN)': selectedFC,
      Shift: selectedShift,
      'Route Name': selectedRoute,
      Order: stops.length + 1,
      Type: 'Stop',
      Time: lastStop ? lastStop.Time : '00:00',
      Name: '신규 정류장',
      Address: '주소 입력',
      Latitude: lastStop ? lastStop.Latitude : '37.5',
      Longitude: lastStop ? lastStop.Longitude : '127.0',
    };

    stops.push(newStop);
    setData(newData);
    setHighlightedStopIndex(stops.length - 1);
  };

  const handleRemoveStop = (index: number) => {
    if (!data || !selectedFC || !selectedShift || !selectedRoute) return;

    const newData = JSON.parse(JSON.stringify(data));
    newData[selectedFC].shifts[selectedShift][selectedRoute].splice(index, 1);
    
    newData[selectedFC].shifts[selectedShift][selectedRoute].forEach((stop: Stop, idx: number) => {
        stop.Order = idx + 1;
    });

    setData(newData);
    setHighlightedStopIndex(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body = JSON.stringify(data, null, 2);
      
      const res = await fetch('/api/save-data/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-editor-key': 'mkjmkcpstadmin'
        },
        body: body,
      });

      const result = await res.json();

      if (res.ok && result?.success) {
        setMessage({ type: 'success', text: `배포 완료! ${Math.round(body.length / 1024 / 1024 * 10) / 10}MB` });
      } else {
        setMessage({ type: 'error', text: result?.message || `저장 실패 (HTTP ${res.status})` });
      }
    } catch (err) {
      console.error('Save failed:', err);
      setMessage({ type: 'error', text: `네트워크 오류가 발생했습니다.` });
    } finally {
      setSaving(false);
    }
  };

  // Helper: Calculate distance between two coordinates (km)
  const calculateDistance = (lat1: string, lon1: string, lat2: string, lon2: string) => {
    const R = 6371; // Earth's radius in km
    const dLat = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
    const dLon = (parseFloat(lon2) - parseFloat(lon1)) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(parseFloat(lat1) * Math.PI / 180) * Math.cos(parseFloat(lat2) * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper: Get speed between two stops (km/h)
  const getSpeedInfo = (stop1: Stop, stop2: Stop) => {
    const dist = calculateDistance(stop1.Latitude, stop1.Longitude, stop2.Latitude, stop2.Longitude);
    
    // Parse times (HH:mm)
    const t1 = stop1.Time.split(':').map(Number);
    const t2 = stop2.Time.split(':').map(Number);
    
    if (t1.length !== 2 || t2.length !== 2) return { dist, speed: 0, timeDiff: 0 };
    
    let m1 = t1[0] * 60 + t1[1];
    let m2 = t2[0] * 60 + t2[1];
    
    // Handle midnight wrap if needed (e.g. 23:50 -> 00:10)
    if (m2 < m1) m2 += 1440; 
    
    const timeDiff = m2 - m1;
    if (timeDiff <= 0) return { dist, speed: 999, timeDiff }; // Stop logic error
    
    const speed = (dist / timeDiff) * 60;
    return { dist, speed, timeDiff };
  };

  if (key !== 'mkjmkcpstadmin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center">
              <div className="text-8xl opacity-30">🔒</div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Restricted Access</h1>
              <p className="text-slate-500 font-medium tracking-tight">관리자 전용 링크가 아닙니다.</p>
          </div>
      );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-tight">전체 정류장 데이터 로딩 중 (Large JSON)...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">🚀</div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Shuttle Data Master</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Route Integrity & Optimization</p>
          </div>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-slate-50 text-slate-500 font-black text-[11px] rounded-xl hover:bg-slate-100 transition-all uppercase"
            >
                Map View
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest"
            >
                {saving ? 'Syncing...' : 'Deploy Changes'}
            </button>
        </div>
      </header>

      {message && (
          <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} animate-in fade-in slide-in-from-top duration-500`}>
             <div className="font-bold text-sm text-center">
                {message.type === 'success' ? '✅' : '❌'} {message.text}
             </div>
          </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[800px]">
        {/* Left Side: Editor Form */}
        <div className="w-full lg:w-7/12 space-y-6 order-2 lg:order-1">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Center</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={selectedFC}
                        onChange={(e) => {
                            setSelectedFC(e.target.value);
                            setSelectedShift('');
                            setSelectedRoute('');
                            setHighlightedStopIndex(null);
                        }}
                    >
                        <option value="">물류센터 선택</option>
                        {fcList.map(fc => (
                            <option key={fc.code} value={fc.code}>{fc.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Shift</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                        value={selectedShift}
                        disabled={!selectedFC}
                        onChange={(e) => {
                            setSelectedShift(e.target.value);
                            setSelectedRoute('');
                            setHighlightedStopIndex(null);
                        }}
                    >
                        <option value="">근무조 선택</option>
                        {shiftList.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Route</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                        value={selectedRoute}
                        disabled={!selectedShift}
                        onChange={(e) => {
                          setSelectedRoute(e.target.value);
                          setHighlightedStopIndex(null);
                        }}
                    >
                        <option value="">노선 선택</option>
                        {routeList.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>
          </section>

          {selectedRoute ? (
              <section className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-20 py-2 rounded-xl px-4">
                      <h2 className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase">Station List ({currentStops.length})</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleRollback}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg font-black text-[10px] hover:text-red-500 transition-all uppercase"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={handleAddStop}
                          className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[10px] hover:bg-indigo-600 transition-all uppercase"
                        >
                            + Add
                        </button>
                      </div>
                  </div>

                  <div className="space-y-4 pb-20">
                      {currentStops.map((stop, idx) => {
                          const prevStop = idx > 0 ? currentStops[idx - 1] : null;
                          const speedStatus = prevStop ? getSpeedInfo(prevStop, stop) : null;
                          
                          return (
                            <div key={idx} className="space-y-4">
                                {speedStatus && (
                                    <div className="flex items-center justify-center gap-6 py-2 px-10">
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                        <div className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest ${speedStatus.speed > 100 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <span>📏</span>
                                                <span>{speedStatus.dist.toFixed(2)} km</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span>⏱️</span>
                                                <span>{speedStatus.timeDiff} min</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${speedStatus.speed > 100 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <span>⚡</span>
                                                <span>{speedStatus.speed > 900 ? 'TIME ERROR' : `${speedStatus.speed.toFixed(1)} km/h`}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                    </div>
                                )}
                                <div 
                                    className={`bg-white p-6 rounded-[2rem] border transition-all ${highlightedStopIndex === idx ? 'border-indigo-500 shadow-xl shadow-indigo-100 ring-1 ring-indigo-500' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                                    onClick={() => setHighlightedStopIndex(idx)}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                        <div className="md:col-span-1 flex flex-col items-center justify-center pt-2">
                                            <span className={`text-[10px] font-black ${highlightedStopIndex === idx ? 'text-indigo-500' : 'text-slate-200'}`}>#{idx+1}</span>
                                        </div>
                                        
                                        <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Name</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-700 text-sm"
                                                    value={stop.Name}
                                                    onFocus={() => setHighlightedStopIndex(idx)}
                                                    onChange={(e) => handleStopChange(idx, 'Name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Arrival</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-black text-indigo-600 text-sm font-mono text-center"
                                                    value={stop.Time}
                                                    onFocus={() => setHighlightedStopIndex(idx)}
                                                    onChange={(e) => handleStopChange(idx, 'Time', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Remarks</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-500 text-xs"
                                                    value={stop.Remarks || ''}
                                                    onFocus={() => setHighlightedStopIndex(idx)}
                                                    onChange={(e) => handleStopChange(idx, 'Remarks', e.target.value)}
                                                />
                                            </div>

                                            <div className="md:col-span-4 space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Address</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-600 text-xs"
                                                    value={stop.Address}
                                                    onFocus={() => setHighlightedStopIndex(idx)}
                                                    onChange={(e) => handleStopChange(idx, 'Address', e.target.value)}
                                                />
                                            </div>
                                            
                                            <div className="md:col-span-2 grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Lat</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-2 bg-slate-50/50 border-none rounded-xl font-bold text-slate-600 text-[10px] font-mono"
                                                        value={stop.Latitude}
                                                        onFocus={() => setHighlightedStopIndex(idx)}
                                                        onChange={(e) => handleStopChange(idx, 'Latitude', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Lng</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full px-4 py-2 bg-slate-50/50 border-none rounded-xl font-bold text-slate-600 text-[10px] font-mono"
                                                        value={stop.Longitude}
                                                        onFocus={() => setHighlightedStopIndex(idx)}
                                                        onChange={(e) => handleStopChange(idx, 'Longitude', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="md:col-span-2 flex items-end justify-between">
                                                <div className="flex gap-2 mb-0.5">
                                                    <a 
                                                        href={`https://map.naver.com/v5/search/${stop.Latitude},${stop.Longitude}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black"
                                                    >NAVER</a>
                                                    <a 
                                                        href={`https://map.kakao.com/link/map/${encodeURIComponent(stop.Name)},${stop.Latitude},${stop.Longitude}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-[9px] font-black"
                                                    >KAKAO</a>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveStop(idx); }}
                                                    className="p-2 text-red-200 hover:text-red-500 transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              </section>
          ) : (
            <div className="bg-white p-32 text-center rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center animate-bounce">
                  <span className="text-5xl grayscale opacity-30">🚍</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Ready to Edit</h3>
                  <p className="text-slate-400 font-bold text-sm mt-1">센터와 노선을 선택해 주세요.</p>
                </div>
            </div>
          )}
        </div>

        {/* Right Side: Map Preview (Order 1 on mobile, Sticky on Desktop) */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-8 order-1 lg:order-2 h-[450px] lg:h-[calc(100vh-120px)] bg-white rounded-[2.5rem] border-4 border-dashed border-indigo-50 p-1 shadow-sm overflow-hidden">
            <MapPreview 
              stops={currentStops} 
              highlightIndex={highlightedStopIndex}
            />
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}

export default function DataEditor() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
