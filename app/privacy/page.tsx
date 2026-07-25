import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | Coupang Shuttle Map',
  description: 'Coupang Shuttle Map이 실제로 처리하는 정보와 이용자 권리를 안내합니다.',
};

const externalLinkClass =
  'font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-4 hover:text-indigo-800';

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-4xl bg-white px-6 py-12 text-slate-800 md:py-20">
      <div className="mb-12 border-b-2 border-slate-900 pb-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
          Privacy Policy
        </p>
        <h1 className="mb-4 text-3xl font-bold">개인정보처리방침</h1>
        <p className="text-sm text-slate-600">
          Coupang Shuttle Map(이하 &quot;서비스&quot;) · 시행일 2026년 7월 25일
        </p>
      </div>

      <div className="space-y-10 break-keep text-sm leading-relaxed md:text-base">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-6">
          <p className="font-bold text-slate-900">먼저 확인해 주세요</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>서비스는 공개 웹사이트이며 회원가입과 일반 이용자 로그인 기능이 없습니다.</li>
            <li>이름, 전화번호, 비밀번호, 사용자 프로필을 회원정보로 수집하지 않습니다.</li>
            <li>현재 기기의 GPS 위치 권한을 요청하거나 실시간 위치를 수집하지 않습니다.</li>
            <li>
              관리자용 <code className="rounded bg-white px-1.5 py-0.5 text-xs">/editor</code> 편집
              키는 공개 사용자 계정이 아니라 데이터 변경 권한을 확인하는 내부 인증 수단입니다.
            </li>
          </ul>
        </div>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            1. 처리하는 정보와 이용 목적
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="border border-slate-200 p-3">구분</th>
                  <th className="border border-slate-200 p-3">처리될 수 있는 항목</th>
                  <th className="border border-slate-200 p-3">목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-3 font-bold">웹 접속·보안</td>
                  <td className="border border-slate-200 p-3">
                    IP 주소, 요청 일시와 URL, 요청 헤더, 브라우저·기기 정보, 오류 및 보안 이벤트
                  </td>
                  <td className="border border-slate-200 p-3">
                    페이지 전송, 장애 대응, 비정상 접근 및 보안 위협 탐지
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-bold">지도 표시</td>
                  <td className="border border-slate-200 p-3">
                    지도 API 요청 과정의 IP 주소, 브라우저·기기 및 요청 정보
                  </td>
                  <td className="border border-slate-200 p-3">
                    카카오 지도, 정류장 핀 및 노선 시각화 제공
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-bold">광고</td>
                  <td className="border border-slate-200 p-3">
                    광고 쿠키·식별자, IP 주소, 브라우저·기기 정보, 광고 조회·상호작용 기록
                  </td>
                  <td className="border border-slate-200 p-3">
                    이용자가 광고 쿠키에 동의한 경우에만 Google AdSense 로드, 광고 제공 및 성과 측정
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-3 font-bold">문의·제보</td>
                  <td className="border border-slate-200 p-3">
                    이용자가 카카오톡 또는 이메일로 직접 보낸 계정·이메일 정보, 메시지, 첨부파일
                  </td>
                  <td className="border border-slate-200 p-3">
                    문의 답변, 오류 확인, 노선·정류장 데이터 검토 및 분쟁 대응
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-slate-600">
            운영자는 공개 웹페이지에 문의 입력 폼을 두지 않습니다. 문의할 때 주민등록번호, 계좌번호,
            건강정보 등 민감하거나 불필요한 개인정보를 보내지 마세요.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            2. 브라우저 저장공간, 관리자 검토값과 쿠키
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <b>기능 저장값:</b> 노선 비교 기능의 일시 해제 만료 시각을 기기의 로컬 저장공간에
              최대 1시간 동안 저장할 수 있습니다.
            </li>
            <li>
              <b>관리자 스킵 검토값:</b> 관리자 편집 화면에서 정상으로 판단해 스킵한 오류 후보의
              센터·근무조·노선·정류장 식별정보, 오류 유형과 스킵 시각을 Cloudflare D1에 저장합니다.
              관리자는 편집 화면에서 원하는 항목을 선택해 복원하거나 전체 복원할 수 있습니다.
              브라우저에 남아 있던 기존 스킵 식별값은 최초 D1 연결 시 이전한 뒤 삭제합니다.
            </li>
            <li>
              <b>개인정보·광고 설정:</b> 선택한 광고 동의 상태를 기기의 로컬 저장공간에 저장합니다.
              브라우저 데이터를 삭제하거나 화면 하단의 &quot;개인정보·쿠키 설정&quot;에서 언제든지
              변경할 수 있습니다.
            </li>
            <li>
              <b>광고 쿠키:</b> 동의 전에는 Google AdSense 스크립트를 불러오지 않습니다. 동의 후
              Google이 쿠키 또는 유사 기술을 이용할 수 있으며, 거부해도 셔틀 노선 검색과 지도 열람은
              계속 이용할 수 있습니다.
            </li>
            <li>
              <b>관리자 편집 키:</b> 관리자가 입력한 편집 키는 해당 브라우저 탭의 세션 저장공간에만
              보관하며, 탭 세션 종료 또는 로그아웃 시 제거됩니다. 일반 이용자에게는 해당 키를
              요구하지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            3. 외부 서비스, 처리위탁 및 국외 이전
          </h2>
          <p className="mb-4">
            서비스 운영에 필요한 범위에서 아래 사업자의 시스템을 이용합니다. 네트워크 요청은 각
            사업자의 국내외 인프라로 전송될 수 있습니다.
          </p>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="font-bold">Cloudflare, Inc. · 웹 호스팅, 전송·보안 및 D1 저장</p>
              <p className="mt-2 text-slate-600">
                IP 주소, 요청 헤더, 접속·보안 로그가 접속 시 자동 전송될 수 있습니다. 운영자는
                Cloudflare가 자동 처리한 로그를 별도 회원정보로 결합하지 않습니다. 관리자 스킵
                검토값은 D1에 저장하며 복원 또는 운영상 정리 시 삭제합니다. 그 밖의 자동 처리 정보의
                보유 및 삭제는 서비스 설정과 Cloudflare 정책에 따릅니다.
              </p>
              <a
                className={externalLinkClass}
                href="https://www.cloudflare.com/privacypolicy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cloudflare 개인정보처리방침
              </a>
            </div>
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="font-bold">Google LLC · 광고 제공 및 성과 측정</p>
              <p className="mt-2 text-slate-600">
                광고 동의 후 쿠키·식별자, IP 주소, 브라우저·기기 및 광고 상호작용 정보가 미국 등
                Google의 글로벌 인프라 운영 국가로 네트워크를 통해 전송될 수 있습니다. 보유 및 삭제는
                이용자 설정과 Google 정책에 따릅니다.
              </p>
              <a
                className={externalLinkClass}
                href="https://policies.google.com/privacy?hl=ko"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google 개인정보처리방침
              </a>
            </div>
            <div className="rounded-xl border border-slate-200 p-5">
              <p className="font-bold">Kakao Corp. · 지도 API 및 외부 문의 채널</p>
              <p className="mt-2 text-slate-600">
                지도 호출 시 IP 주소와 요청·기기 정보가 처리될 수 있습니다. 카카오톡 채널로 문의하면
                이용자가 카카오에 제공한 계정 정보와 대화 내용은 카카오 정책의 적용을 받습니다.
              </p>
              <a
                className={externalLinkClass}
                href="https://www.kakao.com/policy/privacy?lang=ko"
                target="_blank"
                rel="noopener noreferrer"
              >
                카카오 개인정보처리방침
              </a>
            </div>
          </div>
          <p className="mt-4 text-slate-600">
            이용자는 광고 쿠키 동의를 거부하여 Google 광고 관련 전송을 막을 수 있습니다. 다만
            Cloudflare의 페이지 전송·보안 처리와 Kakao 지도 요청은 핵심 서비스 제공에 필요하므로 이를
            차단하면 일부 또는 전체 기능이 정상 작동하지 않을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            4. 보유기간과 파기
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              운영자는 일반 이용자의 회원 데이터베이스를 만들거나 웹 접속 로그를 별도로 내려받아
              장기 보관하지 않습니다.
            </li>
            <li>
              카카오톡·이메일 문의 내용은 처리 완료 후 최대 1년 이내 삭제하는 것을 원칙으로 합니다.
              다만 진행 중인 분쟁 또는 법령상 보존 의무가 있으면 해당 목적과 기간에 한해 보관할 수
              있습니다.
            </li>
            <li>
              기기 로컬·세션 저장값은 이용자가 브라우저에서 직접 삭제할 수 있으며, 편집 키의 세션
              저장값은 세션 종료 시 제거됩니다.
            </li>
            <li>
              관리자 스킵 검토값은 해당 항목을 선택 복원 또는 전체 복원할 때 D1에서 삭제합니다.
            </li>
            <li>
              외부 사업자가 자동 처리하는 정보는 각 사업자의 보유 정책과 이용자 설정에 따라
              삭제됩니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            5. 제3자 제공과 셔틀 데이터 변경 로그
          </h2>
          <p>
            운영자는 이용자의 개인정보를 판매하지 않으며, 법령에 근거한 요구가 있는 경우를 제외하고
            외부에 임의로 제공하지 않습니다. 셔틀 데이터 변경 로그에는 센터·노선·정류장의 변경
            전후 값과 처리 시각이 기록되며, 일반 이용자의 이름·연락처나 관리자 편집 키는 기록하지
            않습니다. 자세한 기준은{' '}
            <Link href="/operations" className={externalLinkClass}>
              운영 및 데이터 정책
            </Link>
            에서 확인할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            6. 이용자의 권리와 행사 방법
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              이용자는 본인 정보의 처리 여부 확인, 열람, 정정·삭제, 처리정지 또는 동의 철회를 요청할
              수 있습니다.
            </li>
            <li>
              광고 동의는 화면 하단의 &quot;개인정보·쿠키 설정&quot;에서 즉시 변경할 수 있습니다.
              브라우저 설정에서도 쿠키와 사이트 데이터를 삭제하거나 차단할 수 있습니다.
            </li>
            <li>
              권리 행사는 아래 이메일 또는 카카오톡 채널로 요청할 수 있습니다. 요청자 본인 확인이
              필요한 경우 해당 요청 처리에 필요한 최소한의 정보만 추가로 확인할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            7. 안전성 확보조치
          </h2>
          <ul className="list-disc space-y-3 pl-5">
            <li>HTTPS 암호화 통신과 Cloudflare의 전송·보안 기능을 사용합니다.</li>
            <li>관리자 데이터 변경 및 스킵 관리 API는 서버에서 편집 키를 검증하며, 키는 공개 코드에 포함하지 않습니다.</li>
            <li>관리 권한과 운영 데이터 접근 범위를 필요한 수준으로 제한합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            8. 개인정보 보호 문의
          </h2>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <p>
              <b>개인정보 보호 업무 담당:</b> Coupang Shuttle Map 운영자
            </p>
            <p>
              <b>이메일:</b>{' '}
              <a className={externalLinkClass} href="mailto:mkjmk3114@nate.com">
                mkjmk3114@nate.com
              </a>
            </p>
            <p>
              <b>카카오톡 채널:</b>{' '}
              <a
                className={externalLinkClass}
                href="http://pf.kakao.com/_FGhlX/chat"
                target="_blank"
                rel="noopener noreferrer"
              >
                1:1 채팅 열기
              </a>
            </p>
            <p>
              <b>문의 안내:</b>{' '}
              <Link className={externalLinkClass} href="/contact">
                문의 및 데이터 제보 페이지
              </Link>
            </p>
          </div>
          <p className="mt-4 text-slate-600">
            개인정보 침해에 관한 별도 상담이 필요한 경우{' '}
            <a
              className={externalLinkClass}
              href="https://www.privacy.go.kr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              개인정보 포털
            </a>
            을 이용할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            9. 방침의 변경
          </h2>
          <p>
            법령, 서비스 기능 또는 외부 연동 사업자가 변경되면 이 방침을 수정할 수 있습니다. 중요한
            변경은 적용 전에 서비스 화면에서 알리며, 최신 시행일과 내용을 이 페이지에 공개합니다.
          </p>
        </section>

        <div className="border-t border-slate-200 pt-8">
          <p className="font-bold text-slate-900">부칙</p>
          <p className="mt-2 text-sm text-slate-500">공고일 및 시행일: 2026년 7월 25일</p>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-8">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            홈페이지 메인
          </Link>
          <Link href="/terms" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            서비스 이용약관
          </Link>
          <Link href="/operations" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            운영 및 데이터 정책
          </Link>
        </div>
      </div>
    </main>
  );
}
