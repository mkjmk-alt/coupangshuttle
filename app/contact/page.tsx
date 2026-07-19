import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '문의 및 데이터 제보 | Coupang Shuttle Map',
  description: '셔틀 노선 오류, 신규 정류장, 개인정보 및 서비스 운영 문의 채널입니다.',
};

export default function Contact() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 font-sans md:py-20">
      <div className="mb-14 space-y-4 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
            Support & Data Feedback
          </span>
        </div>
        <h1 className="font-outfit text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
          문의 및 데이터 제보
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-medium text-slate-500 md:text-xl">
          별도 로그인 없이 카카오톡 채널이나 이메일로 문의할 수 있습니다.
          <br className="hidden md:block" /> 확인한 문의부터 순차적으로 답변드리겠습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section className="premium-card flex flex-col justify-between p-8 transition-all hover:border-yellow-400/50 md:p-10">
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE500] text-3xl shadow-lg shadow-yellow-100">
              💬
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">카카오톡 채널</h2>
              <p className="font-medium leading-relaxed text-slate-500">
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

        <section className="premium-card flex flex-col justify-between p-8 transition-all hover:border-indigo-400/50 md:p-10">
          <div className="space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl shadow-lg shadow-slate-100">
              ✉️
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">이메일 문의</h2>
              <p className="font-medium leading-relaxed text-slate-500">
                기술 오류, 개인정보, 서비스 운영 및 제휴처럼 설명이 긴 내용은 이메일로 보내주세요.
              </p>
              <p className="font-bold text-indigo-600">mkjmk3114@nate.com</p>
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

      <section className="premium-card relative mt-14 overflow-hidden border-none bg-slate-50 p-8 md:p-12">
        <div className="relative z-10 grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
          <div className="text-5xl">📝</div>
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">제보할 때 알려주세요</h2>
              <p className="mt-2 font-medium leading-relaxed text-slate-500">
                센터명, 근무조, 노선명, 정류장명, 변경 전·후 내용과 확인한 날짜를 적어주세요. 가능하면
                소속 센터의 공식 공지를 함께 보내주세요.
              </p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-white p-4 text-sm leading-relaxed text-slate-600">
              <b className="text-rose-600">개인정보 주의:</b> 주민등록번호, 계좌번호, 건강정보, 편집 키
              등 문의 처리에 필요하지 않은 정보는 보내지 마세요. 문의는 카카오와 이메일 제공자의
              시스템을 통해 전송됩니다.
            </div>
          </div>
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
          노선 조회로 돌아가기
        </Link>
      </div>
    </main>
  );
}
