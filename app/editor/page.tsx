'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  
  if (key !== 'mkjmkcpstadmin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-6 text-center">
              <div className="text-8xl grayscale opacity-30">🛡️</div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit uppercase">Restricted Access</h1>
              <p className="text-slate-500 font-medium max-w-sm">주소창의 비밀 키가 올바르지 않습니다. <br />관리자 링크를 통해 다시 접속해 주세요.</p>
          </div>
      );
  }

  const [data, setData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/data/shuttle_data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading shuttle data:', err);
        setLoading(false);
      });
  }, []);

  const fcList = useMemo(() => {
    if (!data) return [];
    return Object.keys(data).map(key => ({
      code: key,
      name: data[key].center?.name || key
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  }, [data]);

  const shiftList = useMemo(() => {
    if (!data || !selectedFC) return [];
    return Object.keys(data[selectedFC]?.shifts || {}).sort();
  }, [data, selectedFC]);

  const routeList = useMemo(() => {
    if (!data || !selectedFC || !selectedShift) return [];
    return Object.keys(data[selectedFC].shifts[selectedShift] || {}).sort();
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
      Address: '서울시...',
      Latitude: lastStop ? lastStop.Latitude : '37.5',
      Longitude: lastStop ? lastStop.Longitude : '127.0',
    };

    stops.push(newStop);
    setData(newData);
  };

  const handleRemoveStop = (index: number) => {
    if (!data || !selectedFC || !selectedShift || !selectedRoute) return;

    const newData = JSON.parse(JSON.stringify(data));
    newData[selectedFC].shifts[selectedShift][selectedRoute].splice(index, 1);
    
    newData[selectedFC].shifts[selectedShift][selectedRoute].forEach((stop: Stop, idx: number) => {
        stop.Order = idx + 1;
    });

    setData(newData);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/save-data', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-editor-key': 'mkjmkcpstadmin'
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: '데이터가 저장되었습니다!' });
      } else {
        setMessage({ type: 'error', text: result.message || '저장 중 오류가 발생했습니다.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '서버 통신 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">대용량 JSON 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Management System</h1>
          <p className="text-slate-400 font-medium mt-1">셔틀 노선 데이터를 실시간으로 수정하고 반영합니다.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
                메인으로 이동
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="premium-btn flex items-center gap-2 !py-3 !px-8"
            >
                {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                )}
                {saving ? '저장 중...' : '변경사항 저장'}
            </button>
        </div>
      </header>

      {message && (
          <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} animate-in fade-in slide-in-from-top duration-500`}>
             <div className="flex items-center gap-3 font-bold">
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                {message.text}
             </div>
          </div>
      )}

      {/* Editor Main Controls */}
      <section className="premium-card p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Center</label>
                    {selectedFC && (
                        <a 
                            href={`https://coufc.coupang.com/${selectedFC.toLowerCase()}/shuttle`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-600 hover:underline"
                        >
                            OFFICIAL PAGE ↗
                        </a>
                    )}
                </div>
                <select 
                    className="premium-input cursor-pointer"
                    value={selectedFC}
                    onChange={(e) => {
                        setSelectedFC(e.target.value);
                        setSelectedShift('');
                        setSelectedRoute('');
                    }}
                >
                    <option value="">센터 선택</option>
                    {fcList.map(fc => (
                        <option key={fc.code} value={fc.code}>{fc.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Shift</label>
                <select 
                    className="premium-input cursor-pointer disabled:opacity-50"
                    value={selectedShift}
                    disabled={!selectedFC}
                    onChange={(e) => {
                        setSelectedShift(e.target.value);
                        setSelectedRoute('');
                    }}
                >
                    <option value="">근무조 선택</option>
                    {shiftList.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">Route</label>
                <select 
                    className="premium-input cursor-pointer disabled:opacity-50"
                    value={selectedRoute}
                    disabled={!selectedShift}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                >
                    <option value="">노선 선택</option>
                    {routeList.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            </div>
        </div>
      </section>

      {/* Stop Editor List */}
      {selectedRoute && (
          <section className="space-y-6">
              <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">STATION CONFIGURATION ({currentStops.length})</h2>
                  <button 
                    onClick={handleAddStop}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-100"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      정류장 추가
                  </button>
              </div>

              <div className="space-y-4">
                  {currentStops.map((stop, idx) => (
                      <div key={idx} className="premium-card p-6 hover:border-indigo-200 transition-colors group">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                              <div className="md:col-span-1 flex flex-col items-center justify-center pt-2">
                                  <span className="text-xs font-black text-slate-300 font-outfit">#{idx+1}</span>
                              </div>
                              
                              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Station Name</label>
                                      <input 
                                        type="text" 
                                        className="premium-input py-2.5 px-4 text-sm font-bold"
                                        value={stop.Name}
                                        onChange={(e) => handleStopChange(idx, 'Name', e.target.value)}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Arrival Time</label>
                                      <input 
                                        type="text" 
                                        className="premium-input py-2.5 px-4 text-sm font-bold font-mono"
                                        value={stop.Time}
                                        onChange={(e) => handleStopChange(idx, 'Time', e.target.value)}
                                      />
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Exact Address</label>
                                      <input 
                                        type="text" 
                                        className="premium-input py-2.5 px-4 text-sm font-bold"
                                        value={stop.Address}
                                        onChange={(e) => handleStopChange(idx, 'Address', e.target.value)}
                                      />
                                  </div>
                                  
                                  <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Lat</label>
                                        <a 
                                            href={`https://map.naver.com/v5/search/${stop.Latitude},${stop.Longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-bold text-emerald-600 hover:underline"
                                        >
                                            NAVER MAP
                                        </a>
                                      </div>
                                      <input 
                                        type="text" 
                                        className="premium-input py-2.5 px-4 text-xs font-medium bg-slate-50/50"
                                        value={stop.Latitude}
                                        onChange={(e) => handleStopChange(idx, 'Latitude', e.target.value)}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Lng</label>
                                        <a 
                                            href={`https://map.kakao.com/link/map/${encodeURIComponent(stop.Name)},${stop.Latitude},${stop.Longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] font-bold text-yellow-600 hover:underline"
                                        >
                                            KAKAO MAP
                                        </a>
                                      </div>
                                      <input 
                                        type="text" 
                                        className="premium-input py-2.5 px-4 text-xs font-medium bg-slate-50/50"
                                        value={stop.Longitude}
                                        onChange={(e) => handleStopChange(idx, 'Longitude', e.target.value)}
                                      />
                                  </div>
                                  <div className="md:col-span-2 space-y-2 flex items-end justify-between">
                                      <div className="flex-1 mr-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Remarks (Info)</label>
                                        <input 
                                            type="text" 
                                            className="premium-input py-2.5 px-4 text-xs font-medium"
                                            value={stop.Remarks || ''}
                                            placeholder="비고란 (정류장 상세 정보)"
                                            onChange={(e) => handleStopChange(idx, 'Remarks', e.target.value)}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => handleRemoveStop(idx)}
                                        className="p-2.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                                      >
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      {!selectedRoute && (
          <div className="premium-card p-32 text-center opacity-40">
              <div className="text-6xl mb-6 grayscale text-slate-400">📝</div>
              <p className="text-xl font-bold text-slate-900">수정할 노선을 먼저 선택해 주세요.</p>
          </div>
      )}
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
