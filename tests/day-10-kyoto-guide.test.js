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
assert.match(day.transit.detail, /10:00AM taxi.*booked Kodama 817.*Shizuoka.*booked Hikari 709.*Kyoto taxi/i, 'the summary should include both taxis and the booked trains');
assert.match(day.activities[0].title, /booked Kodama 817.*Shin-Fuji.*Shizuoka/i, 'the first rail activity should name the booked Kodama and stations');
assert.equal(day.activities[0].time, '11:37AM', 'the first rail activity should use the booked departure');
assert.equal(day.activities[0].booking.statusLabel, 'Both reserved seats booked', 'the booking wallet should confirm both reserved seats');
assert.match(day.activities[1].title, /Shizuoka.*booked Hikari 709.*Kyoto/i, 'the second rail activity should name the booked Hikari and stations');
assert.equal(day.activities[1].time, '12:07PM', 'the second rail activity should use the booked departure');
assert.match(JSON.stringify(day.notes), /Kodama 817.*Hikari 709.*ordinary reserved seats booked for two travellers/i, 'the day notes should confirm the complete rail booking');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog kyoto-transfer-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated Kyoto transfer guide');
for (let step = 1; step <= 8; step += 1) {
  assert.match(guide, new RegExp(`id="kyoto-transfer-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /Shoji Lake Hotel.*10:00AM.*Shin-Fuji.*Kodama 817.*11:37AM.*Shizuoka.*Hikari 709.*12:07PM.*Kyoto.*1:37PM.*NOHGA Hotel/is, 'the overview should include every stop and fixed time in order');
assert.match(guide, /10時に予約した、新富士駅の新幹線改札口まで行くタクシーを確認してください。/, 'the guide should include the confirmed hotel taxi phrase');
assert.match(guide, /新富士駅の新幹線改札口までお願いします。11時37分発のこだま817号に乗ります。/, 'the guide should include the Shin-Fuji taxi-driver phrase');
assert.match(guide, /not Kawaguchiko Station.*not Fuji Station/i, 'the guide should distinguish Shin-Fuji from the two similarly named stations');
assert.match(guide, /Both trains and both ordinary reserved seats are confirmed/i, 'the guide should confirm both booked reserved seats');
assert.match(guide, /Kodama 817.*Shizuoka.*19-minute connection.*Hikari 709/is, 'the guide should explain the booked connection');
assert.match(guide, /linked IC card.*QR ticket.*paper tickets/is, 'the guide should explain the valid SmartEX boarding methods');
assert.match(guide, /新富士から京都まで、こだま817号とひかり709号の指定席を予約しています。/, 'the station phrase should confirm both reserved trains');
assert.match(guide, /11:37AM.*11:48AM/is, 'the guide should show the Kodama journey times');
assert.match(guide, /same station.*19-minute connection/is, 'the guide should make the Shizuoka transfer clear');
assert.match(guide, /12:07PM.*1:37PM/is, 'the guide should show the Hikari journey times');
assert.match(guide, /12時07分発のひかり709号で京都まで行きます。乗り場はどこですか？/, 'the guide should include the Shizuoka platform phrase');
assert.match(guide, /ノーガホテル清水京都までお願いします。.*京都市東山区五条橋東4丁目450番1号/s, 'the guide should include the Kyoto taxi phrase and hotel address');
assert.match(guide, /Booked in SmartEX.*No additional rail ticket purchase/is, 'the guide should confirm the booked rail payment');
assert.match(guide, /¥1,500–¥2,000/, 'the guide should include the Kyoto taxi cost');
assert.doesNotMatch(guide, /Kodama 815|11:07AM|1:34PM|non-reserved ticket|If you have a reserved seat/i, 'the guide should not retain the superseded direct-train instructions');

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
