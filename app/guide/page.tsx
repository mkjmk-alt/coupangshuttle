import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '셔틀 이용 가이드 | 물류센터 셔틀맵',
  description: '물류센터 셔틀 노선과 정류장 정보를 읽고 탑승 전에 확인하는 방법을 안내합니다.',
  alternates: { canonical: '/guide' },
};

export default function GuidePage() {
  return (
    <main className="policy-page content-page plain-content-page mx-auto max-w-5xl px-6 py-12 text-slate-800 md:py-20">
      <header>
        <p className="mb-3 text-xs font-bold text-indigo-600">이용 안내</p>
        <h1>셔틀 이용 가이드</h1>
        <p>노선과 정류장을 확인할 때 필요한 내용을 순서대로 안내합니다.</p>
      </header>

      <div className="content-stack break-keep text-sm leading-relaxed md:text-base">
        <section className="content-callout">
          <h2>물류센터 셔틀맵은 어떤 서비스인가요?</h2>
          <p>
            물류센터 셔틀맵은 물류센터 근무자가 센터·근무조·노선별 정류장명, 주소와 운행 시각을
            빠르게 참고할 수 있도록 만든 비공식 안내 서비스입니다. 지도 화면이 익숙하지 않은
            상황에서는 <Link href="/stops">정류장 안내</Link>에서 글로 주소를 확인하고, 필요한 경우
            카카오맵이나 네이버 지도로 이동할 수 있습니다.
          </p>
          <p>
            이 사이트는 쿠팡 또는 관계사가 운영하는 공식 서비스가 아닙니다. 실제 운행 여부와
            변경 사항은 탑승 전에 소속 센터의 최신 공식 공지를 최종 기준으로 확인해 주세요.
          </p>
        </section>

        <section>
          <h2>1. 노선 조회 방법</h2>
          <ol className="content-steps">
            <li><strong>물류센터</strong>에서 근무할 센터를 선택합니다.</li>
            <li><strong>근무조</strong>를 선택하면 해당 조에서 운행하는 노선만 정리됩니다.</li>
            <li><strong>노선</strong>을 선택하고 정류장 순서, 주소, 시간을 확인합니다.</li>
            <li>여러 노선을 비교해야 한다면 조회 화면의 비교 기능을 이용합니다.</li>
          </ol>
            <p>
              선택창이 비어 있으면 센터를 먼저 선택해 주세요. 처음 선택한 센터의 정보는 불러오는 데
              잠시 시간이 걸릴 수 있습니다.
            </p>
        </section>

        <section>
          <h2>2. 정류장 정보 읽는 방법</h2>
          <p>
            정류장 목록의 번호는 노선 순서이며, 시간은 해당 정류장에서 안내된 기준 시각입니다.
            주소가 길거나 비슷한 정류장이 있으면 주소 복사 버튼을 이용해 지도 앱에서 다시 확인할
            수 있습니다. 정류장명이 검색되지 않을 때는 건물명·도로명 일부처럼 짧은 단어로 검색해
            보세요.
          </p>
          <div className="content-card-grid">
            <article className="content-card">
              <h3>주소가 가장 중요해요</h3>
              <p>정류장 이름만으로 판단하지 말고 주소와 지도 위치를 함께 비교하세요.</p>
            </article>
            <article className="content-card">
              <h3>시간은 참고 기준이에요</h3>
              <p>교통·기상·현장 운영에 따라 지연, 우회 또는 운행 변경이 발생할 수 있습니다.</p>
            </article>
          </div>
        </section>

        <section>
          <h2>3. 탑승 전 확인할 것</h2>
          <ul className="content-checklist">
            <li>출근일의 센터 공지와 근무조가 오늘 조회한 조건과 같은지 확인합니다.</li>
            <li>정류장에는 안내 시각보다 여유 있게 도착하고, 현장 표지와 기사 안내를 함께 확인합니다.</li>
            <li>폭설·폭우·교통 통제 등으로 실제 운행이 달라질 수 있다는 점을 고려합니다.</li>
            <li>분실물·탑승 승인·출근 확정 여부는 사이트가 아닌 소속 센터 또는 운수사에 문의합니다.</li>
          </ul>
        </section>

        <section className="content-callout content-callout-blue">
          <h2>데이터 출처와 한계</h2>
          <p>
            공개된 센터별 추출 자료를 기본으로 사용하고, 제보나 확인을 거친 내용은 관리자 수동
            보정으로 반영합니다. 자동 배포와 수동 변경은 서로 다른 시각으로 기록되며, 자세한 기준은
            <Link href="/operations">운영 및 데이터 정책</Link>에서 확인할 수 있습니다.
          </p>
          <p>
            공식 공지와 사이트 내용이 다르면 공식 공지를 우선해 주세요. 잘못된 주소·시간·노선은
            <Link href="/contact">문의 및 데이터 제보</Link>로 센터명, 근무조, 노선명, 변경 내용과
            확인 날짜를 함께 보내주시면 검토에 도움이 됩니다.
          </p>
        </section>
      </div>

      <div className="content-links">
        <Link href="/">노선 조회로 돌아가기</Link>
        <Link href="/faq">자주 묻는 질문 보기</Link>
        <Link href="/privacy">개인정보처리방침</Link>
      </div>
    </main>
  );
}
