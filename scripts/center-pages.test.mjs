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

assert.ok(exists('utils/centerDirectory.ts'), '센터 디렉터리 유틸리티가 있어야 합니다.');
assert.ok(exists('app/centers/page.tsx'), '센터 디렉터리 페이지가 있어야 합니다.');
assert.ok(exists('app/centers/[code]/page.tsx'), '센터 상세 페이지가 있어야 합니다.');
assert.ok(exists('app/centers/not-found.tsx'), '센터 404 페이지가 있어야 합니다.');

const directory = read('utils/centerDirectory.ts');
assert.match(directory, /getCenterCodes/);
assert.match(directory, /readCenter/);
assert.match(directory, /getCenterDirectory/);

const directoryPage = read('app/centers/page.tsx');
assert.ok(directoryPage.includes('CenterDirectory'));

const directoryComponent = read('components/CenterDirectory.tsx');
assert.match(directoryComponent, /센터 검색/);
assert.match(directoryComponent, /센터명·코드·지역으로 검색/);
assert.ok(directoryComponent.includes('/centers/'));
assert.ok(directoryComponent.includes('/stops?center='));

const detailPage = read('app/centers/[code]/page.tsx');
assert.match(detailPage, /generateStaticParams/);
assert.match(detailPage, /generateMetadata/);
assert.match(detailPage, /notFound/);
assert.match(detailPage, /summarizeCenter/);
assert.ok(detailPage.includes('/stops?center='));

const stopGuide = read('components/StopGuide.tsx');
assert.match(stopGuide, /URLSearchParams/);
assert.match(stopGuide, /center/);

console.log('Center page checks passed.');
