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
assert.equal(day.transit.time, '2:00PM', 'the transfer should retain the planned 2:00PM departure');
assert.equal(day.transit.leaveBy, '2:00PM', 'Today should tell the travellers to leave DoubleTree by 2:00PM');
assert.match(day.transit.detail, /taxi.*Shin-Osaka.*Nozomi.*Tokyo.*Narita Express.*Terminal 2.*shuttle/i, 'the summary should include every transfer leg');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog narita-transfer-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Narita transfer guide');
for (let step = 1; step <= 8; step += 1) {
  assert.match(guide, new RegExp(`id="narita-transfer-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /DoubleTree.*2:00PM.*taxi.*Shin-Osaka.*Nozomi.*Tokyo.*Narita Express.*Airport Terminal 2.*Bus Stop 25.*Narita Tobu/is, 'the route overview should show every leg in order');
assert.match(guide, /Obon.*Nozomi.*all seats.*reserved/is, 'the guide should explain the peak-period Nozomi reservation rule');
assert.match(guide, /Narita Express.*separate.*reserved.*ticket/is, 'the guide should explain that the Narita Express needs a separate reservation');
assert.match(guide, /guide-train-service[^>]*><span>Train \/ service<\/span><strong>Nozomi/is, 'the Nozomi service should have a dedicated visual highlight');
assert.match(guide, /guide-train-stop[^>]*><span>Get off here<\/span><strong>Tokyo Station/is, 'the Tokyo exit station should have a separate visual highlight');
assert.match(guide, /guide-train-service[^>]*><span>Train \/ service<\/span><strong>Narita Express/is, 'the Narita Express service should have a dedicated visual highlight');
assert.match(guide, /guide-train-stop[^>]*><span>Get off here<\/span><strong>Airport Terminal 2·3/is, 'the airport exit station should have a separate visual highlight');
assert.match(guide, /新大阪駅.*のぞみ.*東京駅.*成田エクスプレス.*空港第2ビル駅.*25番/is, 'the guide should include Japanese names for the critical stations and shuttle stop');
assert.match(guide, /roughly 7:15–8:00PM/i, 'the guide should give a realistic hotel arrival window');
assert.doesNotMatch(guide, /TYO-NRT.*direct.*hotel/i, 'the guide must not imply the suspended direct hotel bus is operating');

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
  'https://www.tobuhotel.co.jp/narita/access/',
  'https://www.tobuhotel.co.jp/narita/access/pdf/bus_tt_img_airport_03.pdf'
]) {
  assert.ok(guide.includes(url), `${url} should be available in the guide`);
}

console.log('Day 14 Narita transfer guide test passed');
