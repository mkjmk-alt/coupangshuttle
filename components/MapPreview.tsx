'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CustomOverlayMap,
  Map,
  MapMarker,
  Polyline,
  ZoomControl,
  useKakaoLoader,
} from 'react-kakao-maps-sdk';

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

interface ValidStop {
  stop: MapPreviewStop;
  index: number;
  latitude: number;
  longitude: number;
}

type MapViewType = 'ROADMAP' | 'HYBRID';

const DEFAULT_CENTER = { lat: 36.5, lng: 127.5 };

export default function MapPreview({
  stops,
  highlightIndex,
  onApplyCoordinate,
}: MapPreviewProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY ?? '';
  const [loading, loadError] = useKakaoLoader({
    appkey: appKey,
    libraries: ['services'],
  });
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapLevel, setMapLevel] = useState(13);
  const [mapViewType, setMapViewType] = useState<MapViewType>('ROADMAP');
  const [selectedCoordinate, setSelectedCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [searchState, setSearchState] = useState<'idle' | 'searching' | 'error'>('idle');
  const [searchMessage, setSearchMessage] = useState('');

  const validStops = useMemo<ValidStop[]>(
    () =>
      stops.flatMap((stop, index) => {
        const latitude = Number.parseFloat(stop.Latitude);
        const longitude = Number.parseFloat(stop.Longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
        return [{ stop, index, latitude, longitude }];
      }),
    [stops],
  );

  const routeSignature = useMemo(
    () =>
      validStops
        .map(({ index, latitude, longitude }) => `${index}:${latitude}:${longitude}`)
        .join('|'),
    [validStops],
  );

  const routePath = useMemo(
    () =>
      validStops.map(({ latitude, longitude }) => ({
        lat: latitude,
        lng: longitude,
      })),
    [validStops],
  );

  const selectedLatitude = selectedCoordinate?.latitude.toFixed(6) ?? '';
  const selectedLongitude = selectedCoordinate?.longitude.toFixed(6) ?? '';

  const fitRouteToMap = useCallback(() => {
    if (!map || validStops.length === 0 || typeof window === 'undefined' || !window.kakao?.maps) {
      return;
    }

    if (validStops.length === 1) {
      const onlyStop = validStops[0];
      map.setCenter(new window.kakao.maps.LatLng(onlyStop.latitude, onlyStop.longitude));
      map.setLevel(3);
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    validStops.forEach(({ latitude, longitude }) => {
      bounds.extend(new window.kakao.maps.LatLng(latitude, longitude));
    });
    map.setBounds(bounds, 90, 70, 145, 70);
  }, [map, validStops]);

  useEffect(() => {
    fitRouteToMap();
  }, [fitRouteToMap, routeSignature]);

  useEffect(() => {
    if (highlightIndex === null || !stops[highlightIndex]) return;

    const stop = stops[highlightIndex];
    const latitude = Number.parseFloat(stop.Latitude);
    const longitude = Number.parseFloat(stop.Longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    // Selecting a station intentionally synchronizes the controlled map.
    setMapCenter({ lat: latitude, lng: longitude });
    setMapLevel(3);
    setSelectedCoordinate({ latitude, longitude });
    setSelectedPlaceName(stop.Name);
    setCopyState('idle');
  }, [highlightIndex, stops]);

  const selectCoordinate = (
    latitude: number,
    longitude: number,
    placeName = '',
  ) => {
    setSelectedCoordinate({ latitude, longitude });
    setSelectedPlaceName(placeName);
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
      const payload = (await response.json()) as {
        results?: LocationSearchResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || '위치 검색에 실패했습니다.');
      }

      const results = payload.results ?? [];
      setSearchResults(results);
      setSearchState('idle');
      setSearchMessage(
        results.length === 0
          ? '검색 결과가 없습니다. 주소를 조금 더 자세히 입력해 보세요.'
          : '',
      );
    } catch (error) {
      setSearchState('error');
      setSearchMessage(
        error instanceof Error ? error.message : '위치 검색에 실패했습니다.',
      );
    }
  };

  const handleSearchResultSelect = (result: LocationSearchResult) => {
    setMapCenter({ lat: result.latitude, lng: result.longitude });
    setMapLevel(3);
    selectCoordinate(result.latitude, result.longitude, result.name);
    setSearchQuery(result.name);
    setSearchResults([]);
    setSearchMessage(
      '검색한 위치를 선택했습니다. 아래에서 좌표를 확인하거나 정류장에 적용하세요.',
    );
    setSearchState('idle');
  };

  const handleCopyCoordinate = async () => {
    if (!selectedCoordinate) return;

    try {
      await navigator.clipboard.writeText(
        `${selectedLatitude}, ${selectedLongitude}`,
      );
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  if (!appKey) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-amber-50 p-8 text-center">
        <div className="mb-4 text-4xl">🔑</div>
        <h3 className="text-lg font-black text-amber-900">카카오 지도 API 키가 없습니다</h3>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-amber-700">
          Cloudflare Pages의 Build 환경 변수에
          {' '}
          <code>NEXT_PUBLIC_KAKAO_APP_KEY</code>
          를 설정한 뒤 다시 배포해 주세요.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-rose-50 p-8 text-center">
        <div className="mb-4 text-4xl">🚫</div>
        <h3 className="text-lg font-black text-rose-900">카카오 지도를 불러오지 못했습니다</h3>
        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-rose-700">
          카카오 개발자 콘솔의 JavaScript SDK 도메인에
          {' '}
          <code>https://coupangshuttle.pages.dev</code>
          가 등록되어 있는지 확인해 주세요.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-slate-50 p-8">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
        <p className="mt-4 text-sm font-black text-slate-500">카카오 지도를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-50 shadow-inner">
      <Map
        center={mapCenter}
        level={mapLevel}
        mapTypeId={mapViewType}
        isPanto
        minLevel={1}
        maxLevel={14}
        style={{ height: '100%', width: '100%' }}
        onCreate={setMap}
        onClick={(_target, mouseEvent) => {
          selectCoordinate(
            mouseEvent.latLng.getLat(),
            mouseEvent.latLng.getLng(),
          );
        }}
      >
        <ZoomControl position="RIGHT" />

        {routePath.length > 1 && (
          <Polyline
            path={routePath}
            strokeWeight={4}
            strokeColor="#4f46e5"
            strokeOpacity={0.72}
            strokeStyle="shortdash"
          />
        )}

        {validStops.map(({ stop, index, latitude, longitude }) => {
          const isHighlighted = highlightIndex === index;
          return (
            <CustomOverlayMap
              key={`${index}-${stop.Name}-${latitude}-${longitude}`}
              position={{ lat: latitude, lng: longitude }}
              xAnchor={0.5}
              yAnchor={1}
              clickable
              zIndex={isHighlighted ? 20 : 10}
            >
              <button
                type="button"
                onClick={() => {
                  setMapCenter({ lat: latitude, lng: longitude });
                  setMapLevel(3);
                  selectCoordinate(latitude, longitude, stop.Name);
                }}
                className="group flex -translate-y-1 flex-col items-center"
                title={`#${index + 1} ${stop.Name} · ${stop.Time}`}
                aria-label={`#${index + 1} ${stop.Name} 정류장 위치 선택`}
              >
                {isHighlighted && (
                  <span className="mb-1 max-w-40 truncate rounded-lg border border-indigo-100 bg-white px-2.5 py-1 text-[10px] font-black text-indigo-700 shadow-lg">
                    {stop.Name}
                  </span>
                )}
                <span
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full border-2 px-2 text-[11px] font-black shadow-lg transition-transform group-hover:scale-110 ${
                    isHighlighted
                      ? 'border-white bg-rose-500 text-white ring-4 ring-rose-200'
                      : 'border-white bg-indigo-600 text-white ring-2 ring-indigo-100'
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`-mt-1 h-3 w-3 rotate-45 border-b-2 border-r-2 border-white ${
                    isHighlighted ? 'bg-rose-500' : 'bg-indigo-600'
                  }`}
                />
              </button>
            </CustomOverlayMap>
          );
        })}

        {selectedCoordinate && (
          <MapMarker
            position={{
              lat: selectedCoordinate.latitude,
              lng: selectedCoordinate.longitude,
            }}
            title={selectedPlaceName || '선택한 위치'}
            zIndex={30}
          />
        )}
      </Map>

      <div className="absolute left-4 right-4 top-4 z-[1100]">
        <form
          onSubmit={handleLocationSearch}
          className="flex gap-2 rounded-2xl border border-white bg-white/95 p-2 shadow-xl backdrop-blur-md"
          role="search"
        >
          <label htmlFor="map-location-search" className="sr-only">
            장소 또는 주소 검색
          </label>
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
                      <span className="block text-sm font-black text-slate-800">
                        {result.name}
                      </span>
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
                className={`px-4 py-3 text-xs font-bold ${
                  searchState === 'error' ? 'text-rose-600' : 'text-slate-600'
                }`}
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

      <div className="absolute left-4 top-[5.35rem] z-[1000] flex overflow-hidden rounded-xl border border-white bg-white/95 p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={fitRouteToMap}
          disabled={validStops.length === 0}
          className="rounded-lg px-3 py-2 text-[10px] font-black text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          노선 전체 보기
        </button>
        <span className="my-1 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => setMapViewType('ROADMAP')}
          className={`rounded-lg px-3 py-2 text-[10px] font-black transition ${
            mapViewType === 'ROADMAP'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          일반지도
        </button>
        <button
          type="button"
          onClick={() => setMapViewType('HYBRID')}
          className={`rounded-lg px-3 py-2 text-[10px] font-black transition ${
            mapViewType === 'HYBRID'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          스카이뷰
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl border border-white bg-white/95 p-3 shadow-xl backdrop-blur-md">
        {selectedCoordinate ? (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                선택한 위치 좌표
              </p>
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
                {copyState === 'copied'
                  ? '복사됨'
                  : copyState === 'failed'
                    ? '복사 실패'
                    : '좌표 복사'}
              </button>
              {highlightIndex !== null && onApplyCoordinate && (
                <button
                  type="button"
                  onClick={() =>
                    onApplyCoordinate(selectedLatitude, selectedLongitude)
                  }
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
