import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { collectQualityWarnings, summarizeCenter } from '@/utils/dataSummary';
import { getCenterCodes, readCenter, readDataMetadata } from '@/utils/centerDirectory';

interface CenterDetailPageProps {
  params: Promise<{ code: string }>;
}

export function generateStaticParams() {
  return getCenterCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }: CenterDetailPageProps): Promise<Metadata> {
  const { code } = await params;
  const center = readCenter(decodeURIComponent(code));
  if (!center) return { title: '센터를 찾을 수 없음 | 물류센터 셔틀맵' };

  const name = typeof center.center?.name === 'string' ? center.center.name : code;
  return {
    title: `${name} 셔틀 노선·정류장 | 물류센터 셔틀맵`,
    description: `${name}의 근무조별 셔틀 노선 수와 정류장 정보를 확인하고 정류장 안내로 이동하세요.`,
    alternates: { canonical: `/centers/${encodeURIComponent(code)}` },
  };
}

export default async function CenterDetailPage({ params }: CenterDetailPageProps) {
  const { code: encodedCode } = await params;
  const code = decodeURIComponent(encodedCode);
  const center = readCenter(code);
  if (!center) notFound();

  const dataMetadata = readDataMetadata();
  const summary = summarizeCenter(center, dataMetadata.lastUpdated ?? '');
  const warnings = collectQualityWarnings(center);
  const routeSummaries = Object.entries(center.shifts ?? {}).map(([shift, routes]) => ({
    shift,
    routes: Object.entries(routes).map(([route, stops]) => ({ route, stopCount: stops.length })),
  }));

  return (
    <main className="policy-page content-page plain-content-page center-detail-page mx-auto max-w-5xl px-6 py-12 text-slate-800 md:py-20">
      <header>
        <p className="mb-3 text-xs font-bold text-indigo-600">센터 정보 · {summary.code}</p>
        <h1>{summary.name}</h1>
        <p>{summary.address || '센터 주소가 등록되지 않았습니다.'}</p>
      </header>

      <section className="center-detail-summary" aria-label="센터 데이터 요약">
        <div><strong>{summary.shiftCount}</strong><span>근무조</span></div>
        <div><strong>{summary.routeCount}</strong><span>노선</span></div>
        <div><strong>{summary.stopCount}</strong><span>정류장</span></div>
      </section>

      <section className={`content-callout ${summary.freshness.status === 'stale' ? 'content-callout-warning' : ''}`}>
        <h2>데이터 확인 기준</h2>
        <p>
          이 센터 정보는 <strong>{summary.freshness.reviewedAt || '확인되지 않은 날짜'}</strong> 기준으로
          정리되었습니다. {summary.freshness.label}
        </p>
        <p>실제 운행 여부와 변경 사항은 소속 센터의 최신 공식 공지를 최종 기준으로 확인해 주세요.</p>
      </section>

      {warnings.length > 0 && (
        <section className="content-callout content-callout-warning" aria-label="검수 안내">
          <h2>추가 확인이 필요한 정보</h2>
          <p>
            이 센터에는 자동 검사에서 확인이 필요한 항목 {warnings.length}건이 있습니다. 주소·시간·지도 위치가
            현장 안내와 다르면 공식 안내를 우선하고 <Link href="/contact">오류를 제보해 주세요</Link>.
          </p>
        </section>
      )}

      <section className="center-route-summary">
        <div className="content-section-heading">
          <p className="eyebrow">노선 구성</p>
          <h2>근무조별 노선</h2>
        </div>
        <div className="center-shift-list">
          {routeSummaries.map(({ shift, routes }) => (
            <article key={shift} className="center-shift-item">
              <h3>{shift}</h3>
              <ul>
                {routes.map(({ route, stopCount }) => (
                  <li key={route}><span>{route}</span><strong>{stopCount}개 정류장</strong></li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="content-callout content-callout-blue">
        <h2>정류장 주소와 시간 확인</h2>
        <p>센터와 근무조·노선을 선택하면 정류장 순서, 주소, 탑승 시각을 글로 확인할 수 있습니다.</p>
        <Link className="center-detail-primary-link" href={`/stops?center=${encodeURIComponent(summary.code)}`}>
          {summary.name} 정류장 조회
        </Link>
      </section>

      <div className="content-links">
        <Link href="/centers">센터 목록으로 돌아가기</Link>
        <Link href="/updates">데이터 변경 이력</Link>
        <Link href="/operations">운영 및 데이터 정책</Link>
      </div>
    </main>
  );
}
