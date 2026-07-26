
import ShuttleExplorer from '@/components/ShuttleExplorer';
import fs from 'fs';
import path from 'path';

export const metadata = {
  title: '쿠팡 물류센터 셔틀버스 노선·정류장 지도',
  description: '전국 쿠팡 물류센터의 셔틀 노선, 정류장 위치와 운행 시각을 한곳에서 확인하세요.',
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
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 font-sans overflow-x-hidden">
      {/* Premium Hero Header */}
      <header className="relative pb-12 pt-8 text-center sm:pb-16 sm:pt-12 md:pb-24 md:pt-20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 opacity-60"></div>
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-purple-100 rounded-full blur-[60px] -z-10 animate-pulse"></div>
        
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 animate-in slide-in-from-top duration-700 md:mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">데이터 최종 업데이트: {formattedDate}</span>
        </div>
        
        <h1 className="mb-5 text-4xl font-[900] leading-[1.1] tracking-tighter text-slate-900 animate-in slide-in-from-bottom duration-700 delay-100 sm:text-5xl md:mb-8 md:text-7xl md:leading-[1.05]">
            내 출퇴근 노선을 <br />
            <span className="text-gradient">더 쉽고 빠르게</span>
        </h1>
        
        <p className="mx-auto max-w-2xl break-keep text-base font-medium leading-relaxed text-slate-500 animate-in slide-in-from-bottom duration-700 delay-200 sm:text-lg md:text-xl">
          쿠팡 물류센터 근무자를 위한 비공식 셔틀 노선 안내 서비스입니다. 센터·근무조별 노선과 정류장 위치를 간편하게 확인해 보세요.
        </p>
      </header>

      {/* Critical Disclaimer Banner */}
      <section className="mb-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
          <div className="premium-card bg-amber-50/40 border-amber-200/40 p-4 md:p-5 flex flex-row items-center gap-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-amber-100 shrink-0 group-hover:rotate-12 transition-transform duration-500">
                  ⚠️
              </div>
              <div className="space-y-1">
                  <h4 className="text-amber-900 font-black text-[10px] uppercase tracking-[0.2em]">이용 전 필수 확인</h4>
                  <p className="text-amber-800 text-sm font-semibold leading-snug break-keep">
                      이 서비스의 노선과 운행 시각은 참고용입니다. 실제 운행은 센터 상황에 따라 변경될 수 있으므로 탑승 전 반드시 <strong>소속 센터의 최신 공식 공지</strong>를 확인해 주세요.
                  </p>
              </div>
          </div>
      </section>

      {/* Main Interactive System */}
      <ShuttleExplorer />

      <div className="mt-10 space-y-10 md:mt-14 md:space-y-12">
        <section className="premium-card p-5 sm:p-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
              이용 안내·도움말
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              필요한 내용만 확인하세요
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
              실제 탑승 기준과 운행 변경 사항은 소속 센터의 최신 공식 공지를 우선합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <details className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <summary className="cursor-pointer font-black text-slate-900">운행 시각·기상 변화</summary>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                정류장에는 여유 있게 도착해 주세요. 폭설·폭우 등 현장 상황에 따라 운행이
                지연·우회·취소될 수 있습니다.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <summary className="cursor-pointer font-black text-slate-900">앱·승인·본인 확인</summary>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                사용하는 앱과 승인 절차는 센터마다 다를 수 있습니다. 출근 확정 안내와 탑승
                가능 상태를 미리 확인해 주세요.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <summary className="cursor-pointer font-black text-slate-900">분실물 문의</summary>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                버스에서 물건을 분실했다면 소속 센터 담당자 또는 해당 노선 운수사에 문의해
                주세요. 이 서비스에서는 분실물을 접수하지 않습니다.
              </p>
            </details>
            <details className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <summary className="cursor-pointer font-black text-slate-900">데이터 업데이트 기준</summary>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                관리자가 확인한 추출 데이터를 반영합니다. 공식 공지와 홈페이지 반영 시점이
                다를 수 있습니다.
              </p>
            </details>
          </div>
        </section>


      </div>
    </main>
  );
}
