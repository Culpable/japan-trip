const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const openingBrace = html.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function extractDeclaration(name, nextName) {
  const start = html.indexOf(`const ${name} =`);
  const end = html.indexOf(`const ${nextName} =`, start);
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

function rowFor(markup, activityTitle) {
  const titleIndex = markup.indexOf(activityTitle);
  assert.notEqual(titleIndex, -1, `${activityTitle} should render in the run sheet`);
  const rowStart = markup.lastIndexOf('<article', titleIndex);
  const rowEnd = markup.indexOf('</article>', titleIndex);
  assert.notEqual(rowStart, -1, `${activityTitle} should have a row start`);
  assert.notEqual(rowEnd, -1, `${activityTitle} should have a row end`);
  return markup.slice(rowStart, rowEnd + '</article>'.length);
}

const context = vm.createContext({
  Date,
  actionIcons: { maps: '' },
  mapsUrl: (query) => `map:${query}`,
});

vm.runInContext([
  extractDeclaration('tripData', 'bookings'),
  extractFunction('activityTimeline'),
  extractFunction('activityDurationLabel'),
  extractFunction('renderRunSheet'),
  'this.dayOne = tripData[0];',
  'this.daySix = tripData[5];',
].join('\n'), context);

context.dayOneClock = {
  now: new Date('2026-08-01T12:00:00+08:00'),
  currentDate: '2026-08-01',
  inTrip: true,
  dayNumber: 1,
};
context.daySixClock = {
  now: new Date('2026-08-06T12:00:00+09:00'),
  currentDate: '2026-08-06',
  inTrip: true,
  dayNumber: 6,
};

const dayOneRunSheet = vm.runInContext('renderRunSheet(dayOne, dayOneClock)', context);
const daySixRunSheet = vm.runInContext('renderRunSheet(daySix, daySixClock)', context);

const setupAppsRow = rowFor(dayOneRunSheet, 'Set up DiDi, WeChat Pay, Alipay and Meituan');
assert.doesNotMatch(
  setupAppsRow,
  /Open map/,
  'a non-location task should not inherit the day destination as a row-level map action',
);

const toyosuTransferRow = rowFor(daySixRunSheet, 'Travel across Tokyo to Toyosu after lunch');
assert.match(
  toyosuTransferRow,
  /href="map:[^"]*Toyosu/i,
  'the Toyosu transfer should open its own named destination',
);
assert.doesNotMatch(
  toyosuTransferRow,
  /Dior Café Ginza/,
  'the Toyosu transfer should not fall back to the unrelated Dior day destination',
);

const diorRow = rowFor(daySixRunSheet, 'Dior Café');
assert.match(
  diorRow,
  /Open map/,
  'an activity with a specific address should keep its row-level map action',
);

console.log('run sheet map actions test passed');
