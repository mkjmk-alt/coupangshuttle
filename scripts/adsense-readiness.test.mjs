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

const layout = read('app/layout.tsx');
assert.match(layout, /metadataBase/);
assert.match(layout, /alternates/);
assert.match(layout, /\/guide/);
assert.match(layout, /\/faq/);

const navigation = read('components/SiteNavigation.tsx');
assert.match(navigation, /href: '\/guide'/);
assert.match(navigation, /href: '\/faq'/);

const home = read('app/page.tsx');
assert.match(home, /\/guide/);
assert.match(home, /\/faq/);

const operations = read('app/operations/page.tsx');
assert.match(operations, /데이터 출처/);
assert.match(operations, /정보가 다를 때/);

console.log('AdSense readiness content checks passed.');
