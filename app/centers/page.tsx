import type { Metadata } from 'next';
import Link from 'next/link';
import CenterDirectory from '@/components/CenterDirectory';
import { getCenterDirectory, readDataMetadata } from '@/utils/centerDirectory';

export const metadata: Metadata = {
  title: '물류센터 목록 | 물류센터 셔틀맵',
  description: '물류센터별 셔틀 노선, 근무조와 정류장 수를 확인하고 정류장 안내로 이동하세요.',
  alternates: { canonical: '/centers' },
};

export default function CentersPage() {
  const centers = getCenterDirectory();
  const metadata = readDataMetadata();

  return (
    <main className="policy-page content-page plain-content-page centers-page mx-auto max-w-6xl px-6 py-12 text-slate-800 md:py-20">
      <header>
        <p className="mb-3 text-xs font-bold text-indigo-600">센터 안내</p>
        <h1>물류센터별 셔틀 정보</h1>
        <p>센터를 먼저 찾은 뒤 근무조와 노선을 확인해 보세요.</p>
      </header>

      <section className="content-callout centers-intro">
        <h2>이 목록은 어떻게 만들어졌나요?</h2>
        <p>
          공개된 센터별 셔틀 자료를 센터 단위로 정리한 목록입니다. 센터를 선택하면 근무조별 노선 수와
          정류장 수를 먼저 확인할 수 있고, 정류장 안내에서 주소와 시간을 글로 조회할 수 있습니다.
        </p>
        <p>
          데이터 기준일은 <strong>{metadata.lastUpdated || '확인되지 않음'}</strong>입니다. 실제 탑승 전에는
          소속 센터의 최신 공식 공지를 우선해 주세요.
        </p>
      </section>

      <CenterDirectory items={centers} />

      <div className="content-links">
        <Link href="/stops">정류장 안내로 이동</Link>
        <Link href="/updates">데이터 변경 이력</Link>
        <Link href="/operations">운영 및 데이터 정책</Link>
      </div>
    </main>
  );
}
