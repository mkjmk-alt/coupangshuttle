'use client';

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('csm:open-consent'))}
      className="text-left text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
      aria-label="광고 쿠키 설정 열기"
    >
      광고 쿠키 설정
    </button>
  );
}
