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

const day = context.tripData.find((item) => item.date === '2026-08-10');
assert.ok(day, '10 August should exist in the itinerary');
assert.equal(day.kyotoTransferGuide, true, 'Day 10 should expose the Kyoto transfer guide');
assert.equal(day.hotel.kyotoTransferGuide, true, 'NOHGA Hotel should expose the arrival guide');
assert.equal(day.transit.route, 'Shoji Lake Hotel → NOHGA Hotel Kiyomizu Kyoto', 'the route should name both hotels');
assert.equal(day.transit.time, '10:00AM', 'the transfer should begin at the planned hotel departure');
assert.equal(day.transit.leaveBy, '10:00AM', 'Today should tell the travellers to leave at 10:00AM');
assert.match(day.transit.detail, /10:00AM taxi.*Kodama 815.*11:07AM.*Kyoto taxi/i, 'the summary should include both taxis and the fixed train');
assert.match(day.activities[0].title, /Kodama 815.*Shin-Fuji.*Kyoto/i, 'the first rail activity should name the direct train and stations');
assert.equal(day.activities[0].time, '11:07AM', 'the rail activity should use the selected departure');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog kyoto-transfer-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Kyoto transfer guide');
for (let step = 1; step <= 7; step += 1) {
  assert.match(guide, new RegExp(`id="kyoto-transfer-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /Shoji Lake Hotel.*10:00AM.*Shin-Fuji.*Kodama 815.*11:07AM.*Kyoto.*1:34PM.*NOHGA Hotel/is, 'the overview should include every stop and fixed time in order');
assert.match(guide, /明日10時に、新富士駅の新幹線改札口まで行くタクシーを予約してください。/, 'the guide should include the hotel taxi-booking phrase');
assert.match(guide, /新富士駅の新幹線改札口までお願いします。11時7分発のこだま815号に乗ります。/, 'the guide should include the Shin-Fuji taxi-driver phrase');
assert.match(guide, /not Kawaguchiko Station.*not Fuji Station/i, 'the guide should distinguish Shin-Fuji from the two similarly named stations');
assert.match(guide, /If you have a reserved seat.*If you do not have a reserved seat/s, 'the guide should provide both ticket paths');
assert.match(guide, /ordinary non-reserved ticket.*Do not rely on simply tapping an ordinary Suica/s, 'the non-reserved path should explain how to buy a valid ticket');
assert.match(guide, /指定席または自由席の切符を2人分お願いします。/, 'the station phrase should ask for reserved or non-reserved tickets for two');
assert.doesNotMatch(guide, /Kodama 815[^<]{0,80}(?:is booked|is confirmed)|booked Kodama 815|confirmed Kodama 815/i, 'the guide must not assume a reserved or non-reserved booking state');
assert.match(guide, /11:07AM–1:34PM.*one train.*no transfer/is, 'the guide should make the direct journey clear');
assert.match(guide, /Kodama 819, 12:08–2:34PM/, 'the guide should include the next direct fallback train');
assert.match(guide, /ノーガホテル清水京都までお願いします。.*京都市東山区五条橋東4丁目450番1号/s, 'the guide should include the Kyoto taxi phrase and hotel address');
assert.match(guide, /¥14,000–¥18,000.*¥10,560.*¥10,890.*¥1,500–¥2,000/s, 'the guide should include expected costs for each leg');

assert.match(html, /id="todayKyotoTransferGuide"[^>]*data-open-kyoto-transfer-guide/, 'Today should include the Kyoto transfer action');
assert.match(html, /plan\.kyotoTransferGuide.*data-open-kyoto-transfer-guide/, 'the Day 10 timeline should include the guide action');
assert.match(html, /day\.kyotoTransferGuide.*Open Kyoto travel guide/, 'the Day 10 quick view should include the guide action');
assert.match(html, /hotel\.kyotoTransferGuide.*Arrival guide/, 'the NOHGA hotel booking should include the arrival guide');
assert.match(html, /function openKyotoTransferGuide\(\)/, 'all entry points should open one shared Kyoto guide');

for (const url of [
  'https://shojilake.jp/access/',
  'https://smart-ex.jp/en/',
  'https://image.jr.cyberstation.ne.jp/index_en.html',
  'https://global.jr-central.co.jp/en/info/timetable/',
  'https://global.jr-central.co.jp/en/tickets/use/',
  'https://www.nohgahotel.com/kiyomizu/en/access/'
]) {
  assert.ok(guide.includes(url), `${url} should be available in the guide`);
}

console.log('Day 10 Kyoto transfer guide test passed');
