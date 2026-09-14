import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import CookieSettingsButton from '@/components/CookieSettingsButton';
import PrivacyConsent from '@/components/PrivacyConsent';
import SiteNavigation from '@/components/SiteNavigation';
import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: '물류센터 셔틀맵 | 쿠팡 물류센터 셔틀 노선 안내',
  description: '쿠팡 물류센터 근무자를 위한 비공식 셔틀 노선·정류장 참고 안내 서비스',
  other: {
    'google-adsense-account': 'ca-pub-7954802956462064',
  },
};

function Brand() {
  return (
    <Link href="/" className="brand-lockup" aria-label="물류센터 셔틀맵 홈">
      <span className="brand-mark">
        <Image src="/shuttle-pastel.jpg" alt="" width={48} height={48} />
      </span>
      <span className="brand-name">
        물류센터 <em>셔틀맵</em>
      </span>
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="app-shell antialiased selection:bg-[var(--blue-soft)] selection:text-[var(--ink)]">
        <aside className="desktop-sidebar" aria-label="주요 메뉴">
          <div className="sidebar-inner">
            <Brand />

            <div className="sidebar-intro">
              <p className="eyebrow">COMMUTE / SHUTTLE</p>
              <p>오늘의 이동을 조금 더 편하게 확인하세요.</p>
            </div>

            <SiteNavigation />

            <div className="sidebar-note">
              <span className="status-dot" aria-hidden="true" />
              <div>
                <strong>비공식 참고 서비스</strong>
                <p>탑승 전 센터의 최신 공지를 확인해 주세요.</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="page-shell">
          <header className="mobile-topbar">
            <Brand />
          </header>

          <div className="page-content">{children}</div>

          <footer className="site-footer">
            <div className="footer-grid">
              <div className="footer-brand-block">
                <Brand />
                <p>
                  쿠팡 물류센터 근무자를 위한 비공식 셔틀 노선 참고 서비스입니다. 실제 운행 정보는
                  소속 센터의 공식 공지를 우선해 주세요.
                </p>
              </div>

              <div className="footer-column">
                <p className="eyebrow">POLICY</p>
                <Link href="/operations">운영 및 데이터 정책</Link>
                <Link href="/privacy">개인정보처리방침</Link>
                <Link href="/terms">서비스 이용약관</Link>
                <CookieSettingsButton />
              </div>

              <div className="footer-column">
                <p className="eyebrow">SUPPORT</p>
                <Link href="/contact">노선 오류·데이터 제보</Link>
                <a href="http://pf.kakao.com/_FGhlX/chat" target="_blank" rel="noopener noreferrer">
                  카카오톡 채널 1:1 채팅
                </a>
                <a href="mailto:mkjmk3114@nate.com">mkjmk3114@nate.com</a>
              </div>
            </div>

            <div className="footer-meta">
              <p>© 2026 물류센터 셔틀맵.</p>
              <p>본 서비스는 쿠팡 및 관계사가 운영하는 공식 서비스가 아닙니다.</p>
            </div>
          </footer>
        </div>

        <nav className="mobile-nav" aria-label="모바일 주요 메뉴">
          <SiteNavigation mobile />
        </nav>

        <PrivacyConsent />
      </body>
    </html>
  );
}
