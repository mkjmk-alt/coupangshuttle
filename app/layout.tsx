import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Coupang Shuttle Map | 인텔리전트 셔틀 가이드",
  description: "전국 쿠팡 물류센터 셔틀버스 통합 노선 안내 시스템",
  other: {
    "google-adsense-account": "ca-pub-7954802956462064",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7954802956462064"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <nav className="fixed top-0 left-0 right-0 z-[100] glass-effect py-4 px-4 md:px-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                    <span className="font-black text-xs">CS</span>
                </div>
                <span className="text-lg font-black text-slate-900 tracking-tighter uppercase font-outfit group-hover:text-indigo-600 transition-colors">
                    Coupang <span className="text-indigo-600">Shuttle Map</span>
                </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
                <Link href="/" className="nav-link text-indigo-600 bg-indigo-50/50">Explorer</Link>
                <Link href="/privacy" className="nav-link">Privacy</Link>
                <Link href="/terms" className="nav-link">Terms</Link>
                <Link href="/contact" className="nav-link">Support</Link>
            </div>
            
        </nav>

        <div className="pt-24 min-h-screen">
            {children}
        </div>

        <footer className="mt-40 bg-slate-50 border-t border-slate-200 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                                <span className="font-black text-xs">CS</span>
                            </div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Coupang Shuttle Map</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium break-keep">
                            편리하고 안전한 출퇴근 문화를 선도하는 비공식 통합 셔틀버스 가이드 시스템입니다. 정확한 데이터로 하루의 시작을 돕습니다.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Quick Links</h5>
                        <ul className="space-y-4">
                            <li><Link href="/" className="text-slate-600 hover:text-indigo-600 text-sm font-semibold transition-colors">노선 통합 검색기</Link></li>
                            <li><Link href="/privacy" className="text-slate-600 hover:text-indigo-600 text-sm font-semibold transition-colors">개인정보처리방침</Link></li>
                            <li><Link href="/terms" className="text-slate-600 hover:text-indigo-600 text-sm font-semibold transition-colors">서비스 이용약관</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Support Center</h5>
                        <ul className="space-y-4">
                            <li><Link href="/contact" className="text-slate-600 hover:text-indigo-600 text-sm font-semibold transition-colors">문의 및 오류·데이터 제보</Link></li>
                        </ul>
                    </div>


                </div>

                <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        © 2026 Coupang Shuttle Map.
                    </p>
                    <div className="flex gap-8">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Seoul, South Korea</span>
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Server Status: Optimal</span>
                    </div>
                </div>
            </div>
        </footer>
      </body>
    </html>
  );
}
