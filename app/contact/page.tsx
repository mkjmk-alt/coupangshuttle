import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의하기 | 쿠팡 셔틀버스 지도 앱',
  description: '쿠팡 셔틀버스 지도 앱 이용 중 발생한 오류나 잘못된 노선 정보 제보 등을 문의해 주세요.',
};

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">문제 신고 및 문의하기</h1>
      <div className="prose prose-lg text-gray-700 max-w-none mb-8">
        <p>새롭게 추가된 셔틀 정류장이나 시간표 변경, 혹은 지도 이용 중 발생한 버그를 제보해 주시면 확인 후 신속하게 반영하겠습니다. <br />
        의견이나 제휴 관련 문의도 남겨주세요!</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm p-8 rounded-xl max-w-2xl">
        <form className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">이름 (선택 사항)</label>
            <input 
              type="text" 
              id="name" 
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              placeholder="홍길동" 
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">이메일 주소 (답변 수신용)</label>
            <input 
              type="email" 
              id="email" 
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              placeholder="example@email.com" 
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-800 mb-2">문의 유형</label>
            <select 
              id="subject" 
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
            >
              <option value="info_update">시간표 / 노선 위치 오류 제보</option>
              <option value="bug_report">지도 오류 등 기술적 문제</option>
              <option value="ad_inquiry">광고 및 제휴 문의</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-800 mb-2">상세 내용</label>
            <textarea 
              id="message" 
              rows={6} 
              required
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y" 
              placeholder="변경된 배차 시간이나 지도에 찍힌 정류장 위치의 오류 내용을 구체적으로 적어주세요."
            ></textarea>
          </div>
          <button 
            type="button" 
            className="w-full bg-indigo-600 text-white font-bold text-lg py-3 px-6 rounded-lg hover:bg-indigo-700 transition"
          >
            접수하기
          </button>
        </form>
      </div>
    </div>
  );
}
