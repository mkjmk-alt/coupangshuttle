import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의하기 | 쿠팡 셔틀버스 지도 앱',
  description: '쿠팡 셔틀버스 지도 앱 이용 중 발생한 오류나 잘못된 노선 정보 제보 등을 문의해 주세요.',
};

export default function Contact() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 font-sans">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Customer Support & Data Feedback</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight font-outfit">문의 및 데이터 제보</h1>
        <p className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto break-keep">
          정확한 정보를 위해 여러분의 소중한 제보를 기다립니다. <br className="hidden md:block" />
          가장 빠르고 정확한 소통 채널을 이용해 보세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* KakaoTalk Business Channel */}
        <div className="premium-card p-10 flex flex-col justify-between group hover:border-yellow-400/50 transition-all">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-[#FEE500] rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-yellow-100 group-hover:rotate-12 transition-transform">
                💬
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">카카오톡 채널 (비즈니스)</h3>
                <p className="text-slate-500 font-medium leading-relaxed break-keep">
                    실시간 채팅을 통해 노선 오류나 신규 정류장을 즉시 제보할 수 있습니다. 이미지를 첨부하여 더욱 정확한 정보를 전달해 주세요.
                </p>
            </div>
            <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    실시간 1:1 채팅 상담
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                    중요 공지사항 푸시 알림
                </li>
            </ul>
          </div>
          <a 
            href="https://pf.kakao.com/_YOUR_CHANNEL_ID" 
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 w-full bg-[#FEE500] text-[#191919] font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#FADA0A] transition shadow-xl shadow-yellow-50"
          >
            카톡 채널 추가하기
          </a>
        </div>

        {/* Official Email / Bug Report */}
        <div className="premium-card p-10 flex flex-col justify-between group hover:border-indigo-400/50 transition-all">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-slate-100 group-hover:-rotate-12 transition-transform">
                ✉️
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">공식 이메일 및 제휴</h3>
                <p className="text-slate-500 font-medium leading-relaxed break-keep">
                    기술적 버그 리포트나 서비스 제휴, 기타 대량 데이터 제공 등 카톡으로 문의하기 어려운 내용은 이메일로 보내주시기 바랍니다.
                </p>
            </div>
            <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    24시간 이내 답변 (영업일 기준)
                </li>
                <li className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    기술 지원 및 오류 해결
                </li>
            </ul>
          </div>
          <a 
            href="mailto:support@shuttlemap.example.com" 
            className="mt-10 w-full bg-slate-950 text-white font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition shadow-xl shadow-indigo-50"
          >
            이메일 문의하기
          </a>
        </div>
      </div>

      <div className="mt-20 premium-card p-8 md:p-12 bg-slate-50 border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 rotate-6 translate-x-12"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="text-6xl">📝</div>
            <div className="space-y-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">제보 시 꿀팁!</h4>
                <p className="text-slate-500 font-medium leading-relaxed break-keep">
                    변경된 노선의 <b>정확한 센터명</b>과 <b>정류장 이름</b>, 그리고 가능하다면 <b>지도 핀 위치를 스크린샷</b>으로 찍어서 보내주시면 데이터 반영 속도가 훨씬 빨라집니다.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
