'use client';

import { useState, useEffect } from 'react';

// 쿠팡 파트너스 링크 목록 (여기에 링크를 자유롭게 추가하시면 랜덤으로 롤링됩니다!)
const COUPANG_LINKS = [
  'https://link.coupang.com/a/emtytil65c', // 간식 링크
  'https://link.coupang.com/a/dSL5YVNH64',
];

export default function CoupangBanner() {
  const [activeLink, setActiveLink] = useState('https://link.coupang.com/a/emtytil65c');

  useEffect(() => {
    if (COUPANG_LINKS.length > 0) {
      const randomIndex = Math.floor(Math.random() * COUPANG_LINKS.length);
      setActiveLink(COUPANG_LINKS[randomIndex]);
    }
  }, []);

  return (
    <section className="mb-12 animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
      <div className="premium-card bg-gradient-to-r from-amber-500/[0.07] via-orange-500/[0.04] to-transparent border-amber-200/30 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500"></div>
        
        <div className="flex items-center gap-4 shrink-1">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-amber-100/50 shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            🍿
          </div>
          <div className="space-y-1">
            <h4 className="text-amber-800 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              제휴 안내 · 근무 중 간식 준비
            </h4>
            <p className="text-slate-800 text-sm font-bold leading-snug break-keep">
              근무 중 필요한 <span className="bg-amber-100/80 text-amber-950 px-1.5 py-0.5 rounded font-black">간식이나 음료</span>를 미리 준비해 보세요. 아래 버튼을 누르면 쿠팡 제휴 페이지가 새 창에서 열립니다.
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              * 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
          </div>
        </div>
        
        <a 
          href={activeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-100/50 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-1.5 shrink-0 group/btn"
        >
          쿠팡에서 간식 보기
          <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
