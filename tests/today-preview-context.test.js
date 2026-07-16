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
  extractFunction('todayPreviewActivities'),
  'this.daySix = tripData[5];',
].join('\n'), context);

context.clock = {
  now: new Date('2026-08-06T12:00:00+09:00'),
  currentDate: '2026-08-06',
  inTrip: true,
  dayNumber: 6,
};

const preview = JSON.parse(vm.runInContext(
  'JSON.stringify(todayPreviewActivities(activityTimeline(daySix, clock)))',
  context
));

assert.ok(preview.some((activity) => activity.id === 'dior-cafe' && activity.state === 'complete'), 'Today should retain the latest completed stop');
assert.ok(preview.some((activity) => activity.id === 'teamlab-planets' && activity.state === 'next'), 'Today should retain the next timed stop');
assert.equal(
  preview.find((activity) => activity.id === 'teamlab-planets').booking.statusLabel,
  'Admission confirmed',
  'a booked admission without an external URL should carry traveller-facing confirmation text'
);
assert.ok(preview.length <= 3, 'Today should remain a compact preview');

context.flexibleTimeline = [
  { id: 'one', state: 'flexible' },
  { id: 'two', state: 'flexible' },
  { id: 'three', state: 'flexible' },
  { id: 'four', state: 'flexible' },
];
const flexiblePreview = JSON.parse(vm.runInContext(
  'JSON.stringify(todayPreviewActivities(flexibleTimeline))',
  context
));
assert.deepEqual(
  flexiblePreview.map((activity) => activity.id),
  ['one', 'two', 'three'],
  'days without live milestones should retain the first three ordered stops'
);

assert.match(html, /id="todayBookingStatus"[^>]*hidden/, 'Today should include non-link booking confirmation');
assert.match(
  html,
  /bookingStatus\.hidden = !focus\?\.booking \|\| Boolean\(focus\?\.reservationLink\)/,
  'booked activities without reservation URLs should show confirmation context'
);

console.log('Today preview context test passed');
