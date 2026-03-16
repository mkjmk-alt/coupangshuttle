'use client';

import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { ShuttleStop } from '../types/shuttle';

export default function KakaoMapWrapper({ stops }: { stops: ShuttleStop[] }) {
  // react-kakao-maps-sdk 기본 로더를 사용하여 안전하게 로드
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '', // .env.local 호환
    libraries: ['services', 'clusterer', 'drawing'],
  });

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-red-50 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-red-900 mb-2">지도 엔진 로드 실패</h3>
        <p className="text-sm text-red-600 break-keep max-w-xs">
          카카오맵 키가 올바르지 않거나, 카카오 개발자 콘솔에 <b>현재 도메인(localhost)</b>이 등록되어 있지 않을 수 있습니다.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-50/50 z-10">
        <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400 font-bold tracking-tight">지도 모듈 최적화 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gray-100">
      <Map
        center={{ lat: stops[0]?.lat || 37.5665, lng: stops[0]?.lng || 126.9780 }}
        style={{ width: '100%', height: '100%' }}
        level={7}
      >
        {stops.map((stop) => (
          <CustomOverlayMap
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            yAnchor={1}
          >
            <div className="map-pin">
                {/* Route Label */}
                 <div className="pin-bubble">
                    {stop.route}
                </div>
                {/* Droplet Shape Pin with Index */}
                <div className="pin-marker">
                    <span className="pin-number">{stop.index}</span>
                </div>
            </div>
          </CustomOverlayMap>
        ))}
      </Map>
    </div>
  );
}
