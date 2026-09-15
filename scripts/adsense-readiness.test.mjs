import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

assert.ok(exists('app/guide/page.tsx'), '이용 가이드 페이지가 있어야 합니다.');
assert.ok(exists('app/faq/page.tsx'), 'FAQ 페이지가 있어야 합니다.');
assert.ok(exists('app/robots.ts'), 'robots 생성 파일이 있어야 합니다.');
assert.ok(exists('app/sitemap.ts'), 'sitemap 생성 파일이 있어야 합니다.');

const guide = read('app/guide/page.tsx');
assert.match(guide, /노선 조회 방법/);
assert.match(guide, /데이터 출처/);
assert.match(guide, /비공식/);

const faq = read('app/faq/page.tsx');
assert.match(faq, /공식 셔틀/);
assert.match(faq, /오류 제보/);
assert.match(faq, /정류장/);
assert.match(faq, /faq-followup/);

const pastelStyles = read('app/pastel.css');
assert.match(pastelStyles, /\.faq-followup\s*\{[^}]*margin-top:\s*42px/s);

const layout = read('app/layout.tsx');
assert.match(layout, /metadataBase/);
assert.match(layout, /alternates/);
assert.match(layout, /\/guide/);
assert.match(layout, /\/faq/);
assert.match(layout, /\/centers/);
assert.match(layout, /\/updates/);

const navigation = read('components/SiteNavigation.tsx');
assert.match(navigation, /href: '\/guide'/);
assert.match(navigation, /href: '\/faq'/);
assert.match(navigation, /href: '\/centers'/);
assert.match(navigation, /href: '\/updates'/);

const home = read('app/page.tsx');
assert.match(home, /\/guide/);
assert.match(home, /\/faq/);
assert.match(home, /\/centers/);
assert.match(home, /\/updates/);

const operations = read('app/operations/page.tsx');
assert.match(operations, /데이터 출처/);
assert.match(operations, /정보가 다를 때/);

const privacy = read('app/privacy/page.tsx');
assert.match(privacy, /AdSense/);
assert.match(privacy, /계정에서 별도로/);

const banner = read('components/CoupangBanner.tsx');
assert.match(banner, /쿠팡 파트너스 활동의 일환/);
assert.match(banner, /수수료/);

const centers = read('app/centers/page.tsx');
assert.match(centers, /최신 공식 공지/);

const updates = read('app/updates/page.tsx');
assert.match(updates, /변경 이력을 공개하는 이유/);
assert.match(updates, /원본 비교 자료/);

const sitemap = read('app/sitemap.ts');
assert.match(sitemap, /getCenterCodes/);
assert.match(sitemap, /\/updates/);
assert.match(sitemap, /\/centers/);

console.log('AdSense readiness content checks passed.');
