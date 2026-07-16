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

const elements = new Map();
const element = (selector) => {
  if (!elements.has(selector)) {
    elements.set(selector, {
      textContent: selector === '#todayHotelLabel' ? 'Tonight' : '',
      href: '',
      hidden: false,
      innerHTML: '',
      onclick: null,
      querySelector: () => ({ textContent: '' }),
    });
  }
  return elements.get(selector);
};

const context = vm.createContext({
  Date,
  startDate: '2026-08-01',
  endDate: '2026-08-15',
  document: {
    querySelector: element,
  },
  mapsUrl: (query) => `map:${query}`,
  weatherUrl: (city) => `weather:${city}`,
  openDayView() {},
  showFullRoute() {},
});

vm.runInContext([
  extractDeclaration('tripData', 'bookings'),
  extractDeclaration('bookings', 'hotels'),
  extractDeclaration('hotels', 'travellers'),
  extractFunction('currentHotel'),
  extractFunction('activityTimeline'),
  extractFunction('todayPreviewActivities'),
  extractFunction('renderTodayView'),
].join('\n'), context);

context.clock = {
  now: new Date('2026-08-15T08:00:00+09:00'),
  currentDate: '2026-08-15',
  inTrip: true,
  dayNumber: 15,
  timeZone: 'Asia/Tokyo',
};

assert.equal(
  vm.runInContext('currentHotel(clock).label', context),
  'Departing from',
  'the shared stay helper should recognise the final day as a departure day'
);

vm.runInContext('renderTodayView(clock)', context);

assert.equal(
  element('#todayHotelLabel').textContent,
  'Departing from',
  'the Day 15 Today card should use departure context instead of calling the checked-out hotel Tonight'
);
assert.equal(element('#todayHotelName').textContent, 'Narita Tobu Hotel Airport');

console.log('Day 15 stay context test passed');
