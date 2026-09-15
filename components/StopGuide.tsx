'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { loadInitialShuttleData, loadShuttleCenter } from '@/utils/shuttleDataLoader';
import {
  filterGuideStops,
  getGuideStops,
  type GuideShuttleData,
  type GuideStop,
} from '@/utils/stopGuideData';

const ROUTE_NOTICE =
  '노선과 운행 시각은 참고용이며 변경될 수 있습니다. 탑승 전 소속 센터의 최신 공식 공지를 확인해 주세요.';

const SHIFT_PRIORITY: Record<string, number> = {
  주간조: 1,
  오후조: 2,
};

const ALL_SHIFTS = '__all_shifts__';
const ALL_ROUTES = '__all_routes__';

function getExternalMapLink(stop: GuideStop, key: 'Kakao Map' | 'Naver Map') {
  const link = stop[key];
  return typeof link === 'string' ? link : '';
}

export default function StopGuide() {
  const [data, setData] = useState<GuideShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState('');
  const [usesCenterFiles, setUsesCenterFiles] = useState(false);
  const [centerLoading, setCenterLoading] = useState(false);
  const [centerLoadError, setCenterLoadError] = useState('');
  const loadedCenters = useRef(new Set<string>());
  const [selectedFC, setSelectedFC] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'route' | 'name'>('route');
  const [copiedStopId, setCopiedStopId] = useState('');

  useEffect(() => {
    let cancelled = false;

    loadInitialShuttleData<GuideShuttleData>()
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
      .catch((error) => {
        if (cancelled) return;
        console.error('Error loading stop guide data:', error);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedFC || !usesCenterFiles || loadedCenters.current.has(selectedFC)) return;

    const controller = new AbortController();

    loadShuttleCenter<GuideShuttleData[string]>(selectedFC, dataVersion, controller.signal)
      .then((center) => {
        loadedCenters.current.add(selectedFC);
        setData((current) => (current ? { ...current, [selectedFC]: center } : current));
        setCenterLoading(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(`Error loading stop guide center ${selectedFC}:`, error);
        setCenterLoadError('선택한 센터의 정류장 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setCenterLoading(false);
      });

    return () => controller.abort();
  }, [selectedFC, usesCenterFiles, dataVersion]);

  const fcList = useMemo(() => {
    if (!data) return [];
    return Object.keys(data)
      .map((code) => ({ code, name: data[code]?.center?.name || code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR', { numeric: true }));
  }, [data]);

  const shiftList = useMemo(() => {
    if (!data || !selectedFC) return [];
    return Object.keys(data[selectedFC]?.shifts || {}).sort((a, b) => {
      const priorityA = SHIFT_PRIORITY[a] || 3;
      const priorityB = SHIFT_PRIORITY[b] || 3;
      return priorityA === priorityB
        ? a.localeCompare(b, 'ko-KR', { numeric: true })
        : priorityA - priorityB;
    });
  }, [data, selectedFC]);

  const activeShift = selectedShift === ALL_SHIFTS
    ? ''
    : shiftList.includes(selectedShift)
      ? selectedShift
      : shiftList[0] || '';

  const routeList = useMemo(() => {
    if (!data || !selectedFC) return [];
    const shifts = data[selectedFC]?.shifts;
    if (!shifts) return [];

    if (activeShift) {
      return Object.keys(shifts[activeShift] || {}).sort((a, b) =>
        a.localeCompare(b, 'ko-KR', { numeric: true }),
      );
    }

    const allRoutes = new Set<string>();
    Object.values(shifts).forEach((routes) => Object.keys(routes).forEach((route) => allRoutes.add(route)));
    return Array.from(allRoutes).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
  }, [activeShift, data, selectedFC]);

  const activeRoute = selectedRoute === ALL_ROUTES
    ? ''
    : routeList.includes(selectedRoute)
      ? selectedRoute
      : routeList[0] || '';

  const selectedStops = useMemo(
    () => getGuideStops(data, selectedFC, activeShift, activeRoute),
    [activeRoute, activeShift, data, selectedFC],
  );

  const visibleStops = useMemo(() => {
    const filtered = filterGuideStops(selectedStops, searchQuery);
    if (sortMode === 'name') {
      return [...filtered].sort((a, b) => a.Name.localeCompare(b.Name, 'ko-KR', { numeric: true }));
    }
    return filtered;
  }, [searchQuery, selectedStops, sortMode]);

  const selectedCenterName = selectedFC ? data?.[selectedFC]?.center?.name || selectedFC : '';

  const handleCopyAddress = async (stop: GuideStop) => {
    const text = `${stop.Name}\n${stop.Address}`;
    try {
      await navigator.clipboard.writeText(text);
      const id = `${stop.fcCode}-${stop.shift}-${stop.route}-${stop.routeIndex}`;
      setCopiedStopId(id);
      window.setTimeout(() => setCopiedStopId(''), 1800);
    } catch {
      window.prompt('정류장 정보를 복사해 주세요.', text);
    }
  };

  if (loading) {
    return (
      <main className="stop-guide-page">
        <section className="premium-card stop-guide-loading" aria-live="polite">
          <div className="stop-guide-spinner" aria-hidden="true" />
          <h1>정류장 안내를 준비하고 있습니다</h1>
          <p>{ROUTE_NOTICE}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="stop-guide-page">
      <header className="stop-guide-hero">
        <p className="eyebrow">정류장 이용</p>
        <h1>정류장 안내</h1>
        <p className="stop-guide-lead">지도 없이 정류장명·주소·탑승 시각을 빠르게 확인하세요.</p>
        <p className="stop-guide-sublead">센터와 노선을 고르면 글로 읽기 편한 정류장 목록을 보여드립니다.</p>
      </header>

      <section className="premium-card stop-guide-card">
        <div className="stop-guide-card-heading">
          <div className="stop-guide-heading-icon" aria-hidden="true">⌕</div>
          <div>
            <h2>정류장 찾기</h2>
            <p>물류센터, 근무조, 노선을 순서대로 선택해 주세요.</p>
          </div>
        </div>

        <div className="stop-guide-fields">
          <label>
            <span>1. 물류센터</span>
            <select
              className="premium-input"
              value={selectedFC}
              onChange={(event) => {
                const nextFC = event.target.value;
                const shouldLoadCenter = Boolean(
                  nextFC && usesCenterFiles && !loadedCenters.current.has(nextFC),
                );
                setSelectedFC(nextFC);
                setSelectedShift('');
                setSelectedRoute('');
                setSearchQuery('');
                setCenterLoadError('');
                setCenterLoading(shouldLoadCenter);
              }}
            >
              <option value="">조회할 물류센터를 선택하세요</option>
              {fcList.map((fc) => <option key={fc.code} value={fc.code}>{fc.name}</option>)}
            </select>
          </label>

          <label>
            <span>2. 근무조</span>
            <select
              className="premium-input"
              value={selectedShift || activeShift}
              disabled={!selectedFC}
              onChange={(event) => {
                setSelectedShift(event.target.value);
                setSelectedRoute('');
              }}
            >
              {shiftList.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
              {selectedFC && <option value={ALL_SHIFTS}>모든 근무조</option>}
            </select>
          </label>

          <label>
            <span>3. 노선</span>
            <select
              className="premium-input"
              value={selectedRoute || activeRoute}
              disabled={!selectedFC}
              onChange={(event) => {
                setSelectedRoute(event.target.value);
                setSearchQuery('');
              }}
            >
              {routeList.map((route) => <option key={route} value={route}>{route}</option>)}
              {selectedFC && <option value={ALL_ROUTES}>모든 노선</option>}
            </select>
          </label>
        </div>

        {(centerLoading || centerLoadError) && (
          <div className={`stop-guide-status ${centerLoadError ? 'is-error' : ''}`} role="status">
            {centerLoadError || '선택한 센터의 정류장 정보를 불러오고 있습니다.'}
          </div>
        )}

        <p className="route-search-notice" role="note">{ROUTE_NOTICE}</p>
      </section>

      <section className="premium-card stop-guide-results">
        <div className="stop-guide-results-heading">
          <div>
            <p className="eyebrow">조회 결과</p>
            <h2>{selectedFC ? `${selectedCenterName} 정류장` : '정류장 목록'}</h2>
            <p>
              {selectedFC
                ? `${activeShift || '모든 근무조'} · ${activeRoute || '모든 노선'} 조건으로 확인 중입니다.`
                : '먼저 물류센터와 노선을 선택해 주세요.'}
            </p>
          </div>
          {selectedFC && selectedStops.length > 0 && (
            <span className="stop-guide-count">{visibleStops.length}개 표시</span>
          )}
        </div>

        {selectedFC && selectedStops.length > 0 ? (
          <>
            <div className="stop-guide-tools">
              <label className="stop-guide-search">
                <span className="sr-only">정류장 검색</span>
                <input
                  className="premium-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="정류장명·주소로 검색"
                />
              </label>
              <label className="stop-guide-sort">
                <span>정렬</span>
                <select className="premium-input" value={sortMode} onChange={(event) => setSortMode(event.target.value as 'route' | 'name')}>
                  <option value="route">노선 순서순</option>
                  <option value="name">정류장명순</option>
                </select>
              </label>
            </div>

            {visibleStops.length > 0 ? (
              <ol className="stop-guide-list">
                {visibleStops.map((stop) => {
                  const stopId = `${stop.fcCode}-${stop.shift}-${stop.route}-${stop.routeIndex}`;
                  const kakaoLink = getExternalMapLink(stop, 'Kakao Map');
                  const naverLink = getExternalMapLink(stop, 'Naver Map');
                  const note = stop.Remarks || stop.Info;

                  return (
                    <li key={stopId} className="stop-guide-item">
                      <div className="stop-guide-order" aria-label={`${stop.routeIndex}번째 정류장`}>
                        {String(stop.routeIndex).padStart(2, '0')}
                      </div>
                      <div className="stop-guide-item-body">
                        <div className="stop-guide-item-meta">
                          <span className="stop-guide-time">{stop.Time}</span>
                          <span className="stop-guide-route">{stop.route}</span>
                          <span className="stop-guide-shift">{stop.shift}</span>
                        </div>
                        <h3>{stop.Name}</h3>
                        <p>{stop.Address || '주소 정보가 없습니다.'}</p>
                        {note && <div className="stop-guide-note">{note}</div>}
                      </div>
                      <div className="stop-guide-item-actions">
                        <button type="button" onClick={() => handleCopyAddress(stop)}>
                          {copiedStopId === stopId ? '복사됨' : '주소 복사'}
                        </button>
                        {kakaoLink && <a href={kakaoLink} target="_blank" rel="noopener noreferrer">카카오맵</a>}
                        {!kakaoLink && naverLink && <a href={naverLink} target="_blank" rel="noopener noreferrer">지도 보기</a>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="stop-guide-empty">
                <strong>검색 결과가 없습니다.</strong>
                <p>정류장명이나 주소의 일부만 입력해 다시 검색해 보세요.</p>
              </div>
            )}
          </>
        ) : (
          <div className="stop-guide-empty">
            <span aria-hidden="true">📍</span>
            <strong>{selectedFC ? '표시할 정류장이 없습니다.' : '먼저 물류센터를 선택해 주세요.'}</strong>
            <p>{selectedFC ? '선택한 센터·근무조·노선의 데이터가 아직 없습니다.' : '선택 조건에 맞는 정류장과 주소를 글로 확인할 수 있습니다.'}</p>
          </div>
        )}
      </section>
    </main>
  );
}
