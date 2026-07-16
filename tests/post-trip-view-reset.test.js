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

function makeClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
    toggle(name, force) {
      const enabled = force === undefined ? !classes.has(name) : force;
      if (enabled) classes.add(name); else classes.delete(name);
      return enabled;
    },
  };
}

function makeElement(initial = {}) {
  return {
    hidden: false,
    textContent: '',
    classList: makeClassList(),
    querySelector: () => ({ remove() {}, prepend() {} }),
    scrollIntoView() {},
    ...initial,
  };
}

const fullRouteChip = makeElement({ dataset: { filter: 'all' }, classList: makeClassList(['active']) });
const regionChip = makeElement({ dataset: { filter: 'tokyo' } });
const chips = [fullRouteChip, regionChip];
const regions = Array.from({ length: 5 }, () => makeElement());
const todayView = makeElement({ hidden: true });
const todayShortcut = makeElement({ hidden: false });
const nextBooking = makeElement();
const elements = {
  '#tripStatus': makeElement(),
  '#tripKicker': makeElement(),
  '#tripDetail': makeElement(),
  '#liveGreeting': makeElement(),
  '#jumpToday': makeElement(),
  '#todayShortcut': todayShortcut,
  '#todayView': todayView,
  '#nextBooking': nextBooking,
  '#prepChecklist': makeElement(),
  '.urgent': makeElement(),
};
const tripDays = Array.from({ length: 15 }, (_, index) => makeElement({
  dataset: { date: `2026-08-${String(index + 1).padStart(2, '0')}` },
}));
let clock = {
  now: new Date('2026-08-15T12:00:00+09:00'),
  currentDate: '2026-08-15',
  inTrip: true,
  dayNumber: 15,
  timeZone: 'Asia/Tokyo',
};

const context = vm.createContext({
  Date,
  Math,
  startDate: '2026-08-01',
  endDate: '2026-08-15',
  tripData: Array.from({ length: 15 }, (_, index) => ({
    day: index + 1,
    location: 'Tokyo',
    title: `Day ${index + 1}`,
  })),
  tripDays,
  chips,
  regions,
  travellers: 'Jake & Helena',
  countdownTeasers: [],
  window: { tripState: clock },
  document: {
    body: { classList: makeClassList() },
    createElement: () => makeElement(),
    querySelector: (selector) => elements[selector],
  },
  previewableNow: () => clock.now,
  tripClock: () => clock,
  renderTodayView() {},
  renderPrepChecklist() {},
  hideCountdownDelight() {},
  renderCountdownDelight() {},
  pickForDay() {},
  sleepsLabel() {},
  dayDistance() {},
  localHour: () => 12,
  applyPreTripCompanionMood() {},
  updateProgress() {},
  updateNextBooking() {},
  updateHotel() {},
  updateTimeGrid() {},
  updateActivityMoments() {},
  updateStamps() {},
  renderWallets() {},
  refreshOpenDayDialog() {},
  openDayView() {},
});
vm.runInContext([
  'let itineraryView = "auto";',
  extractFunction('showFullRoute'),
  extractFunction('showTodayMode'),
  extractFunction('updateTripState'),
].join('\n'), context);

vm.runInContext('showTodayMode(window.tripState)', context);
assert.equal(nextBooking.hidden, true, 'Today mode should hide route-level next-booking content');
assert.equal(fullRouteChip.classList.contains('active'), false, 'Today mode should clear the Full route selection');

clock = {
  now: new Date('2026-08-16T12:00:00+09:00'),
  currentDate: '2026-08-16',
  inTrip: false,
  dayNumber: null,
  timeZone: 'Asia/Tokyo',
};
context.window.tripState = clock;
vm.runInContext('updateTripState()', context);

assert.equal(todayView.hidden, true, 'post-trip refresh should close Today mode');
assert.ok(regions.every((region) => region.hidden === false), 'post-trip refresh should restore every route region');
assert.equal(fullRouteChip.classList.contains('active'), true, 'post-trip refresh should select Full route');
assert.equal(nextBooking.hidden, false, 'post-trip refresh should restore route-level next-booking content');
assert.equal(vm.runInContext('itineraryView', context), 'route', 'post-trip refresh should reset the tracked view to Full route');

console.log('post-trip view reset test passed');
