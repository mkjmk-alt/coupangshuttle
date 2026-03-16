import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 이용약관 | Coupang Shuttle Map',
  description: 'Coupang Shuttle Map 서비스의 법적 고지 및 이용 규정입니다.',
};

export default function TermsOfService() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-slate-800 bg-white">
      {/* Formal Header */}
      <div className="border-b-2 border-slate-900 pb-8 mb-12">
        <h1 className="text-3xl font-bold mb-4">서비스 이용약관</h1>
        <p className="text-sm text-slate-600">Coupang Shuttle Map (이하 '서비스')</p>
      </div>

      <div className="space-y-10 text-sm md:text-base leading-relaxed break-keep">
        <p>
          Coupang Shuttle Map(이하 '서비스')에 오신 것을 환영합니다.
          본 약관은 제공자와 이용자 간의 서비스 이용에 관한 권리, 의무, 책임 및 기타 필요한 사항을 규정하며, 서비스에 접속하여 이용하는 것은 본 약관의 모든 내용에 동의함을 의미합니다.
        </p>

        {/* 제1조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 1 조 (목적)</h2>
          <p>본 약관은 서비스 제공자가 운영하는 셔틀버스 지도 정보 안내 서비스의 원활한 이용 환경을 조성하고, 제공자와 이용자 간의 권리 및 법적 책임의 한계를 명확히 하는 것을 목적으로 합니다.</p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 2 조 (용어의 정의)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><b>이용자:</b> 본 서비스에 접속하여 정보를 열람하거나 이용하는 모든 방문객을 말합니다.</li>
            <li><b>셔틀 정보:</b> 각 지역 센터에서 공식적 또는 비공식적으로 확인된 노선, 정류장 좌표, 운행 시간 등을 수집 및 가공한 데이터를 말합니다.</li>
            <li><b>제공자:</b> 본 서비스를 개발, 운영, 관리하는 주체를 말합니다.</li>
          </ol>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 3 조 (비공식성 고지)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>본 서비스는 개인 개발자가 운영하는 비공식 프로젝트입니다.</li>
            <li>본 서비스는 '쿠팡(Coupang)' 본사 또는 그 계열사와 어떠한 공식적인 파트너십, 제휴, 위탁 운영 관계도 맺고 있지 않으며, 해당 기업이 승인하거나 보증하는 공식 서비스가 아닙니다.</li>
          </ol>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 4 조 (정보 제공의 한계 및 책임의 면제)</h2>
          <ol className="list-decimal pl-5 space-y-4">
            <li>
                <b>정확성 결여:</b> 서비스에서 제공되는 노선, 정류장, 시간표 등의 정보는 데이터 입력 시점의 자료를 바탕으로 작성되어 실제 운행 상황과 다를 수 있습니다. 돌발적인 노선 폐지, 배차 조절, 기상 악화로 인한 지연 등에 대하여, 제공자의 고의 또는 중대한 과실이 없는 한 제공자는 책임을 지지 않습니다.
            </li>
            <li>
                <b>탑승 실패 및 파생적 손해:</b> 이용자가 본 서비스의 정보를 참고하여 대기하였으나 버스가 오지 않거나 만차로 인해 탑승하지 못한 경우 등, 이로 인해 발생하는 신체적·경제적 손해(지각, 결근, 패널티 등)에 대하여 제공자의 고의 또는 중대한 과실이 없는 한 제공자는 책임을 지지 않습니다.
            </li>
            <li>
                <b>제3자 서비스 연동 오류:</b> 카카오맵 등 제3자 Open API 연동 과정에서 발생하는 위치 오류, 네트워크 통신 장애, 정류장 핀의 불일치 등 외부 제공 데이터 및 시스템의 하자에 대해서는 제공자의 고의 또는 중대한 과실이 없는 한 제공자는 책임을 지지 않습니다.
            </li>
          </ol>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 5 조 (서비스의 변경 및 중단)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>제공자는 시스템 유지보수, 서버 증설 및 교체, 외부 API 제공 업체의 정책 변경, 기타 운영상·기술상의 상당한 이유가 있는 경우 서비스의 전부 또는 일부를 변경하거나 일시적으로 중단할 수 있습니다.</li>
            <li>무료로 제공되는 본 서비스의 특성상, 제공자는 사전 공지 후 서비스 운영을 영구적으로 종료할 수 있으며, 이로 인해 발생하는 문제에 대해 제공자의 고의 또는 중대한 과실이 없는 한 별도의 보상을 제공하지 않습니다.</li>
          </ol>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 6 조 (이용자의 의무 및 이용 제한)</h2>
          <ol className="list-decimal pl-5 space-y-4">
            <li>
                이용자는 서비스를 이용함에 있어 다음의 행위를하여서는 안 됩니다.
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
                    <li>자동화 스크립트(Bot, Crawler 등)를 이용한 데이터 무단 대량 수집 및 복제</li>
                    <li>서비스의 보안을 우회하거나 시스템의 코드, 데이터베이스를 역설계(Reverse Engineering)하는 행위</li>
                    <li>제공된 정보를 가공하여 상업적인 목적으로 재판매하거나 타 플랫폼에 무단 게시하는 행위</li>
                    <li>기타 서비스의 정상적인 운영을 고의로 방해하는 행위</li>
                </ul>
            </li>
            <li>제공자는 이용자가 본 조항을 위반한 경우, 사전 통보 없이 해당 이용자의 서비스 접근을 차단하거나 IP 접속을 제한할 수 있습니다.</li>
          </ol>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 7 조 (저작권 및 상표권)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>본 서비스 내에 포함된 디자인 테마, UI/UX 요소, 소스코드 및 편집된 데이터베이스에 대한 저작권과 지적재산권은 제공자에게 귀속됩니다.</li>
            <li>서비스 내에서 언급되거나 사용된 브랜드 명칭, 로고 등 특정 상표에 대한 권리는 원래의 권리자(쿠팡 등)에게 귀속됩니다.</li>
          </ol>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 8 조 (광고 및 제3자 링크)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>제공자는 서비스의 유지 및 운영을 위해 Google AdSense 등의 광고를 서비스 화면에 게재할 수 있습니다.</li>
            <li>서비스 내에 포함된 제3자의 웹사이트 링크나 배너 광고를 통해 외부 사이트로 이동할 경우, 해당 사이트의 콘텐츠나 개인정보처리방침에 대해서는 제공자가 통제권이 없으므로 일체의 책임을 지지 않습니다.</li>
          </ol>
        </section>

        {/* 제9조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 9 조 (약관의 개정)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>제공자는 관련 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.</li>
            <li>약관이 개정될 경우, 제공자는 적용 일자 및 개정 사유를 명시하여 적용일 최소 7일 전부터 서비스 내 공지사항 또는 초기 화면을 통해 안내합니다.</li>
            <li>이용자가 개정된 약관의 적용 일자 이후에도 서비스를 계속 이용하는 경우, 개정된 약관에 동의한 것으로 간주합니다.</li>
          </ol>
        </section>

        {/* 제10조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제 10 조 (관할 및 준거법)</h2>
          <p>본 서비스 이용과 관련하여 발생한 분쟁에 대해서는 대한민국 법령을 준거법으로 하며, 제공자와 이용자 간의 소송이 발생할 경우 제공자의 주소지를 관할하는 법원을 전속 관할 법원으로 하여 해결합니다.</p>
        </section>

        <div className="pt-12 mt-12 border-t border-slate-200">
            <p className="font-bold text-slate-900">부칙</p>
            <p className="text-sm text-slate-500 mt-2">본 약관은 2026년 3월 17부터 시행됩니다.</p>
        </div>

        <div className="flex gap-6 pt-10 border-t border-slate-100 font-sans">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">홈페이지 메인</Link>
          <Link href="/privacy" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">개인정보처리방침</Link>
        </div>
      </div>
    </main>
  );
}
