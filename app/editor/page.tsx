'use client';

import { FormEvent, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  'Distance (km)'?: number | string;
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

interface RoutePatch {
  fc: string;
  shift: string;
  route: string;
  stops: Stop[];
}

interface ShuttleMetadata {
  lastUpdated?: string | null;
  lastAutoDeploy?: string | null;
  lastManualChange?: string | null;
}

interface ChangeStats {
  centersAdded: number;
  centersRemoved: number;
  centersChanged: number;
  routesAdded: number;
  routesRemoved: number;
  routesChanged: number;
  stopsAdded: number;
  stopsRemoved: number;
  stopsChanged: number;
}

interface AffectedRoute {
  fc: string;
  shift: string;
  route: string;
  change: 'added' | 'removed' | 'changed';
}

interface StopChange {
  fc: string;
  shift: string;
  route: string;
  change: 'added' | 'removed' | 'changed';
  changedFields: string[];
  before: Stop | null;
  after: Stop | null;
}

interface ChangeLogEntry {
  id: string;
  timestamp: string;
  source: 'automatic' | 'manual';
  action: 'auto_deploy' | 'manual_save' | 'manual_merge';
  summary: string;
  stats: ChangeStats;
  affectedCenters: string[];
  affectedRoutes: AffectedRoute[];
  stopChanges?: StopChange[];
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  metadata?: ShuttleMetadata;
  changeLogEntry?: ChangeLogEntry;
}

interface RouteError {
  fc: string;
  fcName: string;
  shift: string;
  route: string;
  idx: number;
  stopName?: string;
  type: 'SPEED' | 'TIME' | 'DISTANCE';
  dist: number;
  speed: number;
  timeDiff: number;
}

type AuthStatus = 'checking' | 'locked' | 'authenticated';

const SKIPPED_ERRORS_STORAGE_KEY = 'shuttle_editor_skipped_errors_v1';

function calculateDistance(lat1: string, lon1: string, lat2: string, lon2: string): number {
  const earthRadiusKm = 6371;
  const dLat = (parseFloat(lat2) - parseFloat(lat1)) * Math.PI / 180;
  const dLon = (parseFloat(lon2) - parseFloat(lon1)) * Math.PI / 180;
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(parseFloat(lat1) * Math.PI / 180) * Math.cos(parseFloat(lat2) * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const angle = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return earthRadiusKm * angle;
}

function getSpeedInfo(stop1: Stop, stop2: Stop) {
  const dist = calculateDistance(stop1.Latitude, stop1.Longitude, stop2.Latitude, stop2.Longitude);
  const firstTime = stop1.Time.split(':').map(Number);
  const secondTime = stop2.Time.split(':').map(Number);

  if (firstTime.length !== 2 || secondTime.length !== 2) {
    return { dist, speed: 0, timeDiff: 0 };
  }

  const firstMinutes = firstTime[0] * 60 + firstTime[1];
  let secondMinutes = secondTime[0] * 60 + secondTime[1];
  if (secondMinutes < firstMinutes) secondMinutes += 1440;

  const timeDiff = secondMinutes - firstMinutes;
  if (timeDiff <= 0) return { dist, speed: 999, timeDiff };

  return { dist, speed: (dist / timeDiff) * 60, timeDiff };
}

function routeErrorKey(error: RouteError): string {
  return [
    error.fc,
    error.shift,
    error.route,
    error.idx,
    error.type,
    error.timeDiff,
    error.dist.toFixed(4),
  ].join('|');
}

function collectRouteErrors(
  data: ShuttleData,
  speedThreshold: number,
  distThreshold: number,
): RouteError[] {
  const errors: RouteError[] = [];

  Object.entries(data).forEach(([fcCode, fcCard]) => {
    Object.entries(fcCard.shifts || {}).forEach(([shiftName, routes]) => {
      Object.entries(routes).forEach(([routeName, stops]) => {
        stops.forEach((stop, index) => {
          if (index === 0) return;

          const info = getSpeedInfo(stops[index - 1], stop);
          const isSpeed = info.speed > speedThreshold && info.speed <= 900;
          const isTime = info.speed > 900;
          const isShortDistance = info.dist > 0 && info.dist <= (distThreshold / 1000);

          if (!isSpeed && !isTime && !isShortDistance) return;

          errors.push({
            fc: fcCode,
            fcName: fcCard.center?.name || fcCode,
            shift: shiftName,
            route: routeName,
            idx: index,
            stopName: stop.Name,
            type: isTime ? 'TIME' : isShortDistance ? 'DISTANCE' : 'SPEED',
            ...info,
          });
        });
      });
    });
  });

  return errors;
}

async function verifyEditorKey(editorKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/save-data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-editor-key': editorKey,
      },
      body: JSON.stringify({ type: 'verify' }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function normalizeMetadata(metadata: ShuttleMetadata): ShuttleMetadata {
  return {
    ...metadata,
    lastAutoDeploy: metadata.lastAutoDeploy ?? metadata.lastUpdated ?? null,
    lastManualChange: metadata.lastManualChange ?? null,
  };
}

function UpdateStatusCards({ metadata }: { metadata: ShuttleMetadata }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-[1.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
              Latest Automatic Deploy
            </p>
            <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
              {(metadata.lastAutoDeploy ?? metadata.lastUpdated)?.replace(/-/g, '.') ?? '기록 없음'}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white shadow-lg shadow-indigo-100">
            🚀
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400">
          원클릭 자동배포로 공식 셔틀 데이터가 마지막 반영된 시각
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
              Latest Manual Change
            </p>
            <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
              {metadata.lastManualChange?.replace(/-/g, '.') ?? '기록 없음'}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-xl text-white shadow-lg shadow-amber-100">
            ✍️
          </div>
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-400">
          관리자 저장 또는 수동 머지로 마지막 변경된 시각
        </p>
      </div>
    </section>
  );
}

const STOP_FIELD_LABELS: Record<string, string> = {
  'Center (EN)': '센터 코드',
  Shift: '근무조',
  'Route Name': '노선명',
  Order: '순번',
  Type: '구분',
  Time: '시간',
  Name: '정류장명',
  Address: '주소',
  Latitude: '위도',
  Longitude: '경도',
  'Image URL': '이미지 URL',
  Remarks: '비고',
  'Naver Map': '네이버 지도',
  'Kakao Map': '카카오 지도',
  'Kakao Place ID': '카카오 장소 ID',
  'Distance (km)': '거리(km)',
};

function formatStopValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function StopSnapshot({
  title,
  stop,
  changedFields,
  tone,
}: {
  title: string;
  stop: Stop | null;
  changedFields: string[];
  tone: 'before' | 'after';
}) {
  const toneClasses = tone === 'before'
    ? 'border-rose-100 bg-rose-50/50 text-rose-700'
    : 'border-emerald-100 bg-emerald-50/50 text-emerald-700';

  return (
    <section className={`rounded-2xl border p-3 ${toneClasses}`}>
      <h4 className="text-xs font-black">{title}</h4>
      {!stop ? (
        <p className="mt-3 rounded-xl border border-dashed border-current/20 bg-white/50 px-3 py-5 text-center text-xs font-bold opacity-70">
          데이터 없음
        </p>
      ) : (
        <dl className="mt-3 space-y-1.5">
          {Object.entries(stop).map(([field, value]) => {
            const isChanged = changedFields.includes(field);
            return (
              <div
                key={field}
                className={`grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2 rounded-lg px-2.5 py-2 text-[11px] ${
                  isChanged ? 'bg-white shadow-sm' : 'bg-white/45'
                }`}
              >
                <dt className="font-black text-slate-500">
                  {STOP_FIELD_LABELS[field] ?? field}
                </dt>
                <dd className={`min-w-0 break-all font-semibold ${
                  isChanged ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {formatStopValue(value)}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function ChangeLogPanel({ entries }: { entries: ChangeLogEntry[] }) {
  const stopChangeLabels: Record<StopChange['change'], string> = {
    added: '추가',
    removed: '삭제',
    changed: '변경',
  };
  const actionLabels: Record<ChangeLogEntry['action'], string> = {
    auto_deploy: '자동배포',
    manual_save: '수동 저장',
    manual_merge: '수동 머지',
  };
  const routeChangeLabels: Record<AffectedRoute['change'], string> = {
    added: '추가',
    removed: '삭제',
    changed: '변경',
  };

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-5 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Data Change Log
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">
            데이터 변경 기록
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
          최근 {Math.min(entries.length, 20)}건
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-bold text-slate-500">아직 저장된 변경 기록이 없습니다.</p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            다음 자동배포 또는 수동 변경부터 기록됩니다.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {entries.slice(0, 20).map((entry) => {
            const isAutomatic = entry.source === 'automatic';
            const stopChanges = entry.stopChanges ?? [];
            const routeCount =
              entry.stats.routesAdded + entry.stats.routesRemoved + entry.stats.routesChanged;
            const stopCount =
              entry.stats.stopsAdded + entry.stats.stopsRemoved + entry.stats.stopsChanged;

            return (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                          isAutomatic
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {actionLabels[entry.action]}
                      </span>
                      <time className="text-xs font-black text-slate-500">
                        {entry.timestamp.replace(/-/g, '.')}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-800">{entry.summary}</p>
                  </div>
                  <div className="flex gap-2 text-[10px] font-black text-slate-500">
                    <span className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-100">
                      센터 {entry.affectedCenters.length}
                    </span>
                    <span className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-100">
                      노선 {routeCount}
                    </span>
                    <span className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-100">
                      정류장 {stopCount}
                    </span>
                  </div>
                </div>

                {(entry.affectedCenters.length > 0 ||
                  entry.affectedRoutes.length > 0 ||
                  stopChanges.length > 0) && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer list-none text-xs font-black text-indigo-600">
                      상세 변경 보기
                      <span className="ml-1 inline-block transition-transform group-open:rotate-180">⌄</span>
                    </summary>
                    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
                      {entry.affectedCenters.length > 0 && (
                        <p className="text-xs font-semibold text-slate-500">
                          센터: {entry.affectedCenters.join(', ')}
                        </p>
                      )}
                      {entry.affectedRoutes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {entry.affectedRoutes.map((route, index) => (
                            <div
                              key={`${entry.id}-${route.fc}-${route.shift}-${route.route}-${index}`}
                              className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs border border-slate-100"
                            >
                              <span className="min-w-0 truncate font-bold text-slate-600">
                                {route.fc} · {route.shift} · {route.route}
                              </span>
                              <span className="shrink-0 font-black text-slate-400">
                                {routeChangeLabels[route.change]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {stopChanges.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-black text-slate-700">
                              정류장별 변경 전·후 데이터
                            </p>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                              {stopChanges.length}건
                            </span>
                          </div>
                          {stopChanges.map((change, index) => {
                            const beforeOrder = change.before?.Order;
                            const afterOrder = change.after?.Order;
                            const stopOrder = afterOrder ?? beforeOrder;
                            const stopName = change.after?.Name ?? change.before?.Name ?? '이름 없음';

                            return (
                              <details
                                key={`${entry.id}-stop-${change.fc}-${change.shift}-${change.route}-${index}`}
                                className="rounded-xl border border-amber-100 bg-amber-50/40"
                              >
                                <summary className="cursor-pointer list-none px-3 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-[11px] font-black text-slate-700">
                                        {change.fc} · {change.shift} · {change.route}
                                      </p>
                                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                        {stopOrder ? `#${stopOrder} ` : ''}{stopName}
                                      </p>
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-700 shadow-sm">
                                      {stopChangeLabels[change.change]}
                                    </span>
                                  </div>
                                </summary>
                                <div className="grid grid-cols-1 gap-3 border-t border-amber-100 p-3 xl:grid-cols-2">
                                  <StopSnapshot
                                    title="변경 전"
                                    stop={change.before}
                                    changedFields={change.changedFields}
                                    tone="before"
                                  />
                                  <StopSnapshot
                                    title="변경 후"
                                    stop={change.after}
                                    changedFields={change.changedFields}
                                    tone="after"
                                  />
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EditorContent() {
  const [data, setData] = useState<ShuttleData | null>(null);
  const [persistedData, setPersistedData] = useState<ShuttleData | null>(null);
  const [baseData, setBaseData] = useState<ShuttleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFC, setSelectedFC] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [highlightedStopIndex, setHighlightedStopIndex] = useState<number | null>(null);
  const [routeSearch, setRouteSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [speedThreshold, setSpeedThreshold] = useState(100);
  const [distThreshold, setDistThreshold] = useState(500);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [editorKey, setEditorKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [metadata, setMetadata] = useState<ShuttleMetadata>({});
  const [changeLogEntries, setChangeLogEntries] = useState<ChangeLogEntry[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorFilter, setErrorFilter] = useState<'ALL' | 'SPEED' | 'TIME' | 'DISTANCE'>('ALL');
  const [skippedErrorKeys, setSkippedErrorKeys] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    const loadPublicStatus = async () => {
      try {
        const [metadataResponse, changeLogResponse] = await Promise.all([
          fetch('/data/shuttle_meta.json', { cache: 'no-store' }),
          fetch('/data/shuttle_changelog.json', { cache: 'no-store' }),
        ]);
        if (metadataResponse.ok) {
          setMetadata(normalizeMetadata(await metadataResponse.json() as ShuttleMetadata));
        }
        if (changeLogResponse.ok) {
          const changeLog = await changeLogResponse.json() as { entries?: ChangeLogEntry[] };
          setChangeLogEntries(Array.isArray(changeLog.entries) ? changeLog.entries : []);
        }
      } catch (error) {
        console.error('Error loading shuttle status:', error);
      }
    };

    void loadPublicStatus();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SKIPPED_ERRORS_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setSkippedErrorKeys(new Set(parsed.filter((key): key is string => typeof key === 'string')));
      }
    } catch (error) {
      console.error('Error restoring skipped review items:', error);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedKey = sessionStorage.getItem('shuttle_editor_key') ?? '';
      if (!storedKey) {
        setAuthStatus('locked');
        return;
      }

      if (await verifyEditorKey(storedKey)) {
        setEditorKey(storedKey);
        setAuthStatus('authenticated');
      } else {
        sessionStorage.removeItem('shuttle_editor_key');
        setAuthStatus('locked');
      }
    };

    void restoreSession();
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [resCurrent, resBase] = await Promise.all([
          fetch('/data/shuttle_data.json'),
          fetch('/data/shuttle_base.json'),
        ]);

        const jsonCurrent = await resCurrent.json();
        const jsonBase = await resBase.json();

        setData(jsonCurrent);
        setPersistedData(structuredClone(jsonCurrent));
        setBaseData(jsonBase);
      } catch (err) {
        console.error('Error loading shuttle data:', err);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [authStatus]);


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

  const allRouteErrors = useMemo(
    () => data ? collectRouteErrors(data, speedThreshold, distThreshold) : [],
    [data, speedThreshold, distThreshold],
  );

  const activeRouteErrors = useMemo(
    () => allRouteErrors.filter(error => !skippedErrorKeys.has(routeErrorKey(error))),
    [allRouteErrors, skippedErrorKeys],
  );

  const visibleRouteErrors = useMemo(
    () => activeRouteErrors.filter(error => errorFilter === 'ALL' || error.type === errorFilter),
    [activeRouteErrors, errorFilter],
  );

  const currentSkippedErrorCount = allRouteErrors.length - activeRouteErrors.length;

  const searchResults = useMemo(() => {
    if (!data || routeSearch.length < 1) return [];
    const query = routeSearch.toLowerCase();
    const results: { fc: string; fcName: string; shift: string; route: string }[] = [];
    Object.entries(data).forEach(([fcCode, fcCard]) => {
      Object.entries(fcCard.shifts || {}).forEach(([shiftName, routes]) => {
        Object.keys(routes).forEach(routeName => {
          if (routeName.toLowerCase().includes(query) || fcCode.toLowerCase().includes(query) || (fcCard.center?.name || '').toLowerCase().includes(query)) {
            results.push({ fc: fcCode, fcName: fcCard.center?.name || fcCode, shift: shiftName, route: routeName });
          }
        });
      });
    });
    return results.slice(0, 20);
  }, [data, routeSearch]);

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

  const handleApplyMapCoordinate = (latitude: string, longitude: string) => {
    if (
      highlightedStopIndex === null ||
      !data ||
      !selectedFC ||
      !selectedShift ||
      !selectedRoute
    ) {
      setMessage({ type: 'error', text: '좌표를 적용할 정류장을 먼저 선택해 주세요.' });
      return;
    }

    const newData = JSON.parse(JSON.stringify(data));
    const stops = newData[selectedFC].shifts[selectedShift][selectedRoute];
    const selectedStop = stops[highlightedStopIndex];

    stops[highlightedStopIndex] = {
      ...selectedStop,
      Latitude: latitude,
      Longitude: longitude,
    };

    setData(newData);
    setMessage({
      type: 'success',
      text: `'${selectedStop.Name}' 정류장에 위도 ${latitude}, 경도 ${longitude}를 적용했습니다. 저장 전까지는 운영 데이터에 반영되지 않습니다.`,
    });
  };

  const saveSkippedErrorKeys = (keys: Set<string>) => {
    try {
      localStorage.setItem(SKIPPED_ERRORS_STORAGE_KEY, JSON.stringify([...keys].slice(-2000)));
    } catch (error) {
      console.error('Error saving skipped review items:', error);
    }
  };

  const jumpToRouteError = (error: RouteError) => {
    setSelectedFC(error.fc);
    setSelectedShift(error.shift);
    setTimeout(() => {
      setSelectedRoute(error.route);
      setHighlightedStopIndex(error.idx);
      setTimeout(() => {
        document.getElementById(`stop-row-${error.idx}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    }, 100);
  };

  const handleSkipRouteError = (error: RouteError, jumpToNext = false) => {
    const currentKey = routeErrorKey(error);
    const remainingErrors = activeRouteErrors.filter(item => routeErrorKey(item) !== currentKey);
    const currentIndex = activeRouteErrors.findIndex(item => routeErrorKey(item) === currentKey);
    const nextError = remainingErrors.length > 0
      ? remainingErrors[Math.min(Math.max(currentIndex, 0), remainingErrors.length - 1)]
      : null;

    setSkippedErrorKeys(current => {
      const next = new Set(current);
      next.add(currentKey);
      saveSkippedErrorKeys(next);
      return next;
    });
    setMessage({
      type: 'success',
      text: `'${error.stopName ?? `#${error.idx + 1}`}' 정류장을 정상으로 판단해 이 기기에서 스킵했습니다. 데이터와 변경 로그는 수정되지 않습니다.`,
    });

    if (jumpToNext && nextError) {
      setTimeout(() => jumpToRouteError(nextError), 100);
    }
  };

  const handleUnskipRouteError = (error: RouteError) => {
    const currentKey = routeErrorKey(error);
    setSkippedErrorKeys(current => {
      const next = new Set(current);
      next.delete(currentKey);
      saveSkippedErrorKeys(next);
      return next;
    });
    setMessage({ type: 'success', text: `'${error.stopName ?? `#${error.idx + 1}`}' 정류장을 검토 목록에 다시 표시합니다.` });
  };

  const handleRestoreSkippedErrors = () => {
    setSkippedErrorKeys(new Set());
    try {
      localStorage.removeItem(SKIPPED_ERRORS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing skipped review items:', error);
    }
    setMessage({ type: 'success', text: '스킵했던 정류장을 모두 검토 목록에 복원했습니다.' });
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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = keyInput.trim();
    if (!candidate) {
      setAuthError('관리자 키를 입력해주세요.');
      return;
    }

    setAuthStatus('checking');
    setAuthError('');
    if (await verifyEditorKey(candidate)) {
      sessionStorage.setItem('shuttle_editor_key', candidate);
      setEditorKey(candidate);
      setKeyInput('');
      setAuthStatus('authenticated');
      return;
    }

    setAuthError('관리자 키가 올바르지 않거나 서버 설정을 확인할 수 없습니다.');
    setAuthStatus('locked');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('shuttle_editor_key');
    setEditorKey('');
    setData(null);
    setPersistedData(null);
    setBaseData(null);
    setAuthStatus('locked');
  };

  const collectRoutePatches = (): RoutePatch[] => {
    if (!data || !persistedData) return [];

    const patches: RoutePatch[] = [];
    for (const [fc, fcData] of Object.entries(data)) {
      for (const [shift, routes] of Object.entries(fcData.shifts ?? {})) {
        for (const [route, stops] of Object.entries(routes)) {
          const persistedStops = persistedData[fc]?.shifts?.[shift]?.[route];
          if (JSON.stringify(stops) !== JSON.stringify(persistedStops)) {
            patches.push({ fc, shift, route, stops });
          }
        }
      }
    }
    return patches;
  };

  const splitPatchBatches = (patches: RoutePatch[]): RoutePatch[][] => {
    const maxBatchBytes = 3 * 1024 * 1024;
    const batches: RoutePatch[][] = [];
    let batch: RoutePatch[] = [];

    for (const patch of patches) {
      const candidate = [...batch, patch];
      if (new TextEncoder().encode(JSON.stringify({ type: 'manual', changes: candidate })).length > maxBatchBytes) {
        if (batch.length === 0) {
          throw new Error(`'${patch.route}' 노선 변경분이 너무 큽니다.`);
        }
        batches.push(batch);
        batch = [patch];
      } else {
        batch = candidate;
      }
    }

    if (batch.length > 0) batches.push(batch);
    return batches;
  };

  const postEditorRequest = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/save-data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-editor-key': editorKey,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json() as ApiResponse;

    if (response.status === 401) {
      handleLogout();
      throw new Error('인증이 만료되었습니다. 관리자 키를 다시 입력해주세요.');
    }
    if (!response.ok || !result.success) {
      throw new Error(result.message || `요청 실패 (HTTP ${response.status})`);
    }
    return result;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const patches = collectRoutePatches();
      if (patches.length === 0) {
        setMessage({ type: 'success', text: '저장할 변경 사항이 없습니다.' });
        return;
      }

      const batches = splitPatchBatches(patches);
      let latestMetadata: ShuttleMetadata | undefined;
      const newChangeLogEntries: ChangeLogEntry[] = [];
      for (const changes of batches) {
        const result = await postEditorRequest({ type: 'manual', changes });
        latestMetadata = result.metadata ?? latestMetadata;
        if (result.changeLogEntry) {
          newChangeLogEntries.unshift(result.changeLogEntry);
        }
      }

      setPersistedData(structuredClone(data));
      if (latestMetadata) setMetadata(normalizeMetadata(latestMetadata));
      if (newChangeLogEntries.length > 0) {
        setChangeLogEntries((current) =>
          [...newChangeLogEntries, ...current].slice(0, 100),
        );
      }
      setMessage({
        type: 'success',
        text: `${patches.length}개 노선 저장 완료! 지도에 곧 반영됩니다.`,
      });
    } catch (err: unknown) {
      console.error('Save failed:', err);
      const errorMessage = err instanceof Error ? err.message : '네트워크 오류';
      setMessage({ type: 'error', text: `오류: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  const handleManualMerge = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const result = await postEditorRequest({ type: 'merge' });
      if (result.metadata) setMetadata(normalizeMetadata(result.metadata));
      if (result.changeLogEntry) {
        setChangeLogEntries((current) =>
          [result.changeLogEntry as ChangeLogEntry, ...current].slice(0, 100),
        );
      }
      setMessage({ type: 'success', text: '수동 머지가 완료되었습니다! 지도가 곧 업데이트됩니다.' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '서버 연결 오류';
      setMessage({ type: 'error', text: `머지 실패: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };
  const handleExportExcel = () => {
    if (!currentStops || currentStops.length === 0) {
      alert('추출할 데이터가 없습니다.');
      return;
    }

    // Header definition
    const headers = ['Center', 'Shift', 'Route', 'Order', 'Name', 'Time', 'Latitude', 'Longitude', 'Address'];
    
    // Data mapping
    const rows = currentStops.map(stop => [
      selectedFC,
      selectedShift,
      selectedRoute,
      stop.Order,
      `"${stop.Name}"`, // Wrap in quotes to handle commas in names
      stop.Time,
      stop.Latitude,
      stop.Longitude,
      `"${stop.Address}"`
    ]);

    // CSV Content generation
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Add UTF-8 BOM for Excel Korean support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shuttle_${selectedFC}_${selectedRoute}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-tight">관리자 인증 확인 중...</p>
      </div>
    );
  }

  if (authStatus === 'locked') {
    return (
      <div className="max-w-5xl mx-auto min-h-[80vh] px-4 py-8 space-y-6">
        <UpdateStatusCards metadata={metadata} />
        <div className="flex justify-center">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-8 shadow-xl shadow-slate-100 space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="text-6xl opacity-40">🔒</div>
              <h1 className="text-2xl font-black text-slate-900 uppercase">Restricted Access</h1>
              <p className="text-slate-500 text-sm font-medium tracking-tight">
                서버에 설정된 관리자 키를 입력해주세요.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="editor-key" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                Editor Key
              </label>
              <input
                id="editor-key"
                type="password"
                autoComplete="current-password"
                value={keyInput}
                onChange={(event) => setKeyInput(event.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {authError && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full px-5 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-slate-900 transition-colors"
            >
              관리자 로그인
            </button>
          </form>
        </div>
        <ChangeLogPanel entries={changeLogEntries} />
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
            <div className="flex items-center gap-2 mt-0.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Route Integrity & Optimization</p>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded-full uppercase tracking-tighter">Editor Active</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
            <button
                onClick={() => setIsGuideOpen(true)}
                className="px-5 py-2.5 bg-indigo-50 text-indigo-600 font-black text-[11px] rounded-xl hover:bg-indigo-100 transition-all uppercase font-sans flex items-center gap-1.5"
            >
                ❓ 작업 가이드
            </button>
            <button 
                onClick={handleExportExcel}
                disabled={!selectedRoute}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 font-black text-[11px] rounded-xl hover:bg-emerald-100 transition-all uppercase tracking-wider disabled:opacity-30"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
            </button>
            <button 
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-slate-50 text-slate-500 font-black text-[11px] rounded-xl hover:bg-slate-100 transition-all uppercase font-sans"
            >
                Map View
            </button>
            <button 
                onClick={handleManualMerge}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all uppercase tracking-widest border ${saving ? 'bg-slate-50 text-slate-300 border-slate-100' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200'}`}
            >
                {saving ? 'Processing...' : 'Run Manual Merge'}
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-[11px] font-black transition-all shadow-lg uppercase tracking-widest ${saving ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-slate-900 shadow-indigo-100'}`}
            >
                {saving ? 'Syncing...' : 'Deploy Changes'}
            </button>
            <button
                onClick={handleLogout}
                disabled={saving}
                className="px-4 py-2.5 bg-red-50 text-red-500 font-black text-[11px] rounded-xl hover:bg-red-100 transition-all uppercase disabled:opacity-30"
            >
                Logout
            </button>
        </div>
      </header>

      <UpdateStatusCards metadata={metadata} />
      <ChangeLogPanel entries={changeLogEntries} />


      {message && (
          <div className={`p-4 rounded-2xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} animate-in fade-in slide-in-from-top duration-500`}>
             <div className="font-bold text-sm text-center">
                {message.type === 'success' ? '✅' : '❌'} {message.text}
             </div>
          </div>
      )}

      {/* Global Error Dashboard Panel */}
      {data && (
          <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100/20 animate-in zoom-in duration-500 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
              
              <div className="relative z-10 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                          <h3 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                            Global Shuttle Health Monitor
                          </h3>
                          <p className="text-slate-400 text-[11px] font-bold font-sans uppercase tracking-tight">전국 물류센터 노선 데이터의 무결성을 실시간으로 감시 중입니다.</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                              <button
                                  onClick={() => setErrorFilter('ALL')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${errorFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >ALL ({activeRouteErrors.length})</button>
                              <button
                                  onClick={() => setErrorFilter('SPEED')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${errorFilter === 'SPEED' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >SPEED ({activeRouteErrors.filter(e => e.type === 'SPEED').length})</button>
                              <button
                                  onClick={() => setErrorFilter('TIME')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${errorFilter === 'TIME' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >TIME ({activeRouteErrors.filter(e => e.type === 'TIME').length})</button>
                              <button
                                  onClick={() => setErrorFilter('DISTANCE')}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${errorFilter === 'DISTANCE' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                              >DIST ({activeRouteErrors.filter(e => e.type === 'DISTANCE').length})</button>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                  <span className="text-[9px] font-black text-red-400 uppercase">⚡</span>
                                  <input type="number" value={speedThreshold} onChange={(e) => setSpeedThreshold(Number(e.target.value))} className="w-14 bg-transparent text-white text-[11px] font-black text-center border-none focus:ring-0 focus:outline-none" />
                                  <span className="text-[9px] text-slate-500 font-bold">km/h</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                                  <span className="text-[9px] font-black text-purple-400 uppercase">📏</span>
                                  <input type="number" value={distThreshold} onChange={(e) => setDistThreshold(Number(e.target.value))} className="w-14 bg-transparent text-white text-[11px] font-black text-center border-none focus:ring-0 focus:outline-none" />
                                  <span className="text-[9px] text-slate-500 font-bold">m</span>
                              </div>
                          </div>
                          <div className={`px-5 py-2 rounded-2xl border flex items-center gap-3 ${visibleRouteErrors.length > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                              <span className="text-lg">{visibleRouteErrors.length > 0 ? '🚨' : '✨'}</span>
                              <span className={`text-xs font-black uppercase tracking-widest ${visibleRouteErrors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {visibleRouteErrors.length} {errorFilter} Found
                              </span>
                          </div>
                          {currentSkippedErrorCount > 0 && (
                              <button
                                  onClick={handleRestoreSkippedErrors}
                                  className="px-4 py-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black text-emerald-300 hover:bg-emerald-500/20 transition-all"
                              >
                                  스킵 {currentSkippedErrorCount}개 · 모두 복원
                              </button>
                          )}
                      </div>
                  </div>
                  
                  {/* Global Error List Horizontal Scroll */}
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                      {visibleRouteErrors.length === 0 ? (
                          <div className="flex-1 py-10 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                              <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">No errors in this category</p>
                              {currentSkippedErrorCount > 0 && (
                                  <p className="mt-2 text-emerald-400/70 text-[10px] font-bold">정상으로 스킵한 항목 {currentSkippedErrorCount}개</p>
                              )}
                          </div>
                      ) : visibleRouteErrors.map(err => (
                          <article
                              key={routeErrorKey(err)}
                              className={`flex-shrink-0 group w-[280px] border rounded-3xl transition-all text-left relative overflow-hidden ${err.type === 'TIME' ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/50' : err.type === 'DISTANCE' ? 'bg-purple-500/5 border-purple-500/10 hover:border-purple-500/50' : 'bg-red-500/5 border-red-500/10 hover:border-red-500/50'}`}
                          >
                              <button
                                  type="button"
                                  onClick={() => jumpToRouteError(err)}
                                  className="w-full p-5 pb-4 text-left space-y-3"
                              >
                                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity pointer-events-none">
                                      <span className="text-xl">{err.type === 'TIME' ? '⏰' : err.type === 'DISTANCE' ? '📏' : '⚡'}</span>
                                  </div>
                                  <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${err.type === 'TIME' ? 'bg-amber-500/20 text-amber-400' : err.type === 'DISTANCE' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-400'}`}>
                                              {err.fcName}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{err.shift}</span>
                                      </div>
                                      <h4 className="text-[12px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{err.route}</h4>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                      <div className="flex flex-col min-w-0">
                                          <span className={`text-[9px] font-black uppercase tracking-widest truncate ${err.type === 'TIME' ? 'text-amber-400' : err.type === 'DISTANCE' ? 'text-purple-300' : 'text-red-400'}`}>#{err.idx+1} {err.stopName}</span>
                                          <span className="text-[11px] font-black text-white">
                                              {err.type === 'TIME' ? 'Logic/Time Error' : err.type === 'DISTANCE' ? `${(err.dist * 1000).toFixed(0)}m` : `${err.speed.toFixed(1)}km/h`}
                                          </span>
                                      </div>
                                      <div className="p-2 bg-white/5 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                      </div>
                                  </div>
                              </button>
                              <button
                                  type="button"
                                  onClick={() => handleSkipRouteError(err)}
                                  className="w-full border-t border-white/10 px-4 py-2.5 text-[10px] font-black text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 transition-all"
                              >
                                  ✓ 정상으로 판단 · 스킵
                              </button>
                          </article>
                      ))}
                  </div>
              </div>
          </section>
      )}

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start min-h-[800px]">
        {/* Left Side: Editor Form */}
        <div className="w-full lg:w-7/12 space-y-6 order-2 lg:order-1">
          <section className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            {/* Route Search */}
            <div className="relative">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4">
                <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="노선 검색 (예: 경산, GYS1, 구미)..."
                  className="w-full px-2 py-3 bg-transparent border-none font-bold text-slate-700 text-sm focus:ring-0 focus:outline-none"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                />
                {routeSearch && (
                  <button onClick={() => setRouteSearch('')} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl max-h-72 overflow-y-auto custom-scrollbar">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-5 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setSelectedFC(r.fc);
                        setSelectedShift(r.shift);
                        setTimeout(() => { setSelectedRoute(r.route); setHighlightedStopIndex(null); }, 50);
                        setRouteSearch('');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black rounded uppercase">{r.fc}</span>
                        <span className="font-bold text-slate-700 text-sm">{r.route}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">{r.shift}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Center</label>
                        {selectedFC && (
                            <a 
                                href={`https://coufc.coupang.com/${selectedFC.toLowerCase()}/shuttle`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-black text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Official Site
                            </a>
                        )}
                    </div>
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
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Route</label>
                        {selectedRoute && currentStops.some(s => s['Image URL']) && (
                            <button 
                                onClick={() => setSelectedImage('GALLERY')}
                                className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Route Gallery
                            </button>
                        )}
                    </div>
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
                          const isSpeedError = Boolean(speedStatus && speedStatus.speed > speedThreshold && speedStatus.speed <= 900);
                          const isTimeError = Boolean(speedStatus && speedStatus.speed > 900);
                          const isDistanceError = Boolean(speedStatus && speedStatus.dist > 0 && speedStatus.dist <= (distThreshold / 1000));
                          const currentRouteError: RouteError | null = speedStatus && (isSpeedError || isTimeError || isDistanceError)
                            ? {
                                fc: selectedFC,
                                fcName: data?.[selectedFC]?.center?.name || selectedFC,
                                shift: selectedShift,
                                route: selectedRoute,
                                idx,
                                stopName: stop.Name,
                                type: isTimeError ? 'TIME' : isDistanceError ? 'DISTANCE' : 'SPEED',
                                ...speedStatus,
                              }
                            : null;
                          const isCurrentErrorSkipped = currentRouteError
                            ? skippedErrorKeys.has(routeErrorKey(currentRouteError))
                            : false;
                          
                          return (
                            <div key={idx} className="space-y-4">
                                {speedStatus && (
                                    <div className="flex items-center justify-center gap-6 py-2 px-10">
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                        <div className={`flex items-center gap-4 text-[10px] font-black uppercase tracking-widest ${speedStatus.speed > speedThreshold ? 'text-red-500 animate-pulse' : speedStatus.dist > 0 && speedStatus.dist <= (distThreshold / 1000) ? 'text-purple-500' : 'text-slate-300'}`}>
                                            <div className={`flex items-center gap-1.5 ${speedStatus.dist > 0 && speedStatus.dist <= (distThreshold / 1000) ? 'px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full' : ''}`}>
                                                <span>📏</span>
                                                <span>{(speedStatus.dist * 1000).toFixed(0)}m{speedStatus.dist > 0 && speedStatus.dist <= (distThreshold / 1000) ? ' ⚠️ 근접' : ` (${speedStatus.dist.toFixed(2)}km)`}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span>⏱️</span>
                                                <span>{speedStatus.timeDiff} min</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${speedStatus.speed > speedThreshold ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <span>⚡</span>
                                                <span>{speedStatus.speed > 900 ? 'TIME ERROR' : `${speedStatus.speed.toFixed(1)} km/h`}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 h-px bg-slate-100"></div>
                                    </div>
                                )}
                                <div 
                                    id={`stop-row-${idx}`}
                                    className={`bg-white p-6 rounded-[2rem] border transition-all ${highlightedStopIndex === idx ? 'border-indigo-500 shadow-xl shadow-indigo-100 ring-1 ring-indigo-500' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                                    onClick={() => setHighlightedStopIndex(idx)}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                         <div className="md:col-span-1 flex flex-col items-center justify-center pt-2">
                                             <span className={`text-[10px] font-black ${highlightedStopIndex === idx ? 'text-indigo-500' : 'text-slate-200'}`}>#{idx+1}</span>
                                             {currentRouteError && (
                                                 <button
                                                     type="button"
                                                     onClick={(event) => {
                                                       event.stopPropagation();
                                                       if (isCurrentErrorSkipped) {
                                                         handleUnskipRouteError(currentRouteError);
                                                       } else {
                                                         handleSkipRouteError(currentRouteError, true);
                                                       }
                                                     }}
                                                     className={`mt-3 rounded-lg px-2 py-1.5 text-[9px] font-black leading-tight transition-all ${isCurrentErrorSkipped ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                     title={isCurrentErrorSkipped ? '스킵을 취소하고 검토 목록에 다시 표시' : '정상으로 판단하고 다음 검토 항목으로 이동'}
                                                 >
                                                     {isCurrentErrorSkipped ? '스킵 취소' : '정상 스킵'}
                                                 </button>
                                             )}
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
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Dist (km)</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl font-black text-slate-600 text-sm font-mono text-center"
                                                    value={stop['Distance (km)'] ?? ''}
                                                    onFocus={() => setHighlightedStopIndex(idx)}
                                                    onChange={(e) => handleStopChange(idx, 'Distance (km)', e.target.value)}
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
                                                    {stop['Image URL'] && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedImage(stop['Image URL'] || null); }}
                                                            className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black hover:bg-indigo-500 hover:text-white transition-all shadow-sm shadow-indigo-100"
                                                        >PHOTO</button>
                                                    )}
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
              onApplyCoordinate={handleApplyMapCoordinate}
            />
        </div>
      </div>
      
      
      {/* Image Modal UI */}
      {selectedImage && (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
            onClick={() => setSelectedImage(null)}
        >
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"></div>
            
            <div 
                className="relative z-[110] bg-white rounded-[3rem] shadow-2xl overflow-hidden max-w-5xl w-full max-h-full flex flex-col animate-in zoom-in slide-in-from-bottom-10 duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">🖼️</div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                                {selectedImage === 'GALLERY' ? `${selectedRoute} 노선 갤러리` : '정류장 상세 사진'}
                            </h3>
                            <p className="text-slate-400 text-xs font-bold font-sans uppercase tracking-tighter">Official Shuttle Stop Information</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
                    {selectedImage === 'GALLERY' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                            {currentStops.filter(s => s['Image URL']).map((s, i) => (
                                <div key={i} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 group">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <img 
                                            src={s['Image URL']} 
                                            alt={s.Name} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-black rounded-lg">
                                            #{s.Order}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-sm uppercase truncate">{s.Name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            {s.Address}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <img 
                                src={selectedImage} 
                                alt="Stop Detail" 
                                className="max-w-full h-auto rounded-[2rem] shadow-2xl border-4 border-white"
                            />
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white border-t border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Coupang Logistics Service • Smart Editor System</p>
                </div>
            </div>
        </div>
      )}

      {/* Guide Drawer UI */}
      {isGuideOpen && (
        <div
          className="fixed inset-0 z-[120] flex justify-end animate-in fade-in duration-300"
          onClick={() => setIsGuideOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

          <div
            className="relative z-[130] bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">🚌</div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">셔틀 데이터 작업 가이드</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Data Update & Deploy Guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content (Stepper Style) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                <span className="text-xl">💡</span>
                <p className="text-xs font-semibold text-indigo-900 leading-relaxed">
                  에디터에서 정류장 정보를 수정하고 계실 때는 브라우저가 새로고침되거나 꺼지면 작업한 내용이 모두 날아갑니다! 수정을 마친 후에는 반드시 아래 4단계의 배포 과정을 완료해주세요.
                </p>
              </div>

              <div className="space-y-6 relative pl-4 border-l-2 border-slate-200">
                {/* Step 1 */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[25px] top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-black">1</div>
                  <h4 className="font-black text-slate-800 text-sm font-sans">1단계. 최신 셔틀 데이터 추출</h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-1 font-sans">
                    PC에서 <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">CoupangShuttleTool</code> 프로그램을 실행하여 최신 셔틀 데이터를 다운로드 받습니다.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[25px] top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-black">2</div>
                  <h4 className="font-black text-slate-800 text-sm font-sans">2단계. 프로젝트 내에 데이터 병합</h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-1 font-sans">
                    터미널로 <code className="bg-slate-200/60 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]">coupang-shuttle-map</code> 폴더로 이동한 뒤 아래 명령어를 실행합니다:
                  </p>
                  <div className="bg-slate-900 text-slate-100 rounded-xl p-3 flex justify-between items-center font-mono text-xs shadow-inner">
                    <span>npm run full-update</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('npm run full-update');
                        setCopyFeedback(true);
                        setTimeout(() => setCopyFeedback(false), 2000);
                      }}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold transition-all"
                    >
                      {copyFeedback ? '복사됨! ✅' : '복사'}
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[25px] top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-black">3</div>
                  <h4 className="font-black text-slate-800 text-sm font-sans">3단계. 에디터에서 위경도/시간 수정</h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-1 font-sans">
                    에디터 상단의 <span className="font-bold text-slate-700">Health Monitor</span>를 통해 <span className="text-red-500 font-bold">SPEED</span>, <span className="text-amber-500 font-bold">TIME</span>, <span className="text-purple-500 font-bold">DIST</span> 항목을 검토합니다. 실제 정류장이 맞다면 <span className="font-bold text-emerald-600">정상 스킵</span>을 눌러 다음 항목으로 이동할 수 있으며, 스킵은 셔틀 데이터와 변경 로그를 수정하지 않습니다.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[25px] top-1 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-black">4</div>
                  <h4 className="font-black text-slate-800 text-sm font-sans">4단계. 최종 배포 (Deploy)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed pl-1 font-sans">
                    모든 수정이 완료되면 상단 헤더 우측의 <span className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-black">Deploy Changes</span> 버튼을 눌러 GitHub에 최종 배포를 완료합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 text-center flex justify-between items-center px-6">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-sans">Coupang Logistics Service • Smart Editor System</p>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-black text-[11px] rounded-xl hover:bg-slate-800 transition-all uppercase font-sans"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
  return <EditorContent />;
}
