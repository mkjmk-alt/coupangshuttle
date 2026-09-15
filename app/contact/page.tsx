import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '문의 및 데이터 제보 | 물류센터 셔틀맵',
  description: '셔틀 노선 오류, 신규 정류장, 개인정보 및 서비스 운영 문의 채널입니다.',
  alternates: { canonical: '/contact' },
};

export default function Contact() {
  return (
    <main className="policy-page contact-page plain-content-page mx-auto max-w-5xl px-6 py-16 font-sans md:py-20">
      <div className="mb-14 space-y-4 text-center">
        <p className="text-sm font-bold text-indigo-600">문의 및 제보</p>
        <h1>문의 및 데이터 제보</h1>
        <p>노선 오류나 서비스 이용 문의는 카카오톡 또는 이메일로 보내 주세요.</p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section className="contact-panel flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2>카카오톡 채널</h2>
              <p>
                노선 오류, 신규 정류장, 시간표 변경을 빠르게 제보하기에 적합합니다. 공식 공지 또는
                변경 내용을 확인할 수 있는 이미지를 함께 보내면 검토에 도움이 됩니다.
              </p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                채널 1:1 채팅으로 문의
              </li>
              <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                사진·스크린샷 첨부 가능
              </li>
            </ul>
          </div>
          <a
            href="http://pf.kakao.com/_FGhlX/chat"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-6 py-4 text-lg font-black text-[#191919] shadow-xl shadow-yellow-50 transition hover:bg-[#FADA0A]"
          >
            카카오톡 1:1 채팅 열기
          </a>
        </section>

        <section className="contact-panel flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2>이메일 문의</h2>
              <p>
                기술 오류, 개인정보, 서비스 운영 및 제휴처럼 설명이 긴 내용은 이메일로 보내주세요.
              </p>
              <p className="contact-email">mkjmk3114@nate.com</p>
            </div>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                확인 후 순차 답변
              </li>
              <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                기술·개인정보·운영 문의
              </li>
            </ul>
          </div>
          <a
            href="mailto:mkjmk3114@nate.com"
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-6 py-4 text-lg font-black text-white shadow-xl shadow-indigo-50 transition hover:bg-slate-800"
          >
            이메일 작성하기
          </a>
        </section>
      </div>

      <section className="contact-note relative mt-14 overflow-hidden">
        <div>
          <div>
            <h2>제보할 때 알려주세요</h2>
            <p>
                센터명, 근무조, 노선명, 정류장명, 변경 전·후 내용과 확인한 날짜를 적어주세요. 가능하면
                소속 센터의 공식 공지를 함께 보내주세요.
            </p>
          </div>
          <p className="contact-note-warning">
            <b>개인정보 주의:</b> 주민등록번호, 계좌번호, 건강정보, 편집 키 등 불필요한 정보는 보내지
            마세요. 문의 내용은 카카오와 이메일 제공자의 시스템을 통해 전송됩니다.
          </p>
        </div>
      </section>

      <section className="contact-note contact-note-guidance">
        <h2>답변을 빠르게 받는 방법</h2>
        <p>
          문의 제목에 센터 코드와 노선명을 적고, 문제가 발생한 날짜·기기·화면을 함께 알려 주세요.
          제보 내용은 오류 확인과 데이터 검토에만 사용하며, 주민등록번호·계좌번호·편집 키처럼
          필요하지 않은 개인정보는 수집하지 않습니다.
        </p>
        <p>
          공개 데이터의 기준과 변경 기록은 <Link href="/operations">운영 및 데이터 정책</Link>과{' '}
          <Link href="/updates">데이터 변경 이력</Link>에서 먼저 확인할 수 있습니다.
        </p>
      </section>

      <section className="contact-resource-panel" aria-labelledby="contact-resource-title">
        <p className="eyebrow">도움말·정책</p>
        <h2 id="contact-resource-title">지도 외 안내도 여기서 확인하세요</h2>
        <p>
          노선 지도를 이용하는 방법, 자주 묻는 질문, 데이터 변경 기준과 서비스 정책을 한곳에 모았습니다.
          문의하기 전에 아래 안내를 먼저 확인하면 필요한 정보를 더 빨리 찾을 수 있습니다.
        </p>
        <div className="contact-resource-links">
          <Link href="/guide">셔틀 이용 가이드</Link>
          <Link href="/faq">자주 묻는 질문</Link>
          <Link href="/centers">센터별 정보</Link>
          <Link href="/updates">데이터 변경 이력</Link>
          <Link href="/operations">운영 및 데이터 정책</Link>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">서비스 이용약관</Link>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-bold">
        <Link href="/privacy" className="text-slate-500 hover:text-indigo-600">
          개인정보처리방침
        </Link>
        <Link href="/operations" className="text-slate-500 hover:text-indigo-600">
          운영 및 데이터 정책
        </Link>
        <Link href="/" className="text-slate-500 hover:text-indigo-600">
          지도로 돌아가기
        </Link>
      </div>
    </main>
  );
}
