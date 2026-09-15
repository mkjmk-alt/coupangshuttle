# AdSense 승인 준비 보강 구현 계획

**요청 ID:** 2jXaRBNtdl

## 작업 순서

1. **검증 기준을 먼저 작성한다.** `scripts/adsense-readiness.test.mjs`에 가이드·FAQ·검색 메타데이터·탐색 링크·운영 정책 문구를 검사한다. 구현 전 실행해 누락된 파일 때문에 실패하는지 확인한다.
2. **원본 안내 콘텐츠를 추가한다.** `app/guide/page.tsx`는 서비스 소개와 이용 방법을, `app/faq/page.tsx`는 실제 조회·정류장·공식 공지·오류 제보 질문을 다룬다. 각 페이지에 관련 정책과 문의 링크를 둔다.
3. **탐색 구조를 연결한다.** `components/SiteNavigation.tsx`, `app/layout.tsx`, `app/page.tsx`를 수정해 데스크톱 메뉴와 푸터에서 가이드·FAQ·운영 정책을 찾게 한다. 모바일 하단 메뉴의 3개 핵심 항목은 유지한다.
4. **신뢰성 문구를 보강한다.** `app/operations/page.tsx`에 데이터 출처·검수·불일치 처리·업데이트 시각의 의미를 추가한다.
5. **검색 노출 기반을 추가한다.** `app/layout.tsx`에 canonical 메타데이터를 설정하고 `app/robots.ts`, `app/sitemap.ts`를 작성한다.
6. **검증한다.** 새 테스트, 기존 정류장 테스트, TypeScript, 변경 파일 ESLint, `npm run build`, `git diff --check`를 실행한다. 빌드가 만든 데이터 변경은 의도 여부를 확인한다.
7. **기록·배포한다.** `기록-history.md`에 요청·답변·수정·검증을 기록하고 GitHub와 Cloudflare Pages에 배포한 뒤 공개 URL의 주요 경로 HTTP 응답과 콘텐츠 마커를 확인한다.

## 변경 파일

- 생성: `app/guide/page.tsx`, `app/faq/page.tsx`, `app/robots.ts`, `app/sitemap.ts`, `scripts/adsense-readiness.test.mjs`
- 수정: `app/layout.tsx`, `app/page.tsx`, `app/operations/page.tsx`, `components/SiteNavigation.tsx`, `package.json`, `기록-history.md`
- 보존: 기존 데이터 JSON, 광고 동의 로직, `public/ads.txt`, `design_new.md`, `design_pastel.md`
