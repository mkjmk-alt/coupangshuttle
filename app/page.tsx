
import ShuttleExplorer from '@/components/ShuttleExplorer';
import Image from 'next/image';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: '쿠팡 물류센터 셔틀 노선·정류장 지도 | 물류센터 셔틀맵',
  description: '쿠팡 물류센터 근무자를 위한 비공식 셔틀 노선 안내입니다. 센터·근무조별 정류장 위치와 운행 시각을 확인하세요.',
  alternates: { canonical: '/' },
};

export default function Home() {
  let lastUpdated = '업데이트 기록 없음';

  try {
    const metaPath = path.join(process.cwd(), 'public', 'data', 'shuttle_meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { lastUpdated?: string };
      if (meta.lastUpdated) {
        lastUpdated = meta.lastUpdated;
      }
    }

  } catch (err) {
    console.error('Error reading shuttle metadata:', err);
  }

  const formattedDate = lastUpdated.replace(/-/g, '.');

  return (
    <main className="home-page max-w-7xl mx-auto px-4 md:px-6 lg:px-12 overflow-x-hidden">
      <header className="home-hero">
        <svg
          className="hero-background-route"
          viewBox="0 0 1280 360"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M-40 286C128 286 154 174 322 174H604C770 174 728 300 922 300H1320" />
          <path d="M224 -24C224 82 296 126 414 126H760" />
          <circle cx="322" cy="174" r="11" />
          <circle cx="604" cy="174" r="11" />
          <circle className="hero-background-route-stop" cx="922" cy="300" r="13" />
        </svg>
        <div className="hero-main">
          <div className="hero-intro">
            <h1 className="display-title">
              쿠팡 물류센터
              <span className="text-gradient">셔틀 노선</span>
            </h1>
            <p className="hero-copy">센터·근무조별 정류장과 운행 시각을 확인하세요.</p>
            <p className="hero-service-note">쿠팡 물류센터 근무자를 위한 비공식 노선 안내입니다.</p>
            <div className="update-pill">
              <span className="status-dot" aria-hidden="true" />
              <span>데이터 최종 업데이트 · {formattedDate}</span>
            </div>
          </div>
          <div className="hero-art">
            <Image
              className="hero-icon"
              src="/shuttle-pastel.jpg"
              alt="동네 지도와 셔틀 노선 위에 세워진 파란 버스 정류장 표지판"
              width={240}
              height={240}
              preload
            />
          </div>
        </div>
      </header>

      {/* Main Interactive System */}
      <ShuttleExplorer />

      <div className="home-guide-wrap">
        <section className="home-guide premium-card">
          <div>
            <p className="eyebrow">HOW TO RIDE</p>
            <h2>
              필요한 내용만 확인하세요
            </h2>
            <p className="guide-intro">
              실제 탑승 기준과 운행 변경 사항은 소속 센터의 최신 공식 공지를 우선합니다.
            </p>
          </div>

          <div className="guide-grid">
            <details className="guide-item">
              <summary>운행 시각·기상 변화</summary>
              <p>
                정류장에는 여유 있게 도착해 주세요. 폭설·폭우 등 현장 상황에 따라 운행이
                지연·우회·취소될 수 있습니다.
              </p>
            </details>
            <details className="guide-item">
              <summary>앱·승인·본인 확인</summary>
              <p>
                사용하는 앱과 승인 절차는 센터마다 다를 수 있습니다. 출근 확정 안내와 탑승
                가능 상태를 미리 확인해 주세요.
              </p>
            </details>
            <details className="guide-item">
              <summary>분실물 문의</summary>
              <p>
                버스에서 물건을 분실했다면 소속 센터 담당자 또는 해당 노선 운수사에 문의해
                주세요. 이 서비스에서는 분실물을 접수하지 않습니다.
              </p>
            </details>
            <details className="guide-item">
              <summary>데이터 업데이트 기준</summary>
              <p>
                관리자가 확인한 추출 데이터를 반영합니다. 공식 공지와 홈페이지 반영 시점이
                다를 수 있습니다.
              </p>
            </details>
          </div>
        </section>

        <section className="home-resources premium-card" aria-labelledby="home-resources-title">
          <div>
            <p className="eyebrow">HELP &amp; DATA</p>
            <h2 id="home-resources-title">처음 이용한다면 이 내용을 먼저 확인하세요</h2>
            <p className="guide-intro">
              노선과 정류장 데이터만 보여드리는 데서 그치지 않고, 조회 결과를 어떻게 읽고 공식 공지와
              어떻게 비교해야 하는지도 안내합니다.
            </p>
          </div>
          <div className="resource-grid">
            <Link href="/guide" className="resource-link">
              <span>01</span>
              <strong>셔틀 이용 가이드</strong>
              <p>센터 선택부터 탑승 전 확인까지 순서대로 읽어 보세요.</p>
            </Link>
            <Link href="/faq" className="resource-link">
              <span>02</span>
              <strong>자주 묻는 질문</strong>
              <p>시간 변경, 주소 오류, 공식 공지 우선 원칙을 확인하세요.</p>
            </Link>
            <Link href="/operations" className="resource-link">
              <span>03</span>
              <strong>데이터 운영 정책</strong>
              <p>자료 출처와 자동 배포·수동 보정의 차이를 공개합니다.</p>
            </Link>
          </div>
        </section>


      </div>
    </main>
  );
}
