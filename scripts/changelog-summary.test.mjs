import assert from 'node:assert/strict';
import path from 'node:path';
import { readPublicChangelog, summarizeChangelogPayload } from '../utils/changelogSummary.ts';

const fixture = {
  entries: [
    {
      id: 'older',
      timestamp: '2026-07-20 09:00',
      source: 'automatic',
      summary: '센터 1개 변경',
      stats: { centersChanged: 1, routesChanged: 2, stopsChanged: 3 },
      affectedCenters: ['ANS4'],
      stopChanges: [{ before: { Name: 'old' }, after: { Name: 'new', 'Image URL': 'https://example.com/private.png' } }],
    },
    {
      id: 'newer',
      timestamp: '2026-07-25 21:04',
      source: 'manual',
      summary: '노선 2개 · 정류장 2개 변경',
      stats: { centersChanged: 0, routesChanged: 2, stopsChanged: 2 },
      affectedCenters: ['GYS1'],
      stopChanges: [{ before: { Latitude: '1' }, after: { Latitude: '2' } }],
    },
  ],
};

const publicEntries = summarizeChangelogPayload(fixture);
assert.equal(publicEntries.length, 2);
assert.equal(publicEntries[0].id, 'newer');
assert.equal(publicEntries[0].sourceLabel, '관리자 수정');
assert.equal(publicEntries[0].routesChanged, 2);
assert.equal(publicEntries[0].stopsChanged, 2);
assert.deepEqual(publicEntries[0].affectedCenters, ['GYS1']);
assert.equal(JSON.stringify(publicEntries).includes('before'), false);
assert.equal(JSON.stringify(publicEntries).includes('after'), false);
assert.equal(JSON.stringify(publicEntries).includes('Image URL'), false);
assert.equal(summarizeChangelogPayload({ entries: [] }).length, 0);
assert.equal(summarizeChangelogPayload({}).length, 0);

const actual = readPublicChangelog(path.join(process.cwd(), 'public/data/shuttle_changelog.json'));
assert.ok(actual.length > 0, '공개 변경 이력은 최소 한 건 이상이어야 합니다.');
assert.ok(actual.length <= 30, '공개 변경 이력은 최근 30건으로 제한해야 합니다.');

console.log('Changelog summary tests passed.');
