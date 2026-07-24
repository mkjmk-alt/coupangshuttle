'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ShuttleStop } from '../types/shuttle';
import { getRouteColor } from '../utils/color';
import { loadInitialShuttleData, loadShuttleCenter } from '../utils/shuttleDataLoader';
import CoupangBanner from './CoupangBanner';

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

// Window 객체 타입 선언 (TypeScript 오류 방지)
declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    handleAdSuccess?: () => void;
  }
}

interface CompareItem {
  fcCode: string;
  fcName: string;
  shift: string;
  route: string;
}

export default function ShuttleExplorer() {
  const [data, setData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState('');
  const [usesCenterFiles, setUsesCenterFiles] = useState(false);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerLoadError, setCenterLoadError] = useState('');
  const loadedCenters = useRef(new Set<string>());
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  // 비교 기능 관련 상태
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [unlockedTimeLeft, setUnlockedTimeLeft] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    loadInitialShuttleData<ShuttleData>()
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setDataVersion(result.version);
        setUsesCenterFiles(result.usesCenterFiles);
        if (!result.usesCenterFiles) {
          loadedCenters.current = new Set(Object.keys(result.data));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error loading shuttle data:', err);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFC || !usesCenterFiles || loadedCenters.current.has(selectedFC)) {
      setCenterLoading(false);
      setCenterLoadError('');
      return;
    }

    const controller = new AbortController();
    setCenterLoading(true);
    setCenterLoadError('');

    loadShuttleCenter<FCCard>(selectedFC, dataVersion, controller.signal)
      .then((center) => {
        loadedCenters.current.add(selectedFC);
        setData((current) => current ? { ...current, [selectedFC]: center } : current);
        setCenterLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(`Error loading shuttle center ${selectedFC}:`, err);
        setCenterLoadError('센터 노선 정보를 불러오지 못했습니다. 잠시 후 다시 선택해주세요.');
        setCenterLoading(false);
      });

    return () => controller.abort();
  }, [selectedFC, usesCenterFiles, dataVersion]);

  // 잠금 해제 상태 복구 및 주기적 기한 체크
  useEffect(() => {
    const checkUnlockStatus = () => {
      const expiry = localStorage.getItem('compare_unlocked_until');
      if (expiry) {
        const timeDiff = Number(expiry) - Date.now();
        if (timeDiff > 0) {
          setUnlocked(true);
          
          // 남은 시간 포맷팅 (시간:분)
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          if (hours > 0) {
            setUnlockedTimeLeft(`${hours}시간 ${minutes}분 남음`);
          } else {
            setUnlockedTimeLeft(`${minutes}분 남음`);
          }
        } else {
          setUnlocked(false);
          setCompareMode(false);
          localStorage.removeItem('compare_unlocked_until');
          setUnlockedTimeLeft('');
        }
      } else {
        setUnlocked(false);
        setUnlockedTimeLeft('');
      }
    };

    checkUnlockStatus();
    const interval = setInterval(checkUnlockStatus, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, []);

  // 앱(React Native) 및 웹 통합 광고 완료 수신 리스너 등록
  useEffect(() => {
    const handleAdCompletion = () => {
      console.log('AdMob/Mission: Success event triggered.');
      unlockFeature();
    };

    // 웹 메시지 이벤트 리스너 (React Native의 postMessage 수신용)
    const handleWebViewMessage = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(event.data);
        if (messageData.type === 'AD_REWARD_SUCCESS') {
          handleAdCompletion();
        }
      } catch (e) {
        // 일반 메시지는 패스
      }
    };

    // 전역 브릿지 함수 등록 (호환성 보장)
    window.handleAdSuccess = handleAdCompletion;
    window.addEventListener('message', handleWebViewMessage);
    document.addEventListener('message', handleWebViewMessage as any); // 안드로이드 호환용

    return () => {
      window.removeEventListener('message', handleWebViewMessage);
      document.removeEventListener('message', handleWebViewMessage as any);
      delete window.handleAdSuccess;
    };
  }, []);

  // 기능 잠금 해제 실행 (1시간 부여)
  const unlockFeature = () => {
    const expireTime = Date.now() + 1 * 60 * 60 * 1000;
    localStorage.setItem('compare_unlocked_until', String(expireTime));
    setUnlocked(true);
    setShowAdModal(false);
    
    // 즉시 남은 시간 업데이트
    setUnlockedTimeLeft('60분 남음');
    
    alert('🎉 다중 노선 비교 기능이 1시간 동안 잠금 해제되었습니다!');
  };

  // 1단계 미션: 쿠팡 간식 쇼핑 클릭 미션 완료 처리
  const handleCoupangMissionClick = () => {
    // 쿠팡 파트너스 간식 링크 새창으로 열기
    window.open('https://link.coupang.com/a/emtytil65c', '_blank');
    
    // 미션 수행이 확인되면 즉시 해제 (간단한 클릭 보상)
    setTimeout(() => {
      unlockFeature();
    }, 1000);
  };

  // 앱 광고 요청 트리거
  const handleAppAdRequest = () => {
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      // 앱에 광고 보여주기 요청 전송
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHOW_REWARD_AD' }));
    } else {
      // 앱이 아니면 쿠팡 미션 강제 수행
      handleCoupangMissionClick();
    }
  };

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
        return Object.keys(shifts[selectedShift] || {}).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
    }
    if (!shifts) return [];
    const allRoutes = new Set<string>();
    Object.values(shifts).forEach(routes => {
        Object.keys(routes).forEach(r => allRoutes.add(r));
    });
    return Array.from(allRoutes).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
  }, [data, selectedFC, selectedShift]);

  // Handle auto-selecting the first route when center or shift changes
  useEffect(() => {
    if (routeList.length > 0 && !selectedRoute) {
      setSelectedRoute(routeList[0]);
    } else if (routeList.length > 0 && !routeList.includes(selectedRoute)) {
      setSelectedRoute(routeList[0]);
    } else if (routeList.length === 0) {
      setSelectedRoute('');
    }
  }, [routeList, selectedRoute]);

  // 비교함 추가 처리
  const handleAddToCompare = () => {
    if (!selectedFC || !selectedRoute) return;
    
    const fcName = data?.[selectedFC]?.center?.name || selectedFC;
    const isExist = compareList.some(
      item => item.fcCode === selectedFC && item.shift === selectedShift && item.route === selectedRoute
    );

    if (isExist) {
      alert('이미 비교함에 추가된 노선입니다.');
      return;
    }

    if (compareList.length >= 5) {
      alert('비교는 최대 5개 노선까지만 가능합니다.');
      return;
    }

    setCompareList([
      ...compareList,
      {
        fcCode: selectedFC,
        fcName,
        shift: selectedShift || '전체',
        route: selectedRoute
      }
    ]);
  };

  // 비교함 개별 삭제
  const handleRemoveFromCompare = (index: number) => {
    const newList = [...compareList];
    newList.splice(index, 1);
    setCompareList(newList);
    if (newList.length < 2) {
      setCompareMode(false);
    }
  };

  // 비교하기 모드 작동 제어 (광고 게이트 체크)
  const handleStartComparison = () => {
    if (compareList.length < 2) {
      alert('비교를 수행하려면 최소 2개 이상의 노선을 비교함에 추가해야 합니다.');
      return;
    }

    if (unlocked) {
      setCompareMode(true);
    } else {
      setShowAdModal(true);
    }
  };

  const stopsForResults = useMemo(() => {
    if (!data) return [];
    
    // 1. 비교 모드 활성화 시 다중 노선 데이터 병합
    if (compareMode && compareList.length > 0) {
      const stops: (Stop & { shift: string; route: string; routeIndex: number; fcCode: string; fcName: string })[] = [];
      
      compareList.forEach((item) => {
        const shifts = data[item.fcCode]?.shifts;
        if (!shifts) return;
        
        // 특정 근무조 노선 데이터 추출
        const extractStops = (shiftName: string, routeName: string) => {
          const routeStops = shifts[shiftName]?.[routeName];
          if (routeStops) {
            routeStops.forEach((stop, idx) => {
              stops.push({
                ...stop,
                shift: shiftName,
                route: routeName,
                routeIndex: idx + 1,
                fcCode: item.fcCode,
                fcName: item.fcName
              });
            });
          }
        };

        if (item.shift === '전체') {
          Object.keys(shifts).forEach(shiftName => {
            extractStops(shiftName, item.route);
          });
        } else {
          extractStops(item.shift, item.route);
        }
      });

      // 비교 모드일 때는 시간순(오름차순)으로 전체 정렬하여 제공
      return stops.sort((a, b) => a.Time.localeCompare(b.Time));
    }

    // 2. 일반 단일 노선 조회 모드
    if (!selectedFC) return [];
    const shifts = data[selectedFC]?.shifts;
    if (!shifts) return [];
    const stops: (Stop & { shift: string; route: string; routeIndex: number; fcCode: string; fcName: string })[] = [];

    Object.entries(shifts).forEach(([shiftName, routes]) => {
      if (selectedShift && shiftName !== selectedShift) return;
      Object.entries(routes).forEach(([routeName, routeStops]) => {
        if (!selectedRoute || routeName !== selectedRoute) return;
        routeStops.forEach((stop, idx) => {
          stops.push({
            ...stop,
            shift: shiftName,
            route: routeName,
            routeIndex: idx + 1,
            fcCode: selectedFC,
            fcName: data[selectedFC]?.center?.name || selectedFC
          });
        });
      });
    });
    return stops;
  }, [data, selectedFC, selectedShift, selectedRoute, compareMode, compareList]);

  const mapStops = useMemo((): ShuttleStop[] => {
    return stopsForResults.map((s, idx) => {
      // 비교 모드일 때는 비교 항목 목록의 인덱스로 컬러 결정, 단일일 때는 해당 노선 목록의 인덱스 기준
      const colorIndex = compareMode
        ? compareList.findIndex(item => item.fcCode === s.fcCode && item.shift === s.shift && item.route === s.route)
        : routeList.indexOf(s.route || '');

      return {
        id: `${s.fcCode}-${s.route}-${s.shift}-${idx}`,
        name: s.Name,
        lat: Number(s.Latitude),
        lng: Number(s.Longitude),
        time: s.Time,
        description: s.Address,
        route: s.route,
        index: s.routeIndex,
        color: getRouteColor(s.route, colorIndex >= 0 ? colorIndex : 0)
      };
    });
  }, [stopsForResults, routeList, compareMode, compareList]);

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
                        <p className="text-sm font-semibold text-slate-400">물류센터와 근무조를 선택해 조회를 시작하거나 비교해 보세요.</p>
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
                        Official Page
                    </a>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 items-end">
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
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Route Segment</label>
                        {selectedFC && selectedRoute && (
                          <button
                            onClick={handleAddToCompare}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            ➕ 비교함 추가
                          </button>
                        )}
                    </div>
                    <div className="relative">
                        <select 
                        className="premium-input appearance-none pr-12 cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
                        value={selectedRoute}
                        disabled={!selectedFC}
                        onChange={(e) => setSelectedRoute(e.target.value)}
                        >
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
            {(centerLoading || centerLoadError) && (
              <div
                className={`mt-5 rounded-xl px-4 py-3 text-xs font-bold ${
                  centerLoadError
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}
                role="status"
              >
                {centerLoadError || '선택한 센터의 최신 노선 정보를 불러오는 중입니다...'}
              </div>
            )}
        </div>
      </section>

      {/* 비교함 리스트 패널 */}
      {compareList.length > 0 && (
        <section className="premium-card p-5 sm:p-8 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 border-indigo-100/30 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">노선 비교함</span>
                <span className="text-xs text-slate-400 font-bold">({compareList.length}/5 개 선택됨)</span>
                {unlocked && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    🔓 프리미엄 해제됨 ({unlockedTimeLeft})
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs font-semibold">동시에 여러 노선을 선택해 지도에 한눈에 시각화해 비교할 수 있습니다.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {compareMode ? (
                <button
                  onClick={() => setCompareMode(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  비교 모드 해제
                </button>
              ) : (
                <button
                  onClick={handleStartComparison}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black hover:opacity-95 transition-opacity shadow-md shadow-indigo-100 cursor-pointer"
                >
                  비교 시작하기
                </button>
              )}
              <button
                onClick={() => {
                  setCompareList([]);
                  setCompareMode(false);
                }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors cursor-pointer"
              >
                비우기
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            {compareList.map((item, idx) => (
              <div 
                key={`${item.fcCode}-${item.shift}-${item.route}`}
                className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 animate-in fade-in duration-300"
              >
                {/* 노선 고유 컬러 칩 */}
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getRouteColor(item.route, idx) }}></span>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 leading-none">{item.fcName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-1">{item.shift} - {item.route}</div>
                </div>
                <button
                  onClick={() => handleRemoveFromCompare(idx)}
                  className="text-slate-300 hover:text-red-500 transition-colors font-bold text-xs ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Map Display */}
      <section className="kakao-map-container relative mx-[-4px] sm:mx-0">
          <div className="h-[550px] w-full relative group">
            <KakaoMapWrapper stops={mapStops.length > 0 ? mapStops : []} />
            {(!compareMode && !selectedFC) && (
              <div className="absolute inset-0 glass-effect z-10 flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                 <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white max-w-md relative overflow-hidden group/box">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover/box:scale-110 transition-transform duration-500">
                        <span className="text-4xl">🗺️</span>
                    </div>
                    <h3 className="font-black text-slate-900 text-2xl mb-3 tracking-tight">물류센터를 선택해주세요</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        상단에서 물류센터를 먼저 선택하시면,<br />
                        해당 지역의 상세 셔틀 노선이 지도에 표시됩니다.
                    </p>
                 </div>
              </div>
            )}
            
            {/* Legend / Overlay */}
            {data && (selectedFC || compareMode) && (
                <div className="absolute top-6 left-6 z-20 hidden md:block">
                    <div className="glass-effect px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-sm font-black text-slate-800 tracking-tight">
                          {compareMode ? `노선 비교 모드 (${compareList.length}개 노선)` : `${data[selectedFC]?.center?.name} - ${selectedShift || '전체'}`}
                        </span>
                    </div>
                </div>
            )}
          </div>
      </section>

      {/* Premium Coupang Partners Banner (Directly below the map) */}
      <CoupangBanner />

      {/* Results Section */}
      <section className="premium-card overflow-hidden">
        <div className="px-6 sm:px-10 py-6 sm:py-8 bg-slate-50/50 backdrop-blur-sm border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">
                     {compareMode ? 'Integrated Station Chronology' : 'Station Chronology'}
                   </h3>
                   <p className="text-xs font-bold text-slate-400 mt-0.5">
                     {compareMode ? '비교 선택한 전체 노선의 통합 운행 시간표 (시간순 정렬)' : '운행 순서 및 상세 도착 시간 안내'}
                   </p>
                </div>
            </div>
            {data && (selectedFC || compareMode) && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {compareMode ? 'COMPARISON ACTIVE' : `${selectedFC} DB CONNECTED`}
                    </span>
                </div>
            )}
        </div>
        
        {/* Mobile-Optimized List (visible only on mobile) */}
        <div className="md:hidden divide-y divide-slate-100 max-h-[500px] overflow-y-auto relative">
          {stopsForResults.length > 0 ? (
            stopsForResults.map((stop, index) => {
              // 비교 모드 인덱스
              const cIdx = compareMode 
                ? compareList.findIndex(item => item.fcCode === stop.fcCode && item.shift === stop.shift && item.route === stop.route)
                : -1;
              const routeColor = compareMode && cIdx >= 0 ? getRouteColor(stop.route, cIdx) : undefined;

              return (
                <div key={`${stop.fcCode}-${stop.route}-${index}`} className="p-5 space-y-3 hover:bg-indigo-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-300 font-outfit">
                        {compareMode ? '⏰' : String(stop.routeIndex).padStart(2, '0')}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base uppercase tracking-tight">{stop.Name}</h4>
                    </div>
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50 font-outfit">
                      {stop.Time}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div 
                      className="px-2.5 py-0.5 text-white rounded-md text-[9px] font-black tracking-widest uppercase"
                      style={{ backgroundColor: routeColor || '#0f172a' }}
                    >
                      {compareMode ? `[${stop.fcName}] ${stop.route}` : stop.route}
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
              );
            })
          ) : (
             <div className="py-20 text-center px-6">
                <p className="text-slate-900 font-black text-lg tracking-tight">조회된 노선이 없습니다</p>
                <p className="text-slate-400 text-xs font-medium mt-2">물류센터를 선택하시거나 노선 비교를 시작하세요.</p>
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
                stopsForResults.map((stop, index) => {
                  const cIdx = compareMode 
                    ? compareList.findIndex(item => item.fcCode === stop.fcCode && item.shift === stop.shift && item.route === stop.route)
                    : -1;
                  const routeColor = compareMode && cIdx >= 0 ? getRouteColor(stop.route, cIdx) : undefined;

                  return (
                    <tr key={`${stop.fcCode}-${stop.route}-${index}`} className="group hover:bg-indigo-50/30 transition-all duration-300">
                      <td className="pl-10 pr-4 py-6 text-center">
                          <span className="text-sm font-black text-slate-300 group-hover:text-indigo-400 transition-colors font-outfit">
                              {compareMode ? `${index + 1}` : String(stop.routeIndex).padStart(2, '0')}
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
                              <div 
                                className="px-3 py-1 text-white rounded-lg text-[10px] font-black inline-block tracking-widest w-fit"
                                style={{ backgroundColor: routeColor || '#0f172a' }}
                              >
                                {compareMode ? `[${stop.fcName}] ${stop.route}` : stop.route}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-40 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 max-w-xs mx-auto">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                            <span className="text-5xl grayscale opacity-30">🚍</span>
                        </div>
                        <p className="text-slate-900 font-black text-xl tracking-tight">조회된 노선이 없습니다</p>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            물류센터를 선택하시거나 노선 비교함에 노선을 담아 비교해 보세요.
                        </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ad Gate / Premium Lock Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white overflow-hidden relative group/box">
            {/* Top color bar */}
            <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
            
            <div className="p-8 sm:p-10 text-center">
              {/* Premium Lock Icon */}
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl animate-pulse">🔒</span>
              </div>
              
              <h3 className="font-black text-slate-900 text-2xl mb-4 tracking-tight leading-snug">
                노선 다중 비교 활성화
              </h3>
              
              <p className="text-slate-500 text-sm font-medium leading-relaxed break-keep mb-8">
                동시에 여러 노선을 지도에서 비교하는 기능은 <strong>프리미엄 혜택</strong>입니다. 광고를 시청하거나 미션을 완료하시면 <strong>1시간 동안 무제한</strong>으로 활성화됩니다!
              </p>

              <div className="space-y-3">
                {/* 1. 앱 전용 보상형 광고 시청 버튼 */}
                {typeof window !== 'undefined' && window.ReactNativeWebView ? (
                  <button
                    onClick={handleAppAdRequest}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    📺 동영상 광고 보고 1시간 활성화
                  </button>
                ) : (
                  /* 2. 일반 웹 브라우저 접속 시 쿠팡 미션 버튼 */
                  <button
                    onClick={handleCoupangMissionClick}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    🍿 쿠팡에서 간식 구경하고 1시간 활성화
                  </button>
                )}

                {/* 앱일지라도 쿠팡 미션 대체 선택지를 서브로 제공 */}
                {typeof window !== 'undefined' && window.ReactNativeWebView && (
                  <button
                    onClick={handleCoupangMissionClick}
                    className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    🚀 대체 미션: 쿠팡 간식 링크 구경하기
                  </button>
                )}

                <button
                  onClick={() => setShowAdModal(false)}
                  className="w-full py-3 text-slate-400 hover:text-slate-600 text-xs font-black transition-all cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
