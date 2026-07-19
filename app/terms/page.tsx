import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 이용약관 | Coupang Shuttle Map',
  description: 'Coupang Shuttle Map의 이용 조건, 비공식성 고지 및 책임 범위를 안내합니다.',
};

export default function TermsOfService() {
  return (
    <main className="mx-auto max-w-4xl bg-white px-6 py-12 text-slate-800 md:py-20">
      <div className="mb-12 border-b-2 border-slate-900 pb-8">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
          Terms of Service
        </p>
        <h1 className="mb-4 text-3xl font-bold">서비스 이용약관</h1>
        <p className="text-sm text-slate-600">Coupang Shuttle Map · 시행일 2026년 7월 19일</p>
      </div>

      <div className="space-y-10 break-keep text-sm leading-relaxed md:text-base">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <p className="font-bold">공식 운행 공지를 반드시 우선 확인하세요.</p>
          <p className="mt-2">
            본 서비스는 쿠팡 및 관계사가 운영·승인한 공식 서비스가 아닌 참고용 비공식 안내
            서비스입니다. 노선, 탑승 장소와 시간은 소속 물류센터의 최신 공식 공지가 우선합니다.
          </p>
        </div>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">제1조 (목적)</h2>
          <p>
            본 약관은 운영자가 제공하는 셔틀 노선·정류장·시간 정보의 이용 조건, 운영 원칙 및
            운영자와 이용자의 권리·책임 범위를 정하는 것을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제2조 (서비스 성격과 계정)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>서비스는 누구나 열람할 수 있는 무료 공개 웹사이트입니다.</li>
            <li>
              일반 이용자용 회원가입, 로그인, 프로필, 비밀번호 및 유료 결제 기능을 제공하지
              않습니다.
            </li>
            <li>
              관리자용 편집 페이지와 편집 키는 운영 데이터 관리 수단이며 일반 이용자 계정이나
              회원 서비스가 아닙니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제3조 (비공식성 및 상표 고지)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              서비스는 개인 운영자가 관리하는 비공식 프로젝트이며, 쿠팡(Coupang) 본사·계열사 또는
              각 물류센터와 공식 제휴·위탁·보증 관계에 있지 않습니다.
            </li>
            <li>
              회사명과 관련 표시는 정보 식별을 위한 것이며, 각 상표와 명칭의 권리는 해당 권리자에게
              있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제4조 (셔틀 정보와 업데이트)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              셔틀 정보는 운영자가 확보한 자료와 제보를 정리한 것으로, 실제 운행 변경 시점과 사이트
              반영 시점이 다를 수 있습니다.
            </li>
            <li>
              화면의 업데이트 일시는 데이터가 사이트에 반영된 시각이며, 해당 노선의 공식 시행일이나
              정확성을 보증하는 표시는 아닙니다.
            </li>
            <li>
              전체 자동 배포는 작업 단위 요약 로그 1건을, 수동 변경은 정류장별 변경 전·후 값을
              기록합니다. 최신 100개 작업 로그를 유지하며 한 번의 수동 저장에는 최대 500개 정류장
              변경을 기록할 수 있습니다.
            </li>
            <li>
              데이터 운영 기준과 로그 범위는{' '}
              <Link className="font-bold text-indigo-600 underline" href="/operations">
                운영 및 데이터 정책
              </Link>
              에서 확인할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제5조 (이용자의 확인 의무)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              이용자는 탑승 전에 소속 센터의 공식 공지, 현장 안내와 담당자 안내를 최종 확인해야
              합니다.
            </li>
            <li>
              주소, 정류장 명칭, 지도 핀 또는 시간이 다르면 이용을 중단하고 공식 정보로 확인한 뒤
              운영자에게 오류를 제보할 수 있습니다.
            </li>
            <li>안전, 근태 또는 비용에 영향을 주는 판단을 이 서비스 정보에만 의존해서는 안 됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제6조 (서비스 변경과 중단)
          </h2>
          <p>
            시스템 유지보수, 데이터 점검, 외부 API·호스팅 정책 변경, 보안 사고 또는 기타 운영상
            필요한 경우 서비스의 전부 또는 일부를 변경하거나 일시 중단할 수 있습니다. 예측 가능한
            중요한 변경은 가능한 범위에서 사이트를 통해 미리 안내합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제7조 (금지행위)
          </h2>
          <p className="mb-3">이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>서비스, 서버 또는 데이터 변경 API에 대한 무단 접근·침해·과부하 유발</li>
            <li>편집 키의 탈취, 공유, 추측 시도 또는 관리자 사칭</li>
            <li>악성코드 전송, 자동화된 대량 요청, 서비스 운영 방해</li>
            <li>허위 제보, 타인의 개인정보·민감정보 무단 전송 또는 권리 침해</li>
            <li>법령 또는 공공질서에 위반되는 방식의 이용</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제8조 (광고와 외부 서비스)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              서비스 운영을 위해 광고 또는 제휴 링크가 표시될 수 있습니다. 광고 쿠키는 이용자가
              동의한 뒤에만 로드됩니다.
            </li>
            <li>
              카카오 지도, 카카오톡 채널, Google 광고, 외부 쇼핑 링크 등 제3자 서비스에는 각
              제공자의 약관과 개인정보처리방침이 적용됩니다.
            </li>
            <li>
              외부 사이트의 상품, 콘텐츠, 결제 또는 개인정보 처리에 대해서는 해당 제공자가
              책임집니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제9조 (책임의 범위)
          </h2>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              운영자는 정보의 정확성과 최신성을 높이기 위해 합리적으로 노력하지만, 실시간 운행
              변경·현장 사정·제보 오류 또는 외부 서비스 장애까지 완전하게 보증하지 않습니다.
            </li>
            <li>
              관련 법령이 허용하는 범위에서, 운영자의 고의 또는 중대한 과실 없이 발생한 운행 지연,
              탑승 실패, 근태·비용 손해 또는 외부 서비스 장애에 대해서는 책임을 부담하지 않습니다.
            </li>
            <li>법령상 제한하거나 배제할 수 없는 소비자 또는 이용자의 권리는 본 조보다 우선합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제10조 (개인정보)
          </h2>
          <p>
            서비스 이용 과정의 정보 처리는{' '}
            <Link className="font-bold text-indigo-600 underline" href="/privacy">
              개인정보처리방침
            </Link>
            에 따릅니다. 서비스는 일반 이용자 로그인을 제공하지 않으며, 문의 시에는 답변에 필요한
            최소한의 정보만 보내야 합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-xl font-bold">
            제11조 (약관 변경과 문의)
          </h2>
          <p>
            운영 내용 또는 관련 법령이 변경되면 약관을 개정할 수 있으며, 중요한 변경은 시행 전에
            서비스 화면에서 안내합니다. 약관 또는 운영에 관한 문의는{' '}
            <Link className="font-bold text-indigo-600 underline" href="/contact">
              문의 및 데이터 제보 페이지
            </Link>
            를 이용해 주세요.
          </p>
        </section>

        <div className="border-t border-slate-200 pt-8">
          <p className="font-bold text-slate-900">부칙</p>
          <p className="mt-2 text-sm text-slate-500">공고일 및 시행일: 2026년 7월 19일</p>
        </div>

        <div className="flex flex-wrap gap-6 border-t border-slate-100 pt-8">
          <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            홈페이지 메인
          </Link>
          <Link href="/privacy" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            개인정보처리방침
          </Link>
          <Link href="/operations" className="text-sm font-bold text-slate-400 hover:text-slate-900">
            운영 및 데이터 정책
          </Link>
        </div>
      </div>
    </main>
  );
}
