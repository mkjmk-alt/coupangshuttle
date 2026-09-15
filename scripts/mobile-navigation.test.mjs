import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const navigation = read('components/SiteNavigation.tsx');
assert.match(navigation, /label: '지도', shortLabel: '지도'/);
assert.match(navigation, /\['\/', '\/stops', '\/contact'\]/);
assert.match(navigation, /const primaryNavigation = navigation\.filter/);
assert.match(navigation, /visibleNavigation = primaryNavigation/);

const contact = read('app/contact/page.tsx');
for (const href of ['/guide', '/faq', '/centers', '/updates', '/operations', '/privacy', '/terms']) {
  assert.match(contact, new RegExp(`href=\\"${href.replace('/', '\\/')}\\"`), `문의 화면에 ${href} 링크가 있어야 합니다.`);
}
assert.match(contact, /도움말·정책/);

console.log('Mobile navigation checks passed.');
