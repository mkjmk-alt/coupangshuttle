'use client';

import { useState, useEffect, useMemo } from 'react';

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

export default function ShuttleDashboard() {
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
    if (!data || !selectedFC) return [];
    const shifts = data[selectedFC].shifts;
    if (selectedShift) {
        return Object.keys(shifts[selectedShift] || {}).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
    }
    // If no shift selected, show all routes across all shifts
    const allRoutes = new Set<string>();
    Object.values(shifts).forEach(routes => {
        Object.keys(routes).forEach(r => allRoutes.add(r));
    });
    return Array.from(allRoutes).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
  }, [data, selectedFC, selectedShift]);

  const tableData = useMemo(() => {
    if (!data || !selectedFC) return [];
    const shifts = data[selectedFC].shifts;
    let stops: (Stop & { shift: string; route: string })[] = [];

    Object.entries(shifts).forEach(([shiftName, routes]) => {
      if (selectedShift && shiftName !== selectedShift) return;
      
      Object.entries(routes).forEach(([routeName, routeStops]) => {
        if (selectedRoute && routeName !== selectedRoute) return;
        
        routeStops.forEach(stop => {
          stops.push({ ...stop, shift: shiftName, route: routeName });
        });
      });
    });

    return stops;
  }, [data, selectedFC, selectedShift, selectedRoute]);

  if (loading) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">실시간 셔틀 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-gray-700">1. 센터 선택</label>
          <select 
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedFC}
            onChange={(e) => {
                setSelectedFC(e.target.value);
                setSelectedShift('');
                setSelectedRoute('');
            }}
          >
            <option value="">센터를 선택하세요</option>
            {fcList.map(fc => (
              <option key={fc.code} value={fc.code}>{fc.name} [{fc.code}]</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-gray-700">2. 근무조(선택)</label>
          <select 
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            value={selectedShift}
            disabled={!selectedFC}
            onChange={(e) => {
                setSelectedShift(e.target.value);
                setSelectedRoute('');
            }}
          >
            <option value="">전체 근무조</option>
            {shiftList.map(shift => (
              <option key={shift} value={shift}>{shift}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-gray-700">3. 노선 선택</label>
          <select 
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            value={selectedRoute}
            disabled={!selectedFC}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            <option value="">전체 노선</option>
            {routeList.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Result */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
            <h3 className="font-bold text-indigo-900">정류장 상세 목록 {tableData.length > 0 && `(${tableData.length}개)`}</h3>
            {selectedFC && <span className="text-sm text-indigo-600 font-medium">{data?.[selectedFC]?.center?.name}</span>}
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wider font-bold">
                <th className="p-4 border-b">시간</th>
                <th className="p-4 border-b">정류장명</th>
                <th className="p-4 border-b">노선</th>
                <th className="p-4 border-b">위치/상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableData.length > 0 ? (
                tableData.map((stop, index) => (
                  <tr key={`${stop.route}-${index}`} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{stop.Time}</td>
                    <td className="p-4 font-semibold text-gray-900">{stop.Name}</td>
                    <td className="p-4 text-sm text-gray-500">
                        <span className="block font-medium text-gray-700">{stop.route}</span>
                        <span className="text-xs">{stop.shift}</span>
                    </td>
                    <td className="p-4">
                        <div className="text-sm text-gray-600 mb-1">{stop.Address}</div>
                        {stop.Info && <div className="text-xs text-orange-600 font-medium">📢 {stop.Info}</div>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-gray-400">
                    {selectedFC ? '선택한 노선에 정류장 데이터가 없습니다.' : '센터를 선택하면 정류장 목록이 표시됩니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
