'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type ConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'csm_ad_consent_v1';
const ADSENSE_CLIENT = 'ca-pub-7954802956462064';

export default function PrivacyConsent() {
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'accepted' || stored === 'rejected') {
        setChoice(stored);
      } else {
        setPanelOpen(true);
      }
    } catch {
      setPanelOpen(true);
    } finally {
      setReady(true);
    }
  }, []);

  const saveChoice = (nextChoice: ConsentChoice) => {
    const adsWereLoaded = choice === 'accepted';

    try {
      window.localStorage.setItem(STORAGE_KEY, nextChoice);
    } catch {
      // 저장이 차단된 브라우저에서도 현재 페이지의 선택은 적용합니다.
    }

    setChoice(nextChoice);
    setPanelOpen(false);

    // 이미 로드된 광고 스크립트는 페이지에서 제거할 수 없으므로 철회 시 새로고침합니다.
    if (adsWereLoaded && nextChoice === 'rejected') {
      window.location.reload();
    }
  };

  return (
    <>
      {ready && choice === 'accepted' && (
        <Script
          id="google-adsense-after-consent"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      {ready && panelOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-[300] p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-consent-title"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_-16px_50px_rgba(15,23,42,0.18)] sm:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p
                  id="privacy-consent-title"
                  className="text-base font-black tracking-tight text-slate-900"
                >
                  선택적 광고 쿠키 사용에 동의하시겠어요?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  동의하면 Google AdSense가 광고 제공과 성과 측정을 위해 쿠키와 기기 정보를 처리할 수
                  있습니다. 거부해도 노선 조회와 지도 기능은 그대로 이용할 수 있습니다. 필수 기능의
                  기기 저장값과 호스팅·지도 요청은 서비스 제공을 위해 별도로 처리됩니다.
                </p>
                <Link
                  href="/privacy"
                  className="mt-2 inline-block text-xs font-bold text-indigo-600 underline underline-offset-4"
                >
                  개인정보처리방침 자세히 보기
                </Link>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row md:flex-col-reverse">
                <button
                  type="button"
                  onClick={() => saveChoice('rejected')}
                  className="min-w-32 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  거부하고 계속
                </button>
                <button
                  type="button"
                  onClick={() => saveChoice('accepted')}
                  className="min-w-32 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
                >
                  광고 쿠키 동의
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ready && !panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-4 left-4 z-[200] rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[11px] font-black text-slate-600 shadow-lg backdrop-blur transition hover:text-indigo-600"
          aria-label="광고 쿠키 설정 열기"
        >
          쿠키 설정
        </button>
      )}
    </>
  );
}
