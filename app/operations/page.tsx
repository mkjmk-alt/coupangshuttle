import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '운영 및 데이터 정책 | 물류센터 셔틀맵',
  description: '셔틀 데이터 출처, 업데이트 시각, 변경 로그와 오류 제보 처리 기준입니다.',
  alternates: { canonical: '/operations' },
};

const items = [
  {
    title: '전체 자동 배포',
    badge: '작업당 로그 1건',
    body: '전체 센터 데이터를 추출·병합한 시각, 변경된 센터·노선·정류장 수와 영향 범위를 하나의 요약 로그로 기록합니다. 자동 배포에서는 모든 정류장의 전·후 원문을 중복 보관하지 않습니다.',
  },
  {
    title: '관리자 수동 저장',
    badge: '정류장별 전·후 기록',
    body: '관리자가 편집 화면에서 직접 저장한 정류장 변경은 추가·수정·삭제 구분, 변경 필드, 변경 전 데이터와 변경 후 데이터를 작업 로그 안에 기록합니다.',
  },
  {
    title: '로그 보관 범위',
    badge: '최신 100개 작업',
    body: '자동 배포와 수동 저장을 합쳐 최신 100개 작업 로그를 유지합니다. 한 번의 수동 저장에는 최대 500개 정류장 변경을 기록할 수 있으며, 한도를 넘으면 나누어 저장해야 합니다.',
  },
];

export default function OperationsPolicy() {
  return (
    <main className="policy-page operations-page plain-content-page mx-auto max-w-5xl px-6 py-12 text-slate-800 md:py-20">
      <div className="mb-12 border-b-2 border-slate-900 pb-8">
        <p className="mb-3 text-xs font-bold text-indigo-600">운영 기준</p>
        <h1 className="mb-4 text-3xl font-bold">운영 및 데이터 정책</h1>
        <p className="text-sm text-slate-600">기준일 2026년 7월 19일</p>
      </div>

      <div className="space-y-12 break-keep text-sm leading-relaxed md:text-base">
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6">
          <h2 className="text-lg font-bold text-slate-900">운영 원칙</h2>
          <p className="mt-2 text-slate-700">
            셔틀 정보를 가능한 최신 상태로 유지하고, 자동 배포와 관리자의 수동 보정을 구분해
            기록합니다. 다만 이 사이트는 비공식 참고 자료이므로 실제 탑승 전 소속 센터의 공식 공지를
            최종 확인해야 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            1. 데이터 구성과 우선순위
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>운영자가 확보한 전체 센터 추출 데이터를 자동 배포의 기본 자료로 사용합니다.</li>
            <li>
              현장과 다른 정류장명·주소·좌표·시간 등은 관리자 편집 화면에서 수동 보정할 수 있습니다.
            </li>
            <li>
              이후 전체 데이터가 다시 배포될 때 공식 추출본 자체가 변경된 항목은 새 추출본을 우선하고,
              공식 자료가 바뀌지 않은 항목에는 기존 수동 보정을 유지합니다.
            </li>
            <li>소속 센터의 최신 공식 공지와 현장 안내는 사이트 데이터보다 항상 우선합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            2. 업데이트 날짜와 시간의 의미
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 p-6">
              <p className="font-bold text-indigo-700">최신 자동 배포일</p>
              <p className="mt-2 text-slate-600">
                전체 데이터 병합이 성공해 배포용 데이터와 메타데이터가 저장된 한국시간(KST)입니다.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 p-6">
              <p className="font-bold text-amber-700">최신 수동 변경일</p>
              <p className="mt-2 text-slate-600">
                관리자가 편집 화면에서 데이터를 저장하거나 병합해 변경이 기록된 한국시간(KST)입니다.
              </p>
            </div>
          </div>
          <p className="mt-4 text-slate-600">
            두 시각은 서로 독립적으로 관리됩니다. 전체 자동 배포는 자동 배포 시각만, 수동 저장은
            수동 변경 시각만 갱신합니다. 홈페이지의 &quot;Latest Update&quot;는 실제 공개 데이터가
            마지막으로 갱신된 시각을 표시합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            3. 변경 로그 기록 방식
          </h2>
          <div className="grid gap-5">
            {items.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    {item.badge}
                  </span>
                </div>
                <p className="mt-3 text-slate-600">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-slate-600">
            변경 로그는 관리자 편집 페이지에서 편집 키 인증 후 확인합니다. 로그에는 관리자 편집 키나
            일반 이용자의 이름·연락처를 기록하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            4. 오류 제보와 반영 절차
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              이용자가 센터명, 근무조, 노선명, 정류장명, 변경 내용과 근거 자료를 카카오톡 또는
              이메일로 제보합니다.
            </li>
            <li>운영자가 공식 공지, 기존 데이터 및 제보 내용을 비교해 확인합니다.</li>
            <li>확인된 변경은 수동 보정하거나 다음 전체 자동 배포에 반영합니다.</li>
            <li>
              안전이나 실제 탑승에 중대한 영향을 줄 수 있는 정보는 확인이 끝날 때까지 반영을
              보류하거나 주의 문구를 표시할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            5. 문의 채널
          </h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p>
              카카오톡:{' '}
              <a
                className="font-bold text-indigo-600 underline"
                href="http://pf.kakao.com/_FGhlX/chat"
                target="_blank"
                rel="noopener noreferrer"
              >
                채널 1:1 채팅
              </a>
            </p>
            <p className="mt-2">
              이메일:{' '}
              <a className="font-bold text-indigo-600 underline" href="mailto:mkjmk3114@nate.com">
                mkjmk3114@nate.com
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            6. 데이터 출처와 검수 기준
          </h2>
          <p>
            공개된 센터별 추출 자료를 기본 데이터로 사용하고, 운영자가 확인한 현장 정보나 이용자
            제보는 공식 공지·기존 데이터·변경 시점을 비교한 뒤 수동 보정으로 반영합니다. 제보만으로
            확인되지 않은 내용을 즉시 확정하지 않으며, 실제 탑승에 영향을 줄 수 있는 변경은 근거를
            확인할 때까지 주의 문구를 유지할 수 있습니다.
          </p>
          <p className="mt-4">
            홈페이지에 표시되는 최종 업데이트 시각은 공개 데이터가 마지막으로 갱신된 기준입니다.
            해당 시각이 최근이라고 해서 실시간 운행을 보장하는 것은 아니며, 센터의 당일 공지와 현장
            안내가 항상 우선합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-5 border-b border-slate-200 pb-2 text-xl font-bold">
            7. 정보가 다를 때의 처리
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>탑승 전에는 소속 센터의 공식 공지와 현장 안내를 먼저 확인합니다.</li>
            <li>사이트와 공식 안내가 다르면 공식 안내를 기준으로 이동하고, 사이트 오류를 제보합니다.</li>
            <li>제보에는 센터명, 근무조, 노선명, 정류장명, 확인 날짜와 변경 근거를 포함합니다.</li>
            <li>운영자는 확인된 내용만 반영하며, 반영 전까지는 불확실한 정보를 사실처럼 표시하지 않습니다.</li>
          </ol>
          <p className="mt-4">
            사이트 운영 방식과 이용 방법을 처음 확인하는 분은 <Link href="/guide">셔틀 이용 가이드</Link>와{' '}
            <Link href="/faq">자주 묻는 질문</Link>을 함께 읽어 주세요.
          </p>
        </section>

        <div className="flex flex-wrap gap-6 border-t border-slate-200 pt-8">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            홈페이지 메인
          </Link>
          <Link href="/guide" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            셔틀 이용 가이드
          </Link>
          <Link href="/faq" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            자주 묻는 질문
          </Link>
          <Link href="/privacy" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            서비스 이용약관
          </Link>
          <Link href="/contact" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            문의 및 데이터 제보
          </Link>
        </div>
      </div>
    </main>
  );
}
