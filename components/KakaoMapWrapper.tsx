'use client';

import { Map, CustomOverlayMap, useKakaoLoader } from 'react-kakao-maps-sdk';
import { ShuttleStop } from '../types/shuttle';

export default function KakaoMapWrapper({ stops }: { stops: ShuttleStop[] }) {
  // react-kakao-maps-sdk 기본 로더를 사용하여 안전하게 로드
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '', // .env.local 호환
    libraries: ['services', 'clusterer', 'drawing'],
  });

  const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

  if (!appKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-amber-50 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-lg font-bold text-amber-900 mb-2">지도를 표시할 수 없습니다</h3>
        <p className="text-sm text-amber-600 break-keep max-w-xs mb-4">
          지도 설정을 확인하고 있습니다. 잠시 후 다시 이용해 주세요.
        </p>
        <div className="text-[11px] text-amber-700 bg-white p-3 rounded-xl border border-amber-200 shadow-sm leading-relaxed">
           문제가 계속되면 운영자에게 문의해 주세요.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-red-50 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-lg font-bold text-red-900 mb-2">카카오 지도를 불러오지 못했습니다</h3>
        <p className="text-sm text-red-600 break-keep max-w-xs mb-4">
          일시적인 지도 연결 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
        </p>
        <code className="text-[10px] bg-red-100 px-2 py-1 rounded text-red-800">
           지도 연결 오류
        </code>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-50/50 z-10">
        <div className="w-10 h-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400 font-bold tracking-tight">카카오 지도를 불러오는 중...</p>
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
                 <div className="pin-bubble" style={{ color: stop.color, borderColor: stop.color + '40' }}>
                    {stop.route}
                </div>
                {/* Droplet Shape Pin with Index */}
                <div className="pin-marker" style={{ background: stop.color, boxShadow: `0 4px 15px ${stop.color}66` }}>
                    <span className="pin-number">{stop.index}</span>
                </div>
            </div>
          </CustomOverlayMap>
        ))}
      </Map>
    </div>
  );
}
