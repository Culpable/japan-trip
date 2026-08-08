const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tripDataStart = html.indexOf('const tripData =');
const tripDataEnd = html.indexOf('const bookings =', tripDataStart);
const context = {};
vm.createContext(context);
vm.runInContext(`${html.slice(tripDataStart, tripDataEnd)}; this.tripData = tripData;`, context);

const day = context.tripData.find((item) => item.date === '2026-08-09');
assert.ok(day, '9 August should exist in the itinerary');
assert.equal(day.shojiGuide, true, 'Day 9 should expose the Shoji travel guide');
assert.equal(day.hotel.shojiGuide, true, 'Shoji Lake Hotel should expose the travel guide');
assert.equal(day.transit.route, 'YOTEL Ginza → Shoji Lake Hotel', 'the Day 9 route should name the real start and destination');
assert.match(day.transit.detail, /Shimbashi.*Shinjuku.*Kawaguchiko.*Fujikyu bus/, 'the transfer summary should include every major connection');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog shoji-guide-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Shoji guide modal');
for (let step = 1; step <= 8; step += 1) {
  assert.match(guide, new RegExp(`id="shoji-step-${step}"`), `the complete guide should include step ${step}`);
}

assert.doesNotMatch(guide, /\b\d{1,2}:\d{2}\b|\b(?:AM|PM)\b/, 'the guide should not commit the travellers to fixed departure times');
assert.match(guide, /Shimbashi.*Shinjuku.*Otsuki.*Kawaguchiko.*Shoji.*Shoji Lake Hotel/s, 'the route overview should include every transfer point');
assert.match(guide, /FUJI EXCURSION.*reserved seat/s, 'the guide should explain the direct reserved-seat option');
assert.match(guide, /Chuo Line train to Otsuki.*Fujikyu Railway/s, 'the guide should explain the flexible Otsuki connection');
assert.match(guide, /Shoji Lake Hotel-mae \/ 精進レイクホテル前/, 'the guide should name the closest local bus stop');
assert.match(guide, /Blue Line.*Shoji \/ 精進/s, 'the guide should name the Blue Line fallback stop');
assert.match(guide, /精進レークホテルに行きたいです。次に乗れるバスと乗り場を教えてください。/, 'the guide should include the bus-desk phrase in Japanese');
assert.match(guide, /一番近い停留所に着いたら教えてください。/, 'the guide should include the driver phrase in Japanese');
assert.match(guide, /本日、宿泊予約をしています。チェックインをお願いします。/, 'the guide should include the check-in phrase in Japanese');
assert.match(guide, /〒401-0336 山梨県南都留郡富士河口湖町精進255/, 'the guide should include the full Japanese hotel address');

assert.match(html, /id="todayShojiGuide"[^>]*data-open-shoji-guide/, 'Today should include a Shoji guide action');
assert.match(html, /plan\.shojiGuide.*data-open-shoji-guide/, 'the Day 9 timeline should include a Shoji guide action');
assert.match(html, /day\.shojiGuide.*Open Shoji guide/, 'the Day 9 quick view should include a Shoji guide action');
assert.match(html, /hotel\.shojiGuide.*Shoji guide/, 'the Shoji Lake Hotel booking should include a guide action');
assert.match(html, /function openShojiGuide\(\)/, 'all entry points should open one shared Shoji guide');

for (const url of [
  'https://www.yotel.com/en/hotels/yotel-tokyo-ginza',
  'https://e.fujikyu-railway.jp/fujikaiyuu/',
  'https://www.jreast.co.jp/e/routemaps/pdf/routemaps_timetable.pdf',
  'https://www.fujikyubus.co.jp/shuyu',
  'https://shojilake.jp/access/'
]) {
  assert.ok(guide.includes(url), `${url} should remain available in the guide`);
}

console.log('Day 9 Shoji guide test passed');
