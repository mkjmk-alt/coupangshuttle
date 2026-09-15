import assert from 'node:assert/strict';
import { collectQualityWarnings, getDataFreshness, summarizeCenter } from '../utils/dataSummary.ts';

const fixture = {
  code: 'TEST1',
  center: {
    name: '테스트센터',
    address: '경기 테스트시 테스트로 1',
  },
  shifts: {
    주간조: {
      정상노선: [
        { Time: '07:00', Name: '정상 정류장', Address: '서울 테스트구 정상로 1', Latitude: '37.1', Longitude: '127.1' },
        { Time: '07:30', Name: '도착 정류장', Address: '경기 테스트시 도착로 1', Latitude: '37.2', Longitude: '127.2' },
      ],
      품질경고노선: [
        { Time: '08:00', Name: '첫 정류장', Address: 'None', Latitude: 'invalid', Longitude: '127.3' },
        { Time: '07:00', Name: '두 번째 정류장', Address: '서울 테스트구 경고로 2', Latitude: '37.3', Longitude: '127.3' },
      ],
    },
    오후조: {
      빈노선: [],
    },
  },
};

const summary = summarizeCenter(fixture, '2026-07-25 21:04', new Date('2026-09-16T00:00:00+09:00'));
assert.equal(summary.code, 'TEST1');
assert.equal(summary.name, '테스트센터');
assert.equal(summary.shiftCount, 2);
assert.equal(summary.routeCount, 3);
assert.equal(summary.stopCount, 4);
assert.equal(summary.freshness.status, 'stale');
assert.equal(summary.warningCount, 3);

const warningCodes = new Set(collectQualityWarnings(fixture).map((warning) => warning.code));
assert.deepEqual(warningCodes, new Set(['placeholder', 'invalid-coordinate', 'time-order']));

assert.equal(getDataFreshness('not-a-date', new Date('2026-09-16T00:00:00+09:00')).status, 'unknown');
assert.equal(
  getDataFreshness('2026-09-01 00:00', new Date('2026-09-16T00:00:00+09:00')).status,
  'current',
);

console.log('Data summary tests passed.');
