import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const pageSources = [
  'app/page.tsx',
  'app/stops/page.tsx',
  'app/guide/page.tsx',
  'app/faq/page.tsx',
  'app/operations/page.tsx',
  'app/contact/page.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/layout.tsx',
];

const bannedDecorativeLabels = [
  'COMMUTE / SHUTTLE',
  'HOW TO RIDE',
  'HELP &amp; DATA',
  'STOP GUIDE',
  'TEXT-FIRST ROUTE LIST',
  'RIDE GUIDE',
  'Operations & Data',
  'Support & Data Feedback',
  'Privacy Policy',
  'Terms of Service',
];

for (const pagePath of pageSources) {
  const source = read(pagePath);
  for (const label of bannedDecorativeLabels) {
    assert.equal(source.includes(label), false, `${pagePath}에 장식용 영문 레이블이 남아 있습니다: ${label}`);
  }
}

assert.match(read('app/guide/page.tsx'), /plain-content-page/);
assert.match(read('app/faq/page.tsx'), /plain-content-page/);
assert.match(read('app/contact/page.tsx'), /contact-panel/);
assert.match(read('app/pastel.css'), /\.plain-content-page/);
assert.match(read('app/pastel.css'), /\.contact-panel/);

console.log('Plain content style checks passed.');
