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

const context = vm.createContext({ Date });
vm.runInContext([
  extractDeclaration('tripData', 'bookings'),
  extractFunction('activityTimeline'),
  'this.daySix = tripData[5];',
].join('\n'), context);

context.clock = {
  now: new Date('2026-08-06T12:00:00+09:00'),
  currentDate: '2026-08-06',
  inTrip: true,
  dayNumber: 6,
};
const timeline = JSON.parse(vm.runInContext('JSON.stringify(activityTimeline(daySix, clock))', context));

assert.equal(timeline.find((activity) => activity.id === 'dior-cafe').state, 'complete', 'Dior should be complete at noon');
assert.equal(timeline.find((activity) => activity.id === 'teamlab-planets').state, 'next', 'teamLab should be the next timed activity at noon');
assert.equal(timeline.find((activity) => activity.id === 'teamlab-planets').leaveBy, '3:45PM', 'the next activity should retain its leave-by time');

assert.match(html, /class="run-sheet"/, 'the daily dialog should render a run-sheet timeline');
assert.match(html, /run-sheet-item[^`]*data-state=/, 'run-sheet rows should expose their live state');
assert.match(html, />Reservation<\/span>/, 'booked activities should expose reservation actions');
assert.match(html, />Open map<\/span>/, 'run-sheet activities should expose map actions');
assert.match(html, /Open full run sheet/, 'Today should open the complete daily run sheet');

console.log('live run sheet test passed');
