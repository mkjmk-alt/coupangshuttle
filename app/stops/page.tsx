import type { Metadata } from 'next';
import StopGuide from '@/components/StopGuide';

export const metadata: Metadata = {
  title: '정류장 안내 | 물류센터 셔틀맵',
  description: '물류센터·근무조·노선별 셔틀 정류장명, 주소와 운행 시각을 글로 확인하세요.',
  alternates: { canonical: '/stops' },
};

export default function StopsPage() {
  return <StopGuide />;
}
