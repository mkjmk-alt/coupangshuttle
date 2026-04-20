import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import Map component to avoid SSR issues
const MapPreview = dynamic(() => import('@/components/MapPreview'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-50 flex items-center justify-center animate-pulse rounded-3xl">
      <p className="text-slate-400 font-bold">지도 엔진 로딩 중...</p>
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
  'Kakao Place ID'?: string; // Support for updated schema
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
    setMessage({ type: 'success', text: '기본 데이터로 롤백되었습니다. 변경사항을 저장해 주세요.' });
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

      const resText = await res.text();
      let result;

      try {
        result = resText ? JSON.parse(resText) : null;
      } catch {
        console.error('Non-JSON response:', resText);
        throw new Error(`서버가 JSON이 아닌 응답을 보냈습니다. (코드: ${res.status})`);
      }

      if (res.ok && result?.success) {
        setMessage({ type: 'success', text: `저장 성공! ${Math.round(body.length / 1024 / 1024 * 10) / 10}MB 데이터가 저장되었습니다.` });
      } else {
        setMessage({ type: 'error', text: result?.message || `서버 오류 (HTTP ${res.status}): 저장에 실패했습니다.` });
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Save failed:', error);
      setMessage({ type: 'error', text: `저장 중 문제가 발생했습니다: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (key !== 'mkjmkcpstadmin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-6 text-center">
              <div className="text-8xl grayscale opacity-30">🔒</div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Restricted Access</h1>
              <p className="text-slate-500 font-medium max-w-sm">
                주소창의 비밀키가 올바르지 않습니다. <br /> 관리자 링크를 확인해 주세요.
              </p>
          </div>
      );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold">대용량 JSON 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shuttle Data Master</h1>
          </div>
          <p className="text-slate-400 text-xs font-bold mt-1 ml-11 uppercase tracking-widest">Global Route Optimization Engine</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-slate-50 text-slate-500 font-black text-[11px] rounded-xl hover:bg-slate-100 transition-all uppercase tracking-wider"
            >
                Back to Map
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 uppercase tracking-widest"
            >
                {saving ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                )}
                {saving ? 'Syncing...' : 'Deploy Changes'}
            </button>
        </div>
      </header>

      {message && (
          <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} animate-in fade-in slide-in-from-top duration-500`}>
             <div className="flex items-center gap-3 font-bold text-sm">
                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                {message.text}
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Editor Form */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Center</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm overflow-hidden"
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
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Shift</label>
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
                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Route</label>
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

          {selectedRoute && (
              <section className="space-y-4 max-h-[1200px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-20 py-2 rounded-xl px-4">
                      <h2 className="text-sm font-black text-slate-400 tracking-[0.1em] uppercase">Station List ({currentStops.length})</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleRollback}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg font-black text-[10px] hover:text-red-500 hover:border-red-100 transition-all uppercase"
                        >
                          Reset
                        </button>
                        <button 
                          onClick={handleAddStop}
                          className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg font-black text-[10px] hover:bg-indigo-600 transition-all uppercase tracking-widest"
                        >
                            + Add Stop
                        </button>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {currentStops.map((stop, idx) => (
                          <div 
                            key={idx} 
                            className={`bg-white p-6 rounded-[2rem] border transition-all group relative ${highlightedStopIndex === idx ? 'border-indigo-500 shadow-xl shadow-indigo-100 ring-1 ring-indigo-500' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                            onClick={() => setHighlightedStopIndex(idx)}
                          >
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                  <div className="md:col-span-1 flex flex-col items-center justify-center pt-2">
                                      <span className={`text-[10px] font-black transition-colors ${highlightedStopIndex === idx ? 'text-indigo-500' : 'text-slate-200'}`}>{String(idx+1).padStart(2, '0')}</span>
                                  </div>
                                  
                                  <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                                      <div className="md:col-span-2 space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Station Name</label>
                                          <input 
                                            type="text" 
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                                            value={stop.Name}
                                            onFocus={() => setHighlightedStopIndex(idx)}
                                            onChange={(e) => handleStopChange(idx, 'Name', e.target.value)}
                                          />
                                      </div>
                                      <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Arrival</label>
                                          <input 
                                            type="text" 
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                            value={stop.Time}
                                            onFocus={() => setHighlightedStopIndex(idx)}
                                            onChange={(e) => handleStopChange(idx, 'Time', e.target.value)}
                                          />
                                      </div>
                                      <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Remarks</label>
                                          <input 
                                              type="text" 
                                              className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-500 text-xs"
                                              value={stop.Remarks || ''}
                                              placeholder="비고"
                                              onFocus={() => setHighlightedStopIndex(idx)}
                                              onChange={(e) => handleStopChange(idx, 'Remarks', e.target.value)}
                                          />
                                      </div>

                                      <div className="md:col-span-4 space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Details</label>
                                          <input 
                                            type="text" 
                                            className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-bold text-slate-600 text-xs"
                                            value={stop.Address}
                                            onFocus={() => setHighlightedStopIndex(idx)}
                                            onChange={(e) => handleStopChange(idx, 'Address', e.target.value)}
                                          />
                                      </div>
                                      
                                      <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                                            <input 
                                              type="text" 
                                              className="w-full px-4 py-2.5 bg-slate-50/50 border-none rounded-xl font-bold text-slate-600 text-[11px] font-mono"
                                              value={stop.Latitude}
                                              onFocus={() => setHighlightedStopIndex(idx)}
                                              onChange={(e) => handleStopChange(idx, 'Latitude', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                            <input 
                                              type="text" 
                                              className="w-full px-4 py-2.5 bg-slate-50/50 border-none rounded-xl font-bold text-slate-600 text-[11px] font-mono"
                                              value={stop.Longitude}
                                              onFocus={() => setHighlightedStopIndex(idx)}
                                              onChange={(e) => handleStopChange(idx, 'Longitude', e.target.value)}
                                            />
                                        </div>
                                      </div>

                                      <div className="md:col-span-2 flex items-end justify-between gap-4">
                                          <div className="flex gap-2 mb-1">
                                            <a 
                                                href={`https://map.naver.com/v5/search/${stop.Latitude},${stop.Longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black hover:bg-emerald-100 transition-all uppercase"
                                            >
                                                Naver
                                            </a>
                                            <a 
                                                href={`https://map.kakao.com/link/map/${encodeURIComponent(stop.Name)},${stop.Latitude},${stop.Longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-[9px] font-black hover:bg-yellow-100 transition-all uppercase"
                                            >
                                                Kakao
                                            </a>
                                          </div>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveStop(idx);
                                            }}
                                            className="p-2 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mb-0.5"
                                          >
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
              <div className="bg-white p-32 text-center rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center animate-bounce">
                    <span className="text-5xl grayscale opacity-30">🚍</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Ready to Edit</h3>
                    <p className="text-slate-400 font-bold text-sm mt-1">상단에서 센터와 노선을 선택해 주세요.</p>
                  </div>
              </div>
          )}
        </div>

        {/* Right Side: Map Preview (Sticky) */}
        <div className="lg:col-span-5 sticky top-8 h-[calc(100vh-100px)]">
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
