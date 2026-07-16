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
  'this.finalDay = tripData[14];',
].join('\n'), context);

function flightState(now) {
  context.clock = {
    now: new Date(now),
    currentDate: '2026-08-15',
    inTrip: true,
    dayNumber: 15,
  };
  return vm.runInContext(
    "activityTimeline(finalDay, clock).find((activity) => activity.id === 'vn307-vn791-flight').state",
    context
  );
}

assert.equal(
  flightState('2026-08-15T22:29:00+08:00'),
  'current',
  'the final flight should remain in progress until its stated 10:30PM Perth arrival'
);
assert.equal(
  flightState('2026-08-15T22:30:00+08:00'),
  'complete',
  'the final flight should complete at its stated 10:30PM Perth arrival'
);

console.log('Day 15 flight timeline test passed');
