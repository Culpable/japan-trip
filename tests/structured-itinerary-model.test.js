const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractDeclaration(name, nextName) {
  const start = html.indexOf(`const ${name} =`);
  const end = html.indexOf(`const ${nextName} =`, start);
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

const context = vm.createContext({});
vm.runInContext(`${extractDeclaration('tripData', 'bookings')}; this.model = tripData;`, context);
const tripData = JSON.parse(vm.runInContext('JSON.stringify(model)', context));

assert.equal(tripData.length, 15, 'the structured itinerary should contain all 15 days');
assert.equal(new Set(tripData.map((day) => day.date)).size, 15, 'every itinerary date should be unique');
assert.deepEqual(
  tripData.map((day) => day.date),
  Array.from({ length: 15 }, (_, index) => `2026-08-${String(index + 1).padStart(2, '0')}`),
  'the model should cover 1-15 August in order'
);

tripData.forEach((day, index) => {
  assert.equal(day.day, index + 1, `day ${index + 1} should carry its sequence number`);
  assert.ok(day.region, `day ${index + 1} should carry its region`);
  assert.ok(day.location, `day ${index + 1} should carry its traveller-facing location`);
  assert.ok(day.title, `day ${index + 1} should carry its title`);
  assert.ok(day.mapQuery, `day ${index + 1} should carry its map query`);
  assert.ok(day.weatherCity, `day ${index + 1} should carry its weather destination`);
  assert.ok(day.transit?.route, `day ${index + 1} should carry a transit summary`);
  assert.ok(Array.isArray(day.activities) && day.activities.length, `day ${index + 1} should carry ordered activities`);
});

const daySix = tripData[5];
const dior = daySix.activities.find((activity) => activity.id === 'dior-cafe');
const teamLab = daySix.activities.find((activity) => activity.id === 'teamlab-planets');
assert.equal(dior.instant, '2026-08-06T10:30:00+09:00');
assert.equal(dior.reservationLink, 'https://www.tablecheck.com/en/reservation/4LEMYV');
assert.equal(teamLab.instant, '2026-08-06T16:30:00+09:00');
assert.equal(teamLab.leaveBy, '3:45PM');

assert.doesNotMatch(html, /const dayPlans =|const transitByDay =|const activityMoments =/, 'legacy split itinerary datasets should be removed');

console.log('structured itinerary model test passed');
