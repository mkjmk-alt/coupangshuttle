import Link from 'next/link';

export default function CenterNotFound() {
  return (
    <main className="policy-page content-page plain-content-page center-not-found-page mx-auto max-w-4xl px-6 py-20 text-slate-800">
      <p className="eyebrow">센터 안내</p>
      <h1>센터 정보를 찾을 수 없습니다.</h1>
      <p>주소가 잘못되었거나 현재 공개된 센터 목록에 없는 코드입니다.</p>
      <div className="content-links">
        <Link href="/centers">센터 목록 보기</Link>
        <Link href="/stops">정류장 안내로 이동</Link>
      </div>
    </main>
  );
}
