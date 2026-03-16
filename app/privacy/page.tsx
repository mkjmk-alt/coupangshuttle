import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Coupang Shuttle Map',
  description: 'Coupang Shuttle Map 서비스의 개인정보 처리 방침입니다.',
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-slate-800 bg-white">
      {/* Formal Header */}
      <div className="border-b-2 border-slate-900 pb-8 mb-12">
        <h1 className="text-3xl font-bold mb-4">개인정보처리방침</h1>
        <p className="text-sm text-slate-600">Coupang Shuttle Map (이하 "서비스" 또는 "회사")</p>
      </div>

      <div className="space-y-10 text-sm md:text-base leading-relaxed break-keep">
        <p>
          Coupang Shuttle Map(이하 "서비스" 또는 "회사")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 개인정보처리방침은 서비스 이용 과정에서 어떠한 정보가 처리되는지, 그 목적과 보유기간, 보호조치 및 이용자의 권리를 안내하기 위해 작성되었습니다.
        </p>

        {/* 제1조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제1조 (처리하는 개인정보 항목)</h2>
          <p className="mb-4">회사는 별도의 회원가입 절차 없이 서비스를 제공하며, 서비스 이용 과정에서 다음의 정보가 자동으로 생성되거나 처리될 수 있습니다.</p>
          
          <div className="space-y-6 pl-4 border-l-2 border-slate-100">
            <div>
              <p className="font-bold mb-2">1. 자동 수집 정보(기술적 데이터)</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>IP 주소</li>
                <li>쿠키(Cookie)</li>
                <li>접속 국가</li>
                <li>브라우저 종류 및 버전</li>
                <li>운영체제(OS) 정보</li>
                <li>방문 도메인(리퍼러) 및 접속 경로</li>
                <li>접속 일시, 이용 기록, 체류 시간</li>
                <li>서비스 오류 기록, 비정상 이용 기록</li>
              </ul>
            </div>

            <div>
              <p className="font-bold mb-2">2. 위치 기반 정보(지리적 데이터)</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>이용자의 동의를 받은 경우에 한하여 실시간 GPS 위도/경도 좌표를 일시적으로 처리할 수 있습니다.</li>
                <li>해당 위치 정보는 서버에 저장되지 않으며, 주변 정류장 탐색·지도 표시 등 필요한 연산 처리 후 즉시 파기됩니다.</li>
              </ul>
            </div>

            <div>
              <p className="font-bold">3. 기타</p>
              <p className="text-slate-600">회사는 이용자를 직접 식별하기 위한 이름, 휴대전화번호, 이메일 주소 등의 회원정보를 별도로 수집하지 않습니다.</p>
            </div>
          </div>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제2조 (개인정보의 처리 목적)</h2>
          <p className="mb-4">회사는 처리하는 정보를 다음의 목적 범위 내에서만 이용합니다.</p>
          <ul className="space-y-4">
            <li>
                <p className="font-bold">1. 서비스 제공 및 최적화</p>
                <p className="text-slate-600 pl-4">- 노선, 정류장, 지도 및 위치 기반 화면 제공, 단말기 및 브라우저 환경에 맞는 화면 최적화, 서버 부하 관리 및 서비스 안정성 확보</p>
            </li>
            <li>
                <p className="font-bold">2. 광고 게재 및 이용 통계 분석</p>
                <p className="text-slate-600 pl-4">- Google AdSense 등 광고 서비스 제공, 광고 성과 측정 및 서비스 운영 분석</p>
            </li>
            <li>
                <p className="font-bold">3. 보안 및 부정 이용 방지</p>
                <p className="text-slate-600 pl-4">- 비정상 접근, 매크로, DDoS 등 악의적 이용 탐지 및 차단, 장애 대응, 로그 분석, 시스템 보호</p>
            </li>
          </ul>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제3조 (개인정보의 처리 위탁 및 국외 이전)</h2>
          <p className="mb-6">회사는 원활한 서비스 제공을 위해 외부 서비스를 이용할 수 있으며, 이 과정에서 일부 정보가 국외로 이전되거나 외부 사업자에 의해 처리될 수 있습니다.</p>
          
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-300 p-3 text-left w-1/4">수탁 업체</th>
                    <th className="border border-slate-300 p-3 text-left">위탁 업무 및 상세 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-3 font-bold text-center">Google LLC</td>
                    <td className="border border-slate-300 p-3 space-y-2">
                        <p><b>업무:</b> 맞춤형 광고 게재, 광고 성과 측정, 트래픽 통계 분석</p>
                        <p><b>항목:</b> 쿠키, IP 주소, 광고 식별정보, 브라우저 정보, 이용 기록</p>
                        <p><b>국가:</b> 미국 등 글로벌 인프라 운영 국가 / <b>방법:</b> 네트워크를 통한 자동 전송</p>
                        <p><b>기간:</b> 각 서비스 제공자의 정책에 따름</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3 font-bold text-center">Cloudflare, Inc.</td>
                    <td className="border border-slate-300 p-3 space-y-2">
                        <p><b>업무:</b> 웹 보안(WAF), DDoS 방어, 콘텐츠 캐싱, 성능 최적화</p>
                        <p><b>항목:</b> IP 주소, 요청 헤더, 접속 로그, 브라우저 정보</p>
                        <p><b>국가:</b> 미국 등 글로벌 인프라 운영 국가 / <b>방법:</b> 접속 시 자동 전송</p>
                        <p><b>기간:</b> 각 서비스 제공자의 정책에 따름</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3 font-bold text-center">Kakao Corp.</td>
                    <td className="border border-slate-300 p-3 space-y-2">
                        <p><b>업무:</b> 지도 데이터 및 시각화 API 제공</p>
                        <p><b>항목:</b> 접속 정보, IP 주소, 단말 및 브라우저 정보</p>
                        <p><b>국가:</b> 대한민국 / <b>방법:</b> 지도 호출 시 전송</p>
                        <p><b>기간:</b> 각 서비스 제공자의 정책에 따름</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 italic">※ 회사는 외부 사업자의 서비스 또는 정책 변경에 따라 처리 항목, 이전 국가 및 보유기간이 달라질 수 있으며, 중요한 변경이 있는 경우 본 방침을 통해 공개합니다.</p>
          </div>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제4조 (개인정보의 보유기간 및 파기)</h2>
          <ul className="list-decimal pl-5 space-y-4">
            <li>자동 수집 정보 중 접속 로그, 보안 로그 등은 처리 목적 달성 시 지체 없이 파기하는 것을 원칙으로 합니다. 다만, 보안 위협 대응, 비정상 이용 방지, 서비스 안정성 확인을 위해 필요한 경우 최대 1년간 보관할 수 있습니다.</li>
            <li>위치 정보는 서버에 저장하지 않으며, 메모리상 일시 처리 후 즉시 파기합니다.</li>
            <li>파기 방법: 
                <ul className="list-disc pl-5 mt-2 text-slate-600">
                    <li>전자적 파일 형태의 정보는 복구 또는 재생이 불가능한 기술적 방법으로 삭제합니다.</li>
                    <li>출력물 등으로 존재하는 정보는 분쇄 또는 소각 등의 방법으로 파기합니다.</li>
                </ul>
            </li>
          </ul>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제5조 (개인정보의 안전성 확보조치)</h2>
          <p className="mb-4">회사는 개인정보의 안전한 처리를 위하여 다음과 같은 보호조치를 시행합니다.</p>
          <ul className="list-decimal pl-5 space-y-3">
            <li><b>전 구간 암호화 통신 적용:</b> HTTPS/SSL을 적용하여 전송 구간에서 정보를 보호합니다.</li>
            <li><b>보안 시스템 운영:</b> 웹 방화벽(WAF), 접근 통제, 비정상 요청 차단 정책 등을 통해 외부 침입을 방지합니다.</li>
            <li><b>최소 수집 및 비식별 처리:</b> 서비스 운영에 필요한 범위 내에서만 정보를 처리하며, 가능한 경우 개인 식별성을 낮추는 방식으로 운영합니다.</li>
            <li><b>접근 권한 최소화:</b> 개인정보 처리에 접근 가능한 범위를 최소화하고, 운영상 필요한 경우에만 제한적으로 접근합니다.</li>
          </ul>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
          <ul className="list-decimal pl-5 space-y-4">
            <li>이용자는 회사에 대하여 언제든지 자신의 개인정보에 관한 다음의 권리(처리 여부 확인, 열람 요구, 정정·삭제 요구, 처리정지 요구)를 행사할 수 있습니다.</li>
            <li>제1항의 권리 행사는 제7조의 연락처를 통하여 요청할 수 있으며, 회사는 관련 법령에서 정한 바에 따라 지체 없이 필요한 조치를 취합니다.</li>
            <li>이용자는 브라우저 또는 단말기 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 일부 기능 이용에 제한이 발생할 수 있습니다.</li>
            <li>이용자는 브라우저 또는 운영체제의 위치 권한 설정을 통해 위치정보 제공 여부를 직접 결정할 수 있습니다. 위치 권한을 거부할 경우 현재 위치 기반 주변 정류장 탐색 기능 등이 제한될 수 있습니다.</li>
            <li>이용자는 Google의 광고 설정 기능 등을 통해 맞춤형 광고 수신을 거부할 수 있습니다.</li>
          </ul>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제7조 (개인정보 보호책임자 및 문의처)</h2>
          <p className="mb-4">회사는 개인정보 처리에 관한 업무를 총괄하고, 이용자의 문의 및 불만처리, 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자 또는 담당부서를 지정합니다.</p>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-2 text-sm md:text-base">
            <p>● <b>개인정보 보호책임자:</b> Coupang Shuttle Map 운영진</p>
            <p>● <b>담당부서:</b> 서비스 운영팀</p>
            <p>● <b>이메일:</b> support@shuttlemap.example.com</p>
            <p>● <b>문의 페이지:</b> <Link href="/contact" className="text-blue-600 underline">문의하기 페이지 바로가기</Link></p>
          </div>
          <p className="mt-4 text-slate-600">이용자는 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 열람청구, 불만처리, 피해구제 요청 등을 위 연락처로 문의할 수 있습니다. 회사는 이용자의 문의에 대해 지체 없이 답변 및 처리하도록 노력합니다.</p>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="text-xl font-bold mb-4 pb-1 border-b border-slate-200">제8조 (개인정보처리방침의 변경)</h2>
          <p>본 개인정보처리방침은 관련 법령, 서비스 내용 또는 외부 연동 서비스의 변경에 따라 수정될 수 있습니다. 회사가 개인정보처리방침을 변경하는 경우, 변경사항은 서비스 내 공지사항 또는 별도 페이지를 통해 안내합니다.</p>
        </section>

        <div className="pt-12 mt-12 border-t border-slate-200">
            <p className="font-bold text-slate-900">부칙</p>
            <p className="text-sm text-slate-500 mt-2">본 개인정보처리방침은 2026년 3월 17일부터 적용됩니다.</p>
        </div>

        <div className="flex gap-6 pt-10 border-t border-slate-100">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">홈페이지 메인</Link>
          <Link href="/terms" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">서비스 이용약관</Link>
        </div>
      </div>
    </main>
  )
}
