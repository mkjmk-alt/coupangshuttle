import assert from 'node:assert/strict';
import { filterGuideStops, getGuideStops } from '../utils/stopGuideData.ts';

const sampleData = {
  TST1: {
    center: { name: '테스트센터 (TST1)' },
    shifts: {
      주간조: {
        '서울 1호선': [
          {
            Name: '가산디지털단지역 1번 출구',
            Address: '서울 금천구 가산동',
            Time: '06:40',
          },
          {
            Name: '독산역 앞',
            Address: '서울 금천구 독산동',
            Time: '06:50',
          },
        ],
      },
      오후조: {
        '서울 1호선': [
          {
            Name: '가산디지털단지역 1번 출구',
            Address: '서울 금천구 가산동',
            Time: '14:40',
          },
        ],
      },
    },
  },
};

const selectedStops = getGuideStops(sampleData, 'TST1', '주간조', '서울 1호선');

assert.equal(selectedStops.length, 2);
assert.equal(selectedStops[0].routeIndex, 1);
assert.equal(selectedStops[1].Name, '독산역 앞');
assert.equal(selectedStops[0].fcName, '테스트센터 (TST1)');

const addressMatches = filterGuideStops(selectedStops, '금천구 독산동');
assert.equal(addressMatches.length, 1);
assert.equal(addressMatches[0].Name, '독산역 앞');

assert.equal(filterGuideStops(selectedStops, '').length, 2);

console.log('stop guide data tests passed');
