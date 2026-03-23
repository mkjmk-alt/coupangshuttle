'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ShuttleStop } from '../types/shuttle';
import { getRouteColor } from '../utils/color';

// Dynamically import the map to ensure it stays client-side
const KakaoMapWrapper = dynamic(() => import('./KakaoMapWrapper'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 font-medium">지도 모듈 로드 중...</span>
    </div>
  </div>
});

interface Stop {
  Latitude: number;
  Longitude: number;
  Name: string;
  Time: string;
  Address: string;
  Info?: string;
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

export default function ShuttleExplorer() {
  const [data, setData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');

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
    const shifts = Object.keys(data[selectedFC]?.shifts || {});
    
    const priority: Record<string, number> = {
      '주간조': 1,
      '오후조': 2,
    };

    return shifts.sort((a, b) => {
      const pA = priority[a] || 3;
      const pB = priority[b] || 3;
      if (pA !== pB) return pA - pB;
      return a.localeCompare(b, 'ko-KR');
    });
  }, [data, selectedFC]);

  useEffect(() => {
    if (shiftList.length > 0) {
      setSelectedShift(shiftList[0]);
    } else {
      setSelectedShift('');
    }
  }, [shiftList]);

  const routeList = useMemo(() => {
    if (!data || !selectedFC) return [];
    const shifts = data[selectedFC]?.shifts;
    if (shifts && selectedShift) {
        return Object.keys(shifts[selectedShift] || {}).sort();
    }
    if (!shifts) return [];
    const allRoutes = new Set<string>();
    Object.values(shifts).forEach(routes => {
        Object.keys(routes).forEach(r => allRoutes.add(r));
    });
    return Array.from(allRoutes).sort();
  }, [data, selectedFC, selectedShift]);

  const stopsForResults = useMemo(() => {
    if (!data || !selectedFC) return [];
    const shifts = data[selectedFC]?.shifts;
    if (!shifts) return [];
    let stops: (Stop & { shift: string; route: string; routeIndex: number })[] = [];

    Object.entries(shifts).forEach(([shiftName, routes]) => {
      if (selectedShift && shiftName !== selectedShift) return;
      Object.entries(routes).forEach(([routeName, routeStops]) => {
        if (selectedRoute && routeName !== selectedRoute) return;
        routeStops.forEach((stop, idx) => {
          stops.push({ ...stop, shift: shiftName, route: routeName, routeIndex: idx + 1 });
        });
      });
    });
    return stops;
  }, [data, selectedFC, selectedShift, selectedRoute]);

  const mapStops = useMemo((): ShuttleStop[] => {
    return stopsForResults.map((s, idx) => ({
      id: `${s.route}-${idx}`,
      name: s.Name,
      lat: Number(s.Latitude),
      lng: Number(s.Longitude),
      time: s.Time,
      description: s.Address,
      route: s.route,
      index: s.routeIndex,
      color: getRouteColor(s.route, routeList.indexOf(s.route || ''))
    }));
  }, [stopsForResults, routeList]);

  if (loading) {
    return (
      <div className="premium-card p-24 text-center border-none shadow-none bg-transparent">
        <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-xl font-bold text-slate-900 mb-2">데이터 엔진 최적화 중</p>
        <p className="text-slate-400 font-medium">실시간 전국 셔틀 정보를 동기화하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Search Console */}
      <section className="premium-card p-5 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between items-start gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">셔틀 노선 조회</h2>
                        <p className="text-sm font-semibold text-slate-400">원하시는 물류센터와 근무조를 선택해 실시간 조회를 시작하세요.</p>
                    </div>
                </div>

                {selectedFC && (
                    <a 
                        href={`https://coufc.coupang.com/${selectedFC.toLowerCase()}/shuttle`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md transition-all uppercase tracking-wider"
                    >
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Official Shuttle Page
                    </a>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="group space-y-3">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Center Division</label>
                <div className="relative">
                    <select 
                    className="premium-input appearance-none pr-12 cursor-pointer"
                    value={selectedFC}
                    onChange={(e) => {
                        setSelectedFC(e.target.value);
                        setSelectedShift('');
                        setSelectedRoute('');
                    }}
                    >
                    <option value="">물류센터를 선택하세요</option>
                    {fcList.map(fc => (
                        <option key={fc.code} value={fc.code}>{fc.name}</option>
                    ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="group space-y-3">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Service Shift</label>
                <div className="relative">
                    <select 
                    className="premium-input appearance-none pr-12 cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
                    value={selectedShift}
                    disabled={!selectedFC}
                    onChange={(e) => {
                        setSelectedShift(e.target.value);
                        setSelectedRoute('');
                    }}
                    >
                    {shiftList.map(shift => (
                        <option key={shift} value={shift}>{shift}</option>
                    ))}
                    <option value="">전체 근무조</option>
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="group space-y-3">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-1">Route Segment</label>
                <div className="relative">
                    <select 
                    className="premium-input appearance-none pr-12 cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
                    value={selectedRoute}
                    disabled={!selectedFC}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    >
                    <option value="">전체 운행 노선</option>
                    {routeList.map(route => (
                        <option key={route} value={route}>{route}</option>
                    ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
            </div>
        </div>
      </section>

      {/* Map Display */}
      <section className="kakao-map-container relative mx-[-4px] sm:mx-0">
          <div className="h-[550px] w-full relative group">
            <KakaoMapWrapper stops={mapStops.length > 0 ? mapStops : []} />
            {!selectedFC && (
              <div className="absolute inset-0 glass-effect z-10 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white max-w-md relative overflow-hidden group/box">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover/box:scale-110 transition-transform duration-500">
                        <span className="text-4xl">🗺️</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-2xl mb-3 tracking-tight">물류센터를 선택해주세요</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        상단에서 물류센터를 먼저 선택하시면,<br />
                        해당 지역의 모든 셔틀 노선이 지도에 즉시 표시됩니다.
                    </p>
                 </div>
              </div>
            )}
            
            {/* Legend / Overlay */}
            {data && selectedFC && (
                <div className="absolute top-6 left-6 z-20 hidden md:block">
                    <div className="glass-effect px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-sm font-black text-slate-800 tracking-tight">{data[selectedFC]?.center?.name} - {selectedShift || '전체'}</span>
                    </div>
                </div>
            )}
          </div>
      </section>

      {/* Results Section */}
      <section className="premium-card overflow-hidden">
        <div className="px-6 sm:px-10 py-6 sm:py-8 bg-slate-50/50 backdrop-blur-sm border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Station Chronology</h3>
                   <p className="text-xs font-bold text-slate-400 mt-0.5">운행 순서 및 상세 도착 시간 안내</p>
                </div>
            </div>
            {data && selectedFC && data[selectedFC] && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{selectedFC} DB CONNECTED</span>
                </div>
            )}
        </div>
        
        {/* Mobile-Optimized List (visible only on mobile) */}
        <div className="md:hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto relative">
          {stopsForResults.length > 0 ? (
            stopsForResults.map((stop, index) => (
              <div key={`${stop.route}-${index}`} className="p-5 space-y-3 hover:bg-indigo-50/30 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-300 font-outfit">
                      {String(stop.routeIndex).padStart(2, '0')}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base uppercase tracking-tight">{stop.Name}</h4>
                  </div>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50 font-outfit">
                    {stop.Time}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="px-2.5 py-0.5 bg-slate-900 text-white rounded-md text-[9px] font-black tracking-widest uppercase">
                    {stop.route}
                  </div>
                  <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">{stop.shift}</span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {stop.Address}
                </p>

                {stop.Info && (
                  <div className="flex items-start gap-2 text-[10px] text-orange-600 font-bold bg-orange-50/50 p-2 rounded-lg border border-orange-100 italic">
                    <span>🔔</span>
                    <span className="leading-tight">{stop.Info}</span>
                  </div>
                )}
              </div>
            ))
          ) : (
             <div className="py-20 text-center px-6">
                <p className="text-slate-900 font-black text-lg tracking-tight">조회된 노선이 없습니다</p>
                <p className="text-slate-400 text-xs font-medium mt-2">물류센터와 근무조를 선택해 주세요.</p>
             </div>
          )}
        </div>

        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block overflow-auto max-h-[550px] relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50/95 backdrop-blur-md text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-200 shadow-sm">
                <th className="pl-10 pr-4 py-6 w-20 text-center">SEQ</th>
                <th className="px-6 py-6 w-40">Timing</th>
                <th className="px-6 py-6">Station / Hub Name</th>
                <th className="px-6 py-6">Route Segment</th>
                <th className="px-6 py-6 pr-10">Location Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {stopsForResults.length > 0 ? (
                stopsForResults.map((stop, index) => (
                  <tr key={`${stop.route}-${index}`} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="pl-10 pr-4 py-6 text-center">
                        <span className="text-sm font-black text-slate-300 group-hover:text-indigo-400 transition-colors font-outfit">
                            {String(stop.routeIndex).padStart(2, '0')}
                        </span>
                    </td>
                    <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100/50 shadow-sm group-hover:scale-105 transition-transform font-outfit">
                                {stop.Time}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-6">
                        <div className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-indigo-900 transition-colors uppercase">{stop.Name}</div>
                    </td>
                    <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                            <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black inline-block tracking-widest w-fit">
                                {stop.route}
                            </div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter ml-0.5">{stop.shift}</span>
                        </div>
                    </td>
                    <td className="px-6 py-6 pr-10">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
                                {stop.Address}
                            </div>
                            {stop.Info && (
                                <div className="flex items-start gap-2 text-[11px] text-orange-600 font-bold bg-orange-50/50 p-2.5 rounded-xl border border-orange-100 w-fit">
                                    <span className="animate-bounce">🔔</span>
                                    <span className="leading-tight">{stop.Info}</span>
                                </div>
                            )}
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 max-w-xs mx-auto">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <span className="text-5xl grayscale opacity-30">🚍</span>
                        </div>
                        <p className="text-slate-900 font-black text-xl tracking-tight">조회된 노선이 없습니다</p>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            물류센터와 근무조를 선택하시면 상세 정류장 목록이 이곳에 나타납니다.
                        </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
