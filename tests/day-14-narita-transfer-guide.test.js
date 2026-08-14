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

const day = context.tripData.find((item) => item.date === '2026-08-14');
assert.ok(day, '14 August should exist in the itinerary');
assert.equal(day.naritaTransferGuide, true, 'Day 14 should expose the Narita transfer guide');
assert.equal(day.hotel.naritaTransferGuide, true, 'Narita Tobu should expose its arrival guide');
assert.equal(day.transit.route, 'DoubleTree by Hilton Osaka Castle → Narita Tobu Hotel Airport', 'the route should name both hotels');
assert.equal(day.title, 'Osaka → Narita airport hotel', 'Day 14 should no longer advertise an impossible Koyasan day trip');
assert.equal(day.transit.time, '11:05AM', 'the transfer should use the revised 11:05AM departure');
assert.equal(day.transit.leaveBy, '11:05AM', 'Today should tell the travellers to leave DoubleTree by 11:05AM');
assert.equal(day.transit.instant, '2026-08-14T11:05:00+09:00', 'the revised departure should be machine readable');
assert.match(day.transit.detail, /taxi.*Shin-Osaka.*Nozomi 18.*12:06PM.*Tokyo.*2:33PM.*TYO-NRT.*2:40PM.*2:50PM.*3:00PM.*3:10PM.*Terminal 2.*shuttle.*taxi/i, 'the summary should include the confirmed Shinkansen, every airport bus choice and both final options');
assert.equal(day.activities[1].booking.statusLabel, 'Green Car 8 · 15-A/15-B', 'the booking wallet should show the Nozomi seats');
assert.match(day.activities[2].title, /TYO-NRT.*Terminal 2/i, 'the live activity list should use the airport bus route');
assert.match(day.activities[3].title, /Narita Express 35.*cancelled/i, 'the cancelled train should remain visible as a reference');
assert.equal(day.activities[3].booking.statusLabel, 'Cancelled · automatic refund', 'the booking wallet should show that the Narita Express is cancelled');
assert.doesNotMatch(JSON.stringify(day.activities), /Koyasan|Okunoin|Kongobuji/i, 'the revised travel day should not retain the cancelled Koyasan activities');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog narita-transfer-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Narita transfer guide');
for (let step = 1; step <= 10; step += 1) {
  assert.match(guide, new RegExp(`id="narita-transfer-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /DoubleTree.*11:05AM.*taxi.*Shin-Osaka.*Nozomi.*Tokyo.*TYO-NRT.*Airport Terminal 2.*Shuttle.*Taxi.*Narita Tobu/is, 'the route overview should show the active bus route and final choice in order');
assert.match(guide, /Obon.*all Nozomi seats are reserved/is, 'the guide should explain the peak-period Nozomi reservation rule');
assert.match(guide, /Nozomi 18.*12:06PM.*Car 8.*15-A.*15-B/is, 'the guide should show the confirmed Nozomi time and seats');
assert.match(guide, /Narita Express 35.*cancelled.*3:03PM.*Car 12.*3-C.*3-D/is, 'the guide should preserve the Narita Express details while clearly marking it cancelled');
assert.match(guide, /Do not go to the N.EX platform|Do not follow.*N.EX/is, 'the guide should stop travellers following the cancelled train route');
assert.match(guide, /guide-train-service[^>]*><span>Train \/ service<\/span><strong>Nozomi/is, 'the Nozomi service should have a dedicated visual highlight');
assert.match(guide, /guide-train-stop[^>]*><span>Get off here<\/span><strong>Tokyo Station/is, 'the Tokyo exit station should have a separate visual highlight');
assert.match(guide, /2:40PM.*2:50PM.*3:00PM.*3:10PM/is, 'the guide should show every relevant bus from 2:40PM through 3:10PM');
assert.match(guide, /2:40PM.*Not realistic.*2:50PM.*Possible.*3:00PM.*Recommended.*3:10PM.*Comfortable backup/is, 'each bus should have a clear decision label');
assert.match(guide, /Yaesu South Exit.*platforms 7 or 8/is, 'the Tokyo step should identify the exact exit and bus platforms');
assert.match(guide, /each traveller.*own SmartEX QR.*Shinkansen exit/is, 'the guide should explain how both travellers leave the Shinkansen area');
assert.match(guide, /Suica.*tap.*when boarding.*Do not tap.*getting off/is, 'the guide should explain the complete Suica bus payment flow');
assert.match(guide, /Get off.*Narita Airport Terminal 2.*do not continue.*Terminal 1/is, 'the bus step should make the correct airport stop clear');
assert.match(guide, /Free hotel shuttle.*Bus Stop 25.*No booking.*Taxi.*taxi rank.*No booking/is, 'the final step should compare the free shuttle and taxi options');
assert.match(guide, /新大阪駅.*のぞみ.*東京駅.*八重洲南口.*7番.*8番.*成田空港第2ターミナル.*25番.*タクシー/is, 'the guide should include Japanese names for every critical bus waypoint and both final options');
assert.match(guide, /roughly 4:10–4:40PM/i, 'the guide should give a realistic hotel arrival window from the recommended bus');
assert.match(guide, /Open the Terminal 2 to Narita Tobu taxi route/i, 'the guide should include a direct taxi map');
assert.doesNotMatch(guide, /TYO-NRT.*direct.*hotel/i, 'the guide must not imply the airport bus runs directly to the hotel');

assert.match(html, /id="todayNaritaTransferGuide"[^>]*data-open-narita-transfer-guide/, 'Today should include a Narita guide action');
assert.match(html, /plan\.naritaTransferGuide.*data-open-narita-transfer-guide/, 'the Day 14 timeline should include the guide action');
assert.match(html, /day\.naritaTransferGuide.*Open Narita travel guide/, 'the Day 14 quick view should include the guide action');
assert.match(html, /hotel\.naritaTransferGuide.*Arrival guide/, 'the Narita Tobu booking should include an arrival guide action');
assert.match(html, /function openNaritaTransferGuide\(\)/, 'all entry points should open one shared Narita guide');

for (const url of [
  'https://www.hilton.com/en-gb/hotels/osaocdi-doubletree-osaka-castle/hotel-location/',
  'https://smart-ex.jp/en/',
  'https://global.jr-central.co.jp/en/info/timetable/',
  'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
  'https://www.jreast.co.jp/multi/en/nex/',
  'https://traininfo.jreast.co.jp/train_info/e/express.aspx?group=nex',
  'https://tyo-nrt.com/en/busstop/tokyo',
  'https://tyo-nrt.com/en/flow',
  'https://tyo-nrt.com/en/timetable',
  'https://www.tobuhotel.co.jp/narita/access/',
  'https://www.tobuhotel.co.jp/narita/access/pdf/bus_tt_img_airport_03.pdf'
]) {
  assert.ok(guide.includes(url), `${url} should be available in the guide`);
}

console.log('Day 14 Narita transfer guide test passed');
