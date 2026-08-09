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
assert.equal(day.transit.time, '12:30PM', 'the Day 9 transfer should start with the planned YOTEL departure');
assert.equal(day.transit.leaveBy, '12:30PM', 'Today should tell the travellers when to leave YOTEL');
assert.match(day.transit.detail, /Taxi.*KAIJI 27.*Otsuki.*Thomas Land local.*taxi/i, 'the transfer summary should include the selected route and both taxis');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog shoji-guide-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Shoji guide modal');
for (let step = 1; step <= 7; step += 1) {
  assert.match(guide, new RegExp(`id="shoji-step-${step}"`), `the complete guide should include step ${step}`);
}

assert.match(guide, /12:30PM.*1:30PM.*2:30PM.*3:03PM.*4:09PM/s, 'the guide should show the selected journey times in order');
assert.match(guide, /YOTEL.*Taxi.*Shinjuku.*KAIJI 27.*Otsuki.*Thomas Land local.*Kawaguchiko.*Taxi.*Shoji Lake Hotel/is, 'the route overview should include every leg from YOTEL to the hotel');
assert.match(guide, /JR新宿駅南口までお願いします。/, 'the guide should include the Shinjuku taxi phrase in Japanese');
assert.match(guide, /KAIJI 27.*1:30PM.*Track 9.*Otsuki.*2:30PM/s, 'the guide should identify the booked JR train, platform, and arrival time');
assert.match(guide, /Booked ticket.*KAIJI 27.*ordinary reserved seats.*two adults/s, 'the guide should treat the KAIJI 27 reservation as confirmed');
const stepTwo = guide.slice(guide.indexOf('id="shoji-step-2"'), guide.indexOf('id="shoji-step-3"'));
assert.doesNotMatch(stepTwo, /If the KAIJI ticket|If the reservation|still needs to be completed|Open JR-EAST Train Reservation/, 'the booked KAIJI section should not present conditional ticket-booking instructions');
assert.match(stepTwo, /<details class="ticket-proof">.*Show ticket confirmation.*Car 7.*16A.*16B/s, 'the booked KAIJI section should include a click-to-show ticket confirmation');
assert.match(stepTwo, /assets\/kaiji-27-reservation\.png.*assets\/kaiji-27-seats\.png/s, 'the ticket confirmation should include the reservation and seat images');
assert.match(stepTwo, /Each traveller still taps their own Suica/, 'the ticket confirmation should explain the separate basic fare');
assert.match(guide, /3:03PM.*Thomas Land.*4:09PM/s, 'the guide should identify the Fujikyu local connection');
assert.match(guide, /Suica.*¥1,170/s, 'the guide should explain the Fujikyu local fare and payment method');
assert.match(guide, /¥6,000.*¥7,500/s, 'the guide should include the expected final taxi fare');
assert.match(guide, /精進レークホテルまでお願いします。.*山梨県南都留郡富士河口湖町精進255/s, 'the guide should include the final taxi phrase and hotel address in Japanese');
assert.match(guide, /本日、宿泊予約をしています。チェックインをお願いします。/, 'the guide should include the check-in phrase in Japanese');
assert.match(guide, /〒401-0336 山梨県南都留郡富士河口湖町精進255/, 'the guide should include the full Japanese hotel address');

assert.match(html, /id="todayShojiGuide"[^>]*data-open-shoji-guide/, 'Today should include a Shoji guide action');
assert.match(html, /plan\.shojiGuide.*data-open-shoji-guide/, 'the Day 9 timeline should include a Shoji guide action');
assert.match(html, /day\.shojiGuide.*Open Shoji guide/, 'the Day 9 quick view should include a Shoji guide action');
assert.match(html, /hotel\.shojiGuide.*Shoji guide/, 'the Shoji Lake Hotel booking should include a guide action');
assert.match(html, /function openShojiGuide\(\)/, 'all entry points should open one shared Shoji guide');

for (const url of [
  'https://www.yotel.com/en/hotels/yotel-tokyo-ginza',
  'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
  'https://timetables.jreast.co.jp/en/2608/train/060/063461.html',
  'https://e.fujikyu-railway.jp/station/timetable.php?no=1',
  'https://www.fujikyu-railway.jp/en/train/thomas.php',
  'https://e.fujikyu-railway.jp/fare/',
  'https://shojilake.jp/access/'
]) {
  assert.ok(guide.includes(url), `${url} should remain available in the guide`);
}

console.log('Day 9 Shoji guide test passed');
