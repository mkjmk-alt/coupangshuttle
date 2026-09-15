# AdSense 콘텐츠·신뢰성 보강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 센터별 검색 가능한 콘텐츠, 데이터 신뢰성 안내, 공개 변경 이력, AdSense 운영 고지를 추가해 사이트의 실제 이용 가치와 심사 준비도를 높인다.

**Architecture:** 기존 `/stops`의 브라우저 조회 기능은 유지하고, 같은 JSON 원본을 서버 전용 유틸리티가 읽어 `/centers`, `/centers/[code]`, `/updates` 정적 페이지를 생성한다. 데이터 집계와 품질 검사는 `utils/dataSummary.ts`에 모아 화면·테스트가 같은 규칙을 사용하게 한다. 정책·광고 안내는 계정 설정을 가장하지 않고 현재 구현 범위만 문서화한다.

**Tech Stack:** Next.js App Router, React, TypeScript, Node.js test scripts, JSON data files, existing pastel CSS.

**Spec:** `docs/superpowers/specs/2026-09-16-adsense-content-strengthening-design.md`

## Global Constraints

- 기존 `/`, `/stops`, `/guide`, `/faq`, `/contact`, `/operations`, `/privacy`, `/terms` 기능과 링크를 깨뜨리지 않는다.
- `public/data/shuttle_meta.json`의 날짜·노선·정류장 값을 새 원본 확인 없이 최신으로 조작하지 않는다.
- 변경 이력 페이지에는 before/after 원본, 외부 이미지 URL, 관리자 인증값을 노출하지 않는다.
- 센터별 페이지는 센터 단위 요약으로 만들고 모든 노선에 별도 URL을 대량 생성하지 않는다.
- 구현 전 테스트가 의도한 이유로 실패하는 것을 확인하고, 구현 후 같은 테스트를 통과시킨다.
- 모든 파일 수정은 `apply_patch`로 수행한다.

---

### Task 1: 데이터 집계·품질 검사 유틸리티

**Files:**
- Create: `utils/dataSummary.ts`
- Create: `scripts/data-summary.test.mjs`
- Modify: `package.json`

**Interfaces:**
- `summarizeCenter(data, reviewedAt): CenterSummary`
- `getDataFreshness(reviewedAt, now, maxAgeDays): DataFreshness`
- `collectQualityWarnings(data): QualityWarning[]`

- [ ] **Step 1: Write the failing test**

  `scripts/data-summary.test.mjs`에서 작은 fixture 센터를 만들고 센터명, 근무조 수, 노선 수, 정류장 수, 오래된 날짜, placeholder·좌표·시간 역순 경고를 검증한다.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --experimental-strip-types scripts/data-summary.test.mjs`

  Expected: `ERR_MODULE_NOT_FOUND` 또는 export 누락으로 실패한다.

- [ ] **Step 3: Write minimal implementation**

  `utils/dataSummary.ts`에 JSON의 `center`·`shifts` 구조를 안전하게 순회하는 타입과 함수를 작성한다. 날짜 파싱 실패는 `unknown` 상태로 반환하고, 경고는 문자열 코드와 사람이 읽을 수 있는 메시지를 함께 제공한다.

- [ ] **Step 4: Run test to verify it passes**

  Run: `node --experimental-strip-types scripts/data-summary.test.mjs`

  Expected: `Data summary tests passed.`

- [ ] **Step 5: Register the test**

  `package.json`에 `test:data-summary`를 `node --experimental-strip-types scripts/data-summary.test.mjs`로 추가한다.

- [ ] **Step 6: Commit**

  ```bash
  git add utils/dataSummary.ts scripts/data-summary.test.mjs package.json
  git commit -m "✨ Add shuttle data quality summaries"
  ```

### Task 2: 센터 디렉터리와 서버 렌더링 상세 페이지

**Files:**
- Create: `utils/centerDirectory.ts`
- Create: `app/centers/page.tsx`
- Create: `app/centers/[code]/page.tsx`
- Create: `app/centers/not-found.tsx`
- Modify: `components/StopGuide.tsx`
- Create: `scripts/center-pages.test.mjs`
- Modify: `package.json`
- Modify: `app/pastel.css`

**Interfaces:**
- `getCenterCodes(): string[]`
- `readCenter(code): CenterData | null`
- `getCenterDirectory(): CenterDirectoryItem[]`
- `/centers/[code]` receives `params: Promise<{ code: string }>` and returns metadata plus server-rendered summary.

- [ ] **Step 1: Write the failing test**

  `scripts/center-pages.test.mjs`에서 `/centers`, `[code]`, `not-found` 파일 존재, 센터 링크·메타데이터·정류장 조회 query parameter 문자열을 검증한다.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node scripts/center-pages.test.mjs`

  Expected: 센터 페이지 파일 또는 query parameter가 없어 실패한다.

- [ ] **Step 3: Write minimal implementation**

  `utils/centerDirectory.ts`는 `public/data/centers`만 읽고 코드 입력을 파일명으로 안전하게 제한한다. `/centers`는 검색 가능한 클라이언트 목록과 서버에 포함되는 센터 요약을 제공한다. `/centers/[code]`는 `generateStaticParams`, `generateMetadata`, `notFound()`를 사용해 센터명·주소·근무조·노선·정류장 수·데이터 상태·노선 요약을 렌더링하고 `/stops?center=<code>` 링크를 만든다. `StopGuide`는 최초 데이터 로드 후 `window.location.search`의 유효한 `center` 값을 읽어 해당 센터를 선택한다.

- [ ] **Step 4: Add focused styles**

  `app/pastel.css`에 센터 디렉터리 검색·목록·상세 요약·경고·모바일 반응형 스타일을 추가하고 기존 카드·타이포그래피 규칙을 재사용한다.

- [ ] **Step 5: Run test to verify it passes**

  Run: `node scripts/center-pages.test.mjs`

  Expected: `Center page checks passed.`

- [ ] **Step 6: Commit**

  ```bash
  git add utils/centerDirectory.ts app/centers components/StopGuide.tsx scripts/center-pages.test.mjs package.json app/pastel.css
  git commit -m "✨ Add crawlable center directory pages"
  ```

### Task 3: 안전한 공개 변경 이력 페이지

**Files:**
- Create: `utils/changelogSummary.ts`
- Create: `app/updates/page.tsx`
- Create: `scripts/changelog-summary.test.mjs`
- Modify: `package.json`
- Modify: `app/pastel.css`

**Interfaces:**
- `readPublicChangelog(file): PublicChangeEntry[]`
- `PublicChangeEntry` contains only `id`, `timestamp`, `source`, `summary`, affected center codes, route/stop counts, and a human-readable label.

- [ ] **Step 1: Write the failing test**

  Fixture 변경 로그에서 `before`, `after`, `Image URL`, 관리자 관련 키가 결과에 포함되지 않고 요약 필드만 남는지 검증한다. 빈 `entries`도 정상적으로 반환되는지 검증한다.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --experimental-strip-types scripts/changelog-summary.test.mjs`

  Expected: 모듈 또는 공개 요약 함수가 없어 실패한다.

- [ ] **Step 3: Write minimal implementation**

  `utils/changelogSummary.ts`는 JSON을 읽고 최신 순으로 정렬하며 최대 30건만 안전한 요약 객체로 변환한다. `/updates`는 변경 일시, 자동/수동 구분, 영향 센터, 노선·정류장 수와 공식 공지 우선 안내를 표시한다.

- [ ] **Step 4: Add navigation links**

  레이아웃 푸터, 홈 도움말, 운영 정책, 모바일 접근 경로에 `변경 이력` 링크를 추가한다.

- [ ] **Step 5: Run test to verify it passes**

  Run: `node --experimental-strip-types scripts/changelog-summary.test.mjs`

  Expected: `Changelog summary tests passed.`

- [ ] **Step 6: Commit**

  ```bash
  git add utils/changelogSummary.ts app/updates scripts/changelog-summary.test.mjs package.json app/pastel.css app/layout.tsx app/page.tsx app/operations/page.tsx components/SiteNavigation.tsx
  git commit -m "✨ Add public shuttle update history"
  ```

### Task 4: 최신성·품질·광고 운영 안내 보강

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/guide/page.tsx`
- Modify: `app/operations/page.tsx`
- Modify: `app/privacy/page.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `components/CoupangBanner.tsx`
- Modify: `app/pastel.css`
- Modify: `scripts/adsense-readiness.test.mjs`

**Interfaces:**
- Existing pages consume `getDataFreshness` and `collectQualityWarnings` without changing route lookup behavior.

- [ ] **Step 1: Write the failing test**

  `scripts/adsense-readiness.test.mjs`에 데이터 기준일·재확인 안내, 센터 디렉터리·변경 이력 링크, Privacy & messaging을 완료된 것으로 가장하지 않는 문구, 제휴 고지 문자열을 검증한다.

- [ ] **Step 2: Run test to verify it fails**

  Run: `npm run test:adsense-readiness`

  Expected: 새 링크 또는 보강 문구가 없어 실패한다.

- [ ] **Step 3: Write minimal implementation**

  홈·가이드·운영 정책에 데이터 기준일과 30일 초과 재확인 안내를 추가한다. 운영 정책에는 품질 경고 의미, 제보 처리, AdSense 등록·소유권·`ads.txt` 확인·CMP 계정 설정 체크리스트를 추가한다. 개인정보처리방침에는 현재 자체 동의 창의 실제 범위와 Google CMP가 별도 계정 설정임을 명시한다. 제휴 배너의 제목과 disclosure를 일반 이용자가 바로 이해할 수 있는 한국어로 정리한다.

- [ ] **Step 4: Run test to verify it passes**

  Run: `npm run test:adsense-readiness`

  Expected: `AdSense readiness content checks passed.`

- [ ] **Step 5: Commit**

  ```bash
  git add app/page.tsx app/guide/page.tsx app/operations/page.tsx app/privacy/page.tsx app/contact/page.tsx components/CoupangBanner.tsx app/pastel.css scripts/adsense-readiness.test.mjs
  git commit -m "📝 Clarify freshness and advertising guidance"
  ```

### Task 5: Sitemap·SEO와 전체 회귀 검증

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `scripts/plain-content.test.mjs`
- Modify: `scripts/stop-guide-data.test.mjs` only if the center query behavior needs a regression case.

- [ ] **Step 1: Write the failing test**

  sitemap 검증을 추가해 `/centers`, `/updates`, 모든 센터 상세 URL이 포함되고 `lastModified`가 데이터 기준일에서 만들어지는지 확인한다.

- [ ] **Step 2: Run test to verify it fails**

  Run: `npm run test:adsense-readiness`

  Expected: 새 sitemap 경로가 없어 실패한다.

- [ ] **Step 3: Write minimal implementation**

  `app/sitemap.ts`가 `public/data/shuttle_meta.json`과 센터 코드 목록을 읽어 기본 경로·센터 경로·변경 이력을 반환하도록 수정한다. 잘못된 날짜는 빌드가 깨지지 않도록 기존 고정 검토일로 제한한다.

- [ ] **Step 4: Run the full verification suite**

  Run: `npm run test:data-summary && npm run test:center-pages && npm run test:changelog-summary && npm run test:adsense-readiness && npm run test:plain-content && npm run test:stop-guide && npx tsc --noEmit && npm run lint && npm run build && git diff --check`

  Expected: 모든 테스트·타입 검사·린트·빌드가 exit 0으로 완료된다.

- [ ] **Step 5: Check public output locally**

  Run the local server and verify HTTP 200 for `/`, `/centers`, `/centers/ANS4`, `/updates`, `/privacy`, `/robots.txt`, and `/sitemap.xml`. Check that the rendered HTML contains center metadata, the public changelog summary, the stale-data warning, and no `before`/`after` keys.

- [ ] **Step 6: Commit final integration**

  ```bash
  git add app/sitemap.ts scripts/plain-content.test.mjs
  git commit -m "✅ Verify AdSense content structure"
  ```

## Completion Handoff

After all tasks pass, report changed pages, test results, the current data freshness warning, and whether GitHub push/deployment was requested. Do not claim AdSense approval; only report readiness improvements and remaining account-level steps.
