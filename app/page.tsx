import ShuttleExplorer from '@/components/ShuttleExplorer';

export const metadata = {
  title: '쿠팡 셔틀버스 지도 앱 - 스마트 정류장 조회 시스템',
  description: '전국 쿠팡 물류센터(동탄, 인천, 고양, 여주 등) 셔틀버스 정류장 위치와 실시간 시간표를 최첨단 지도로 확인하세요.',
}

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 font-sans overflow-x-hidden">
      {/* Premium Hero Header */}
      <header className="relative pt-20 pb-24 text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-50/50 rounded-full blur-[120px] -z-10 opacity-60"></div>
        <div className="absolute top-20 left-1/4 w-32 h-32 bg-purple-100 rounded-full blur-[60px] -z-10 animate-pulse"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 mb-8 animate-in slide-in-from-top duration-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Latest Update: Mar 2026</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-[900] text-slate-900 mb-8 tracking-tighter leading-[1.1] md:leading-[1.05] animate-in slide-in-from-bottom duration-700 delay-100">
            당신의 출퇴근이 <br />
            <span className="text-gradient">더욱 완벽해지도록</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium break-keep animate-in slide-in-from-bottom duration-700 delay-200">
          국내 최대 물류 네트워크, 쿠팡 물류센터 임직원을 위한 비공식 인텔리전트 셔틀버스 가이드 시스템입니다.
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
                  <h4 className="text-amber-900 font-black text-[10px] uppercase tracking-[0.2em]">Official Directive / 필수 확인</h4>
                  <p className="text-amber-800 text-sm font-semibold leading-snug break-keep">
                      본 시스템은 참고용 자료입니다. <span className="bg-amber-200/50 px-1 rounded text-amber-950 underline decoration-amber-500 decoration-1 underline-offset-2">운영 지침은 각 센터별로 상이하므로</span> 탑승 전 반드시 <strong>소속 물류센터 공식 공지</strong>를 최종 확인하시기 바랍니다.
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
                    Protocol & Guidelines
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight font-outfit">
                    안전하고 스마트한 <br />
                    탑승을 위한 서비스 가이드
                </h2>
                <div className="space-y-8">
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            ⏰
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">프리시전 타이밍 (Precision Timing)</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">셔틀버스는 정해진 시간에 엄격히 출발합니다. 교통 상황 변동을 고려하여 안내된 시각 10분 전 정류장 도착을 강력히 권장합니다.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            📱
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">모바일 승차권 검증</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">쿠팡 전용 각 센터 셔틀버스 앱을 통한 디지털 승차권 발권이 필수입니다. 차량 입구의 스캐너에 QR 코드를 인식시켜 주십시오.</p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="w-14 h-14 shrink-0 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                            🏙️
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">최신 노선 DB 업데이트</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">본 시스템은 정기적인 데이터 동기화를 통해 가장 최신의 노선 변경 사항과 신설 정류장 정보를 실시간으로 반영합니다.</p>
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
                        alt="Shuttle Bus Service" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute bottom-10 left-10 z-20">
                        <p className="text-white/70 text-xs font-black tracking-widest uppercase mb-2">Infrastructure</p>
                        <h4 className="text-white text-3xl font-black tracking-tight font-outfit">Premium Delivery <br /> Shuttle Network</h4>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 2: Stats & Social Proof */}
        <section className="premium-card p-12 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">72<span className="text-indigo-600">+</span></div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">Coupang Centers</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">전국 70개 이상의 물류센터 노선 정보를 통합 관리합니다.</p>
                </div>
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">1,820<span className="text-indigo-600">+</span></div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">Smart Hubs</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">전국 도심 곳곳의 세밀한 정류장 포인트를 지도에 시각화합니다.</p>
                </div>
                <div className="space-y-4">
                    <div className="text-5xl lg:text-7xl font-black text-slate-900 font-outfit tracking-tighter">Real<span className="text-indigo-600">-</span>Time</div>
                    <p className="text-indigo-500 font-black text-xs uppercase tracking-[0.3em]">Cloud Sync</p>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">매시간 전국 노선 변동 사항을 실시간으로 추적하고 반영합니다.</p>
                </div>
            </div>
        </section>

        {/* Section 3: FAQ / Admin Tip */}
        <section>
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight font-outfit uppercase">Administrative Assistance</h2>
                <p className="text-slate-400 font-medium italic">이용 중 발생할 수 있는 주요 상황에 대한 대응 가이드입니다.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="premium-card p-10 hover:-translate-y-2">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl mb-6">🛸</div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">분실물 가이드 (Lost & Found)</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">버스 내부에서 개인 소지품을 분실한 경우, 해당 노선 운수사 또는 센터 보안 데스크를 통해 즉시 신고해 주시기 바랍니다. 본 시스템은 노선 확인용으로 분실물 조회가 불가능합니다.</p>
                </div>
                <div className="premium-card p-10 hover:-translate-y-2">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl mb-6">❄️</div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">계절별 운행 안내</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">동절기 및 하절기 기상 악화(폭설, 폭우) 시 일부 노선이 지연되거나 우회할 수 있습니다. 시스템에 표시된 시간보다 지연될 경우 셔틀 관리자의 공지를 확인하세요.</p>
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
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">SHUTTLE PRO TIPS</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">공식 홈페이지와 실제 이용자들의 데이터를 분석하여 정리한 셔틀 이용 꿀팁입니다.</p>
                    </div>
                    
                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">01</span> 센터별 앱 확인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">대부분의 센터가 <b>&apos;헬로버스&apos;</b> 앱을 사용하지만, <b>고양 센터</b> 등 일부는 <b>&apos;모빌리티지&apos;</b> 앱을 개별적으로 사용하니 반드시 센터 공지를 확인하세요.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">02</span> 신규 이용 승인
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">처음 이용 시 앱 설치 후 <b>&apos;사용 신청&apos;</b>을 해야 하며, 담당자 승인까지 시간이 소요될 수 있으므로 확정 문자를 받자마자 미리 신청하는 것이 좋습니다.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">03</span> 첫 탑승 예외 허용
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">승차권을 미리 발급하지 못한 <b>첫 출근자</b>의 경우, 기사님께 &apos;처음 와서 앱 승인 대기 중&apos;이라고 말씀드리면 탑승을 도와주시는 경우가 많습니다.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <span className="text-indigo-600 font-black">04</span> 출근 확정 필수
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed break-keep">셔틀은 무료로 운영되지만 <b>&apos;쿠팡 펀치(Coupang Punch)&apos;</b> 또는 채용 확정 문자가 없는 상태에서 무단 탑승 시 사원 번호 조회를 통해 불이익이 발생할 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </main>
  );
}
