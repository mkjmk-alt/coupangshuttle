import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '자주 묻는 질문 | 물류센터 셔틀맵',
  description: '물류센터 셔틀 노선, 정류장, 시간 변경과 데이터 제보에 관한 자주 묻는 질문입니다.',
  alternates: { canonical: '/faq' },
};

const questions = [
  {
    question: '이 사이트가 쿠팡 공식 셔틀 안내인가요?',
    answer:
      '아닙니다. 물류센터 셔틀맵은 근무자가 노선과 정류장을 참고할 수 있도록 운영하는 비공식 서비스입니다. 실제 운행 여부와 최신 변경 사항은 소속 센터의 공식 공지를 최종 기준으로 확인해 주세요.',
  },
  {
    question: '조회한 시간에 맞춰 버스가 반드시 오나요?',
    answer:
      '조회 시각은 공개된 자료에 기록된 참고 기준입니다. 교통, 기상, 센터 운영, 운수사 사정에 따라 지연·우회·취소가 발생할 수 있으므로 정류장에는 여유 있게 도착하고 현장 안내를 함께 확인해야 합니다.',
  },
  {
    question: '정류장 이름은 있는데 주소가 맞지 않는 것 같아요.',
    answer:
      '정류장명과 주소가 바뀌었거나 표기가 다른 경우가 있을 수 있습니다. 센터명, 근무조, 노선명, 정류장명, 변경 전·후 내용과 확인 날짜를 적어 노선 오류 제보로 보내 주세요. 가능하면 공식 공지나 현장 안내 사진도 함께 보내 주세요.',
  },
  {
    question: '정류장 안내와 지도 화면 중 무엇을 믿어야 하나요?',
    answer:
      '두 화면은 같은 노선 데이터를 서로 다른 방식으로 보여줍니다. 글 목록은 주소와 순서를 확인할 때, 지도는 위치를 비교할 때 편리합니다. 어느 화면이든 공식 센터 공지보다 우선하지 않습니다.',
  },
  {
    question: '근무조나 노선 선택창이 비어 있어요.',
    answer:
      '센터를 먼저 선택해야 하위 선택지가 표시됩니다. 선택 후에도 비어 있다면 센터 파일을 불러오는 중일 수 있으니 잠시 기다려 주세요. 계속 문제가 있으면 사용한 센터와 화면을 문의해 주세요.',
  },
  {
    question: '탑승 승인, 출근 확정, 분실물도 문의할 수 있나요?',
    answer:
      '이 사이트는 노선·정류장 참고 서비스라 탑승 승인, 출근 확정, 분실물 접수는 처리하지 않습니다. 소속 센터 담당자나 해당 노선 운수사에 문의해 주세요.',
  },
  {
    question: '개인정보나 광고 쿠키를 거부해도 사용할 수 있나요?',
    answer:
      '선택적 광고 쿠키를 거부해도 노선 조회와 정류장 안내는 사용할 수 있습니다. 개인정보 처리와 광고 동의 기준은 개인정보처리방침과 화면 하단의 쿠키 설정에서 확인할 수 있습니다.',
  },
];

export default function FaqPage() {
  return (
    <main className="policy-page content-page plain-content-page faq-page mx-auto max-w-5xl px-6 py-12 text-slate-800 md:py-20">
      <header>
        <p className="mb-3 text-xs font-bold text-indigo-600">자주 묻는 질문</p>
        <h1>자주 묻는 질문</h1>
        <p>노선과 정류장을 찾을 때 자주 묻는 내용을 모았습니다.</p>
      </header>

      <section className="faq-list" aria-label="자주 묻는 질문 목록">
        {questions.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="faq-followup">
        <h2>답을 찾지 못했다면</h2>
        <p>
          노선 변경이나 정류장 오류는 <Link href="/contact">문의 및 데이터 제보</Link>에서 알려 주세요.
          서비스가 어떤 자료를 기준으로 업데이트되는지는 <Link href="/operations">운영 및 데이터 정책</Link>에
          설명되어 있습니다.
        </p>
      </section>

      <div className="content-links">
        <Link href="/guide">셔틀 이용 가이드</Link>
        <Link href="/">노선 조회로 돌아가기</Link>
        <Link href="/terms">서비스 이용약관</Link>
      </div>
    </main>
  );
}
