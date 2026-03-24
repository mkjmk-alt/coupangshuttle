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

  const [data, setData] = useState<ShuttleData | null>(null);
  const [baseData, setBaseData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load both current and base data for rollback feature
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
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Management System</h1>
          <p className="text-slate-400 font-medium mt-1">전체 노선 데이터를 실시간으로 수정하고 반영합니다.</p>
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
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
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
      <section className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm">
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
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                  <div className="flex gap-3">
                    <button 
                      onClick={handleRollback}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                    >
                      초기화
                    </button>
                    <button 
                      onClick={handleAddStop}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                        정류장 추가
                    </button>
                  </div>
              </div>

              <div className="space-y-4">
                  {currentStops.map((stop, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors group">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                              <div className="md:col-span-1 flex flex-col items-center justify-center pt-2">
                                  <span className="text-xs font-black text-slate-300">#{idx+1}</span>
                              </div>
                              
                              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Station Name</label>
                                      <input 
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                                        value={stop.Name}
                                        onChange={(e) => handleStopChange(idx, 'Name', e.target.value)}
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Arrival Time</label>
                                      <input 
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                                        value={stop.Time}
                                        onChange={(e) => handleStopChange(idx, 'Time', e.target.value)}
                                      />
                                  </div>
                                  <div className="md:col-span-2 space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Exact Address</label>
                                      <input 
                                        type="text" 
                                        className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 text-sm"
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
                                        className="w-full px-4 py-2 bg-slate-50/50 border-none rounded-xl font-medium text-slate-600 text-xs"
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
                                        className="w-full px-4 py-2 bg-slate-50/50 border-none rounded-xl font-medium text-slate-600 text-xs"
                                        value={stop.Longitude}
                                        onChange={(e) => handleStopChange(idx, 'Longitude', e.target.value)}
                                      />
                                  </div>
                                  <div className="md:col-span-2 space-y-2 flex items-end justify-between">
                                      <div className="flex-1 mr-4">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Remarks (Info)</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl font-medium text-slate-600 text-xs"
                                            value={stop.Remarks || ''}
                                            placeholder="비고 (정류장 상세 정보)"
                                            onChange={(e) => handleStopChange(idx, 'Remarks', e.target.value)}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => handleRemoveStop(idx)}
                                        className="p-2.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                      >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
          <div className="bg-slate-50 p-32 text-center rounded-[40px] border-2 border-dashed border-slate-200">
              <div className="text-6xl mb-6 grayscale opacity-20">📍</div>
              <p className="text-xl font-bold text-slate-400">수정할 노선을 먼저 선택해 주세요.</p>
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
