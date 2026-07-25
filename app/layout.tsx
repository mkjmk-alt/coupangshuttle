import type { Metadata } from 'next';
import Link from 'next/link';
import PrivacyConsent from '@/components/PrivacyConsent';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'Coupang Shuttle Map | 물류센터 셔틀 노선 안내',
  description: '전국 쿠팡 물류센터 셔틀버스 노선·정류장 참고 안내 서비스',
  other: {
    'google-adsense-account': 'ca-pub-7954802956462064',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <nav className="glass-effect fixed left-0 right-0 top-0 z-[100] flex items-center justify-between px-4 py-4 md:px-12">
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg transition-transform group-hover:rotate-12">
              <span className="text-xs font-black">CS</span>
            </div>
            <span className="font-outfit text-lg font-black uppercase tracking-tighter text-slate-900 transition-colors group-hover:text-indigo-600">
              Coupang <span className="text-indigo-600">Shuttle Map</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/" className="nav-link bg-indigo-50/50 text-indigo-600">
              노선 조회
            </Link>
            <Link href="/operations" className="nav-link">
              운영·데이터 정책
            </Link>
            <Link href="/privacy" className="nav-link">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="nav-link">
              이용약관
            </Link>
            <Link href="/contact" className="nav-link">
              문의·제보
            </Link>
          </div>
        </nav>

        <div className="min-h-screen pt-24">{children}</div>

        <footer className="mt-40 border-t border-slate-200 bg-slate-50 pb-12 pt-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-3">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg">
                    <span className="text-xs font-black">CS</span>
                  </div>
                  <span className="font-outfit text-xl font-black uppercase tracking-tighter text-slate-900">
                    Coupang Shuttle Map
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-400">
                  쿠팡 물류센터 근무자를 위한 비공식 셔틀 노선 참고 서비스입니다. 실제 운행 정보는
                  소속 센터의 공식 공지를 우선해 주세요.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                  정책 안내
                </h2>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/operations"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      운영 및 데이터 정책
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      개인정보처리방침
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      서비스 이용약관
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
                  고객 지원
                </h2>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/contact"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      노선 오류·데이터 제보
                    </Link>
                  </li>
                  <li>
                    <a
                      href="http://pf.kakao.com/_FGhlX/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      카카오톡 채널 1:1 채팅
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:mkjmk3114@nate.com"
                      className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      mkjmk3114@nate.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-12 md:flex-row">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                © 2026 Coupang Shuttle Map.
              </p>
              <p className="text-center text-[10px] font-bold text-slate-400 md:text-right">
                본 서비스는 쿠팡 및 관계사가 운영하는 공식 서비스가 아닙니다.
              </p>
            </div>
          </div>
        </footer>

        <PrivacyConsent />
      </body>
    </html>
  );
}
