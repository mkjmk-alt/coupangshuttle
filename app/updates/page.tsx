import type { Metadata } from 'next';
import Link from 'next/link';
import { readPublicChangelog } from '@/utils/changelogSummary';

export const metadata: Metadata = {
  title: '데이터 변경 이력 | 물류센터 셔틀맵',
  description: '물류센터 셔틀 노선과 정류장 데이터가 언제, 어떤 범위로 바뀌었는지 요약해서 확인하세요.',
  alternates: { canonical: '/updates' },
};

const CHANGELOG_PATH = `${process.cwd()}/public/data/shuttle_changelog.json`;

export default function UpdatesPage() {
  const entries = readPublicChangelog(CHANGELOG_PATH);

  return (
    <main className="policy-page content-page plain-content-page updates-page mx-auto max-w-5xl px-6 py-12 text-slate-800 md:py-20">
      <header>
        <p className="mb-3 text-xs font-bold text-indigo-600">데이터 변경 이력</p>
        <h1>무엇이 언제 바뀌었는지 확인하세요</h1>
        <p>공개된 셔틀 자료를 기준으로 최근 변경 범위를 요약해 보여드립니다.</p>
      </header>

      <section className="content-callout updates-intro">
        <h2>변경 이력을 공개하는 이유</h2>
        <p>
          정류장과 운행 시간은 현장 사정에 따라 달라질 수 있습니다. 이 페이지에서는 원본 비교 자료나 외부
          파일을 그대로 공개하지 않고, 변경 시각과 영향을 받은 범위만 정리합니다.
        </p>
        <p>
          아래 기록은 참고용 요약입니다. 실제 탑승 전에는 소속 센터의 최신 공식 공지를 확인하고, 오류가 있으면{' '}
          <Link href="/contact">문의 및 데이터 제보</Link>로 알려 주세요.
        </p>
      </section>

      <section className="updates-list" aria-labelledby="updates-list-title">
        <div className="content-section-heading">
          <p className="eyebrow">최근 기록</p>
          <h2 id="updates-list-title">데이터 변경 내역</h2>
        </div>

        {entries.length > 0 ? (
          <div className="updates-entries">
            {entries.map((entry) => (
              <article key={entry.id} className="updates-entry">
                <div className="updates-entry-heading">
                  <div>
                    <p className="updates-entry-date">{entry.timestamp}</p>
                    <h3>{entry.summary}</h3>
                  </div>
                  <span>{entry.sourceLabel}</span>
                </div>
                <dl className="updates-entry-stats">
                  <div><dt>영향 센터</dt><dd>{entry.affectedCenters.length}개</dd></div>
                  <div><dt>변경 노선</dt><dd>{entry.routesChanged}개</dd></div>
                  <div><dt>변경 정류장</dt><dd>{entry.stopsChanged}개</dd></div>
                </dl>
                {entry.affectedCenters.length > 0 && (
                  <p className="updates-entry-centers">영향 센터: {entry.affectedCenters.join(', ')}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="content-empty-state">
            <strong>공개할 변경 이력이 없습니다.</strong>
            <p>데이터가 추가되면 이곳에 요약해서 안내합니다.</p>
          </div>
        )}
      </section>

      <div className="content-links">
        <Link href="/centers">센터별 정보 보기</Link>
        <Link href="/stops">정류장 안내로 이동</Link>
        <Link href="/operations">운영 및 데이터 정책</Link>
      </div>
    </main>
  );
}
