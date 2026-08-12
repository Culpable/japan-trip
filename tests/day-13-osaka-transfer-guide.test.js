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

const day = context.tripData.find((item) => item.date === '2026-08-13');
assert.ok(day, '13 August should exist in the itinerary');
assert.equal(day.osakaTransferGuide, true, 'Day 13 should expose the Osaka transfer guide');
assert.equal(day.hotel.osakaTransferGuide, true, 'DoubleTree should expose the arrival guide');
assert.equal(day.transit.route, 'NOHGA Hotel Kiyomizu Kyoto → DoubleTree by Hilton Osaka Castle', 'the route should name both hotels');
assert.equal(day.transit.time, '8:25AM', 'the transfer should start with the planned NOHGA departure');
assert.equal(day.transit.leaveBy, '8:25AM', 'Today should tell the travellers to leave NOHGA at 8:25AM');
assert.match(day.transit.detail, /taxi.*Kiyomizu-Gojo.*8:42AM.*Semi-Express.*Temmabashi.*10:00AM.*walk.*DoubleTree/i, 'the summary should include the taxi, one direct train and final hotel walk');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog osaka-transfer-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Osaka transfer guide');
for (let step = 1; step <= 6; step += 1) {
  assert.match(guide, new RegExp(`id="osaka-transfer-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /NOHGA Hotel.*8:25AM.*taxi.*Kiyomizu-Gojo.*8:42AM.*Temmabashi.*10:00AM.*DoubleTree/is, 'the route overview should include every fixed leg and time in order');
assert.match(guide, /Thursday 13 August.*Saturday\/holiday timetable.*Obon/is, 'the guide should explain the special timetable in force');
assert.match(guide, /8:42AM.*Semi-Express.*Yodoyabashi.*Platform 2/is, 'the guide should identify the exact direct train and platform');
assert.match(guide, /one direct train.*no transfers/is, 'the guide should make the single-train route explicit');
assert.match(guide, /No booking.*unreserved.*Suica.*ICOCA.*¥490/is, 'the guide should explain reservation, seating, payment and fare');
assert.match(guide, /清水五条駅までお願いします。荷物が多いので、エレベーターに近い入口で降ろしてください。/, 'the guide should include the origin taxi phrase');
assert.match(guide, /8時42分発の準急・淀屋橋行きで、天満橋まで行きたいです。2番のりばで合っていますか？/, 'the guide should include the station-staff phrase');
assert.match(guide, /天満橋駅.*ダブルツリーbyヒルトン大阪城.*大阪府大阪市中央区大手前1丁目1番1号/is, 'the guide should include the destination station, hotel and Japanese address');
assert.match(guide, /10:05–10:10AM/, 'the guide should show the expected hotel arrival window');
assert.doesNotMatch(guide, /reservation required|<strong>reserved seat|Premium Car|Liner ticket/i, 'the guide should not imply that the selected train needs a reservation or supplement');

assert.match(html, /id="todayOsakaTransferGuide"[^>]*data-open-osaka-transfer-guide/, 'Today should include an Osaka transfer action');
assert.match(html, /plan\.osakaTransferGuide.*data-open-osaka-transfer-guide/, 'the Day 13 timeline should include the guide action');
assert.match(html, /day\.osakaTransferGuide.*Open Osaka travel guide/, 'the Day 13 quick view should include the guide action');
assert.match(html, /hotel\.osakaTransferGuide.*Arrival guide/, 'the DoubleTree booking should include an arrival guide action');
assert.match(html, /function openOsakaTransferGuide\(\)/, 'all entry points should open one shared Osaka guide');

for (const url of [
  'https://www.nohgahotel.com/kiyomizu/en/access/',
  'https://www.keihan.co.jp/traffic/news/2026/detail/obondaiya.html',
  'https://www.keihan.co.jp/traffic/station/assets/pdf/time/16122.pdf',
  'https://www.keihan.co.jp/traffic/station/161/info.html',
  'https://www.keihan.co.jp/traffic/station/assets/pdf/fare/161.pdf',
  'https://www.hilton.com/en/hotels/osaocdi-doubletree-osaka-castle/'
]) {
  assert.ok(guide.includes(url), `${url} should be available in the guide`);
}

console.log('Day 13 Osaka transfer guide test passed');
