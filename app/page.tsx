import ShuttleExplorer from '@/components/ShuttleExplorer';
import fs from 'fs';
import path from 'path';

type HomeStop = {
  Name?: unknown;
  Latitude?: unknown;
  Longitude?: unknown;
};

type HomeCenterData = {
  shifts?: Record<string, Record<string, HomeStop[]>>;
};

export const metadata = {
  title: '쿠팡 물류센터 셔틀버스 노선·정류장 지도',
  description: '전국 쿠팡 물류센터의 셔틀 노선, 정류장 위치와 운행 시각을 한곳에서 확인하세요.',
};

export default function Home() {
  let lastUpdated = '업데이트 기록 없음';
  let centerCount = 0;
  let routeCount = 0;
  const uniqueStops = new Set<string>();

  try {
    const metaPath = path.join(process.cwd(), 'public', 'data', 'shuttle_meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as { lastUpdated?: string };
      if (meta.lastUpdated) {
        lastUpdated = meta.lastUpdated;
      }
    }

    const dataPath = path.join(process.cwd(), 'public', 'data', 'shuttle_data.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as Record<string, HomeCenterData>;
      centerCount = Object.keys(data).length;
      Object.values(data).forEach((center) => {
        Object.values(center.shifts ?? {}).forEach((routes) => {
          Object.values(routes).forEach((stops) => {
            routeCount += 1;
            stops.forEach((stop) => {
              uniqueStops.add(`${String(stop.Name ?? '')}|${String(stop.Latitude ?? '')}|${String(stop.Longitude ?? '')}`);
            });
          });
        });
      });
    }
  } catch (err) {
    console.error('Error reading shuttle metadata or data statistics:', err);
  }

  const formattedDate = lastUpdated.replace(/-/g, '.');
  const formatCount = (value: number) => new Intl.NumberFormat('ko-KR').format(value);

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

      {/* Premium Content Sections */}
      <div className="mt-12 space-y-32">
        {/* Section 1: Guide */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 order-2 lg:order-1">
                <div className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">
                    이용 전 확인
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-outfit">
                    셔틀 이용 전 <br />
                    확인해 주세요
                </h2>
                <div className="space-y-8">
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            ⏰
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">정류장에는 여유 있게 도착</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">노선별 운행 시각은 현장 상황에 따라 달라질 수 있습니다. 탑승에 늦지 않도록 안내 시각보다 여유 있게 도착해 주세요.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            📱
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">센터별 탑승 절차 확인</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">승차권·QR 확인 여부와 사용하는 앱은 센터마다 다를 수 있습니다. 탑승 전 소속 센터의 공지를 확인해 주세요.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            🏙️
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">노선 데이터 업데이트</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">관리자가 확인한 최신 추출 데이터를 반영합니다. 공식 공지와 홈페이지 반영 시점이 다를 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="relative order-1 lg:order-2">
                <div className="absolute inset-0 bg-indigo-600/5 blur-[80px] -z-10 rounded-full"></div>
                <div className="premium-card aspect-[4/5] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000" 
                        alt="물류센터 셔틀버스 참고 이미지"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute bottom-10 left-10 z-20">
                        <p className="text-white/70 text-xs font-black tracking-widest uppercase mb-2">전국 노선 데이터</p>
                        <h4 className="text-white text-3xl font-black tracking-tight font-outfit">물류센터 셔틀 <br /> 노선 안내</h4>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 2: Stats & Social Proof */}
        <section className="premium-card p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">{formatCount(centerCount)}<span className="text-indigo-600 text-3xl lg:text-4xl">개</span></div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">센터 데이터</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">현재 {formatCount(centerCount)}개 물류센터의 셔틀 노선 정보를 제공합니다.</p>
                </div>
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">{formatCount(routeCount)}<span className="text-indigo-600 text-3xl lg:text-4xl">개</span></div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">노선·근무조 조합</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">센터와 근무조별로 구분된 노선 정보를 한곳에서 조회할 수 있습니다.</p>
                </div>
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">{formatCount(uniqueStops.size)}<span className="text-indigo-600 text-3xl lg:text-4xl">개</span></div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">정류장 위치</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">중복 노선에 포함된 정류장을 정리한 고유 위치 기준입니다.</p>
                </div>
            </div>
        </section>

        {/* Section 3: FAQ / Admin Tip */}
        <section>
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight font-outfit uppercase">이용 중 도움이 필요할 때</h2>
                <p className="text-slate-400 font-medium italic">분실물이나 운행 지연이 발생했을 때 확인할 내용을 안내합니다.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="premium-card p-10 hover:-translate-y-2">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl mb-6">🛸</div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">분실물 문의</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">버스에서 물건을 분실했다면 소속 센터 담당자 또는 해당 노선 운수사에 문의해 주세요. 이 서비스에서는 분실물을 조회하거나 접수할 수 없습니다.</p>
                </div>
                <div className="premium-card p-10 hover:-translate-y-2">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-6">❄️</div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">기상 상황에 따른 운행 변경</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">폭설·폭우 등 기상 상황에 따라 노선이 지연·우회·취소될 수 있습니다. 운행 이상이 있을 때는 소속 센터의 최신 공지를 확인해 주세요.</p>
                </div>
            </div>
        </section>

        {/* New Section 4: Operational Intelligence - Pro Tips */}
        <section className="pb-32">
            <div className="premium-card p-12 bg-indigo-50/30 border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/3 space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-indigo-50">💡</div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">셔틀 이용 전 체크리스트</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">공개된 센터 안내와 관리자가 수집한 노선 자료를 바탕으로 정리한 참고사항입니다. 실제 운영 기준은 센터 공지를 우선합니다.</p>
                    </div>
                    
                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">01</span> 사용하는 앱 확인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">센터마다 사용하는 셔틀 앱과 탑승 절차가 다를 수 있습니다. 확정 안내문이나 센터 공지에서 사용할 앱을 확인해 주세요.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">02</span> 앱 가입·승인 미리 확인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">앱 가입이나 관리자 승인이 필요한 경우가 있으므로 첫 출근 전에 이용 가능 상태를 확인해 주세요.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">03</span> 승인 전 탑승 여부 확인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">앱 승인이 완료되지 않았다면 임의로 탑승하지 말고 소속 센터 담당자에게 먼저 문의해 주세요.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">04</span> 출근 확정 정보 확인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">셔틀 이용 대상과 본인 확인 방식은 센터별 운영 기준에 따릅니다. 출근 확정 안내와 준비해야 할 정보를 미리 확인해 주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </main>
  );
}
