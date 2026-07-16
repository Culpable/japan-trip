const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
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
  'this.days = tripData;',
].join('\n'), context);

function timelineFor(dayIndex, now, currentDate) {
  context.dayIndex = dayIndex;
  context.clock = {
    now: new Date(now),
    currentDate,
    inTrip: true,
    dayNumber: Number(currentDate.slice(-2)),
  };
  return JSON.parse(vm.runInContext(
    'JSON.stringify(activityTimeline(days[dayIndex], clock))',
    context,
  ));
}

function statesFor(timeline, activityIds) {
  return Object.fromEntries(activityIds.map((id) => [
    id,
    timeline.find((activity) => activity.id === id)?.state,
  ]));
}

test('future-day activities remain upcoming instead of becoming globally next', () => {
  const timeline = timelineFor(5, '2026-08-05T12:00:00+09:00', '2026-08-05');

  assert.deepEqual(
    timeline.filter((activity) => activity.state === 'next').map((activity) => activity.id),
    [],
    'Day 6 must not expose an Up next activity while Day 5 is still current',
  );
});

test('Day 6 earlier flexible travel is complete after teamLab finishes', () => {
  const timeline = timelineFor(5, '2026-08-06T18:30:00+09:00', '2026-08-06');

  assert.deepEqual(
    statesFor(timeline, ['ginza-to-toyosu', 'toyosu-transfer']),
    {
      'ginza-to-toyosu': 'complete',
      'toyosu-transfer': 'complete',
    },
    'ordered travel before the completed teamLab milestone must not resurface as Flexible',
  );
});

test('Day 11 earlier flexible stops complete when the kimono milestone starts', () => {
  const timeline = timelineFor(10, '2026-08-11T10:30:00+09:00', '2026-08-11');

  assert.deepEqual(
    statesFor(timeline, ['arashiyama-grove', 'tenryuji-riverside']),
    {
      'arashiyama-grove': 'complete',
      'tenryuji-riverside': 'complete',
    },
    'ordered morning stops must complete once the later kimono milestone is current',
  );
});

test('Day 11 earlier flexible stops stay complete after the kimono milestone finishes', () => {
  const timeline = timelineFor(10, '2026-08-11T12:30:00+09:00', '2026-08-11');

  assert.deepEqual(
    statesFor(timeline, ['arashiyama-grove', 'tenryuji-riverside']),
    {
      'arashiyama-grove': 'complete',
      'tenryuji-riverside': 'complete',
    },
    'Today must not move backwards to Arashiyama after the kimono milestone completes',
  );
});

test('Day 14 stores the 2:00PM departure as a machine-readable instant', () => {
  const dayFourteen = JSON.parse(vm.runInContext('JSON.stringify(days[13])', context));
  const departure = dayFourteen.activities.find((activity) => activity.id === 'leave-koyasan');

  assert.equal(
    departure.instant,
    '2026-08-14T14:00:00+09:00',
    'the visible 2:00PM departure must have a machine-readable instant',
  );
});

test('Day 14 at 1:00PM prioritises the 2:00PM Koyasan departure', () => {
  const timeline = timelineFor(13, '2026-08-14T13:00:00+09:00', '2026-08-14');
  const focus = timeline.find((activity) => activity.state === 'current')
    || timeline.find((activity) => activity.state === 'next')
    || timeline.find((activity) => activity.state !== 'complete');

  assert.equal(
    focus?.id,
    'leave-koyasan',
    'Today must prioritise the known 2:00PM departure instead of the first flexible stop',
  );
});
