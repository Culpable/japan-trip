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

const day = context.tripData.find((item) => item.date === '2026-08-15');
assert.ok(day, '15 August should exist in the itinerary');
assert.equal(day.flightGuide, true, 'Day 15 should expose the flight and lounge guide');
assert.equal(day.transit.flightGuide, true, 'the complete flight should expose the guide from the run sheet');
assert.equal(day.transit.mode, 'Business flight', 'the timeline should state the booked cabin');
assert.match(day.transit.route, /Narita T1.*Ho Chi Minh City T2.*Perth/i, 'the route should name both international terminals');
assert.match(day.transit.detail, /VN307.*9:30AM JST.*1:30PM ICT.*1h 50m airside transfer.*VN791.*3:20PM ICT.*10:30PM AWST/i, 'the timeline should include both flight schedules and the connection');
const dayNotes = JSON.stringify(day.notes);
assert.match(dayNotes, /booked through Qantas.*VN-operated/is, 'Day 15 notes should retain the operator and booking-channel context');
assert.match(dayNotes, /NARITA PREMIER LOUNGE.*No\.1 Satellite.*Level 4/is, 'Day 15 notes should retain the Narita lounge location');
assert.match(dayNotes, /Nối chuyến quốc tế.*Nhập cảnh.*Nhận hành lý/is, 'Day 15 notes should retain the Vietnamese transfer signs');
assert.match(dayNotes, /Lotus Lounge 2.*Level 2.*Gate 18/is, 'Day 15 notes should retain the Ho Chi Minh City lounge location');

const guideStart = html.indexOf('<dialog class="trip-dialog border-guide-dialog flight-guide-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated flight and lounge guide');
for (let step = 1; step <= 6; step += 1) {
  assert.match(guide, new RegExp(`id="flight-guide-step-${step}"`), `the guide should include step ${step}`);
}

assert.match(guide, /VN307.*Narita T1.*9:30AM JST.*Ho Chi Minh T2.*1:30PM ICT.*1h 50m.*VN791.*3:20PM ICT.*Perth T1.*10:30PM AWST/is, 'the route overview should show every flight and connection time in order');
assert.match(guide, /collect both boarding passes.*bag tag says PER/is, 'the Narita checklist should cover boarding passes and through-checked bags');
assert.match(guide, /荷物はパースまで預けられていますか？.*Is our luggage checked through to Perth/is, 'the guide should include the Japanese baggage phrase and translation');
assert.match(guide, /ホーチミン市からパースまでの搭乗券も発券されていますか？.*boarding pass from Ho Chi Minh City to Perth/is, 'the guide should include the Japanese boarding-pass phrase and translation');
assert.match(guide, /NARITA PREMIER LOUNGE.*ナリタプレミアラウンジ.*Terminal 1.*No\.1 Satellite.*Level 4.*after international security/is, 'the guide should give the full Narita lounge name and location in both languages');
assert.match(guide, /Qantas sold the ticket.*VN-operated.*VN-numbered.*Vietnam Airlines lounge assignment/is, 'the guide should explain why the Qantas booking channel does not change the lounge assignment');
assert.match(guide, /Quá cảnh.*Nối chuyến.*Nối chuyến quốc tế.*Nhập cảnh.*Nhận hành lý/is, 'the transfer guide should translate the signs to follow and avoid');
assert.match(guide, /should not collect or recheck.*remain airside.*should not need to enter Vietnam.*transit visa/is, 'the guide should explain the expected airside transfer and baggage process');
assert.match(guide, /Chúng tôi nối chuyến quốc tế đến Perth trên chuyến VN791.*Where is international transfer/is, 'the guide should include the Vietnamese international-transfer phrase and translation');
assert.match(guide, /Lotus Lounge 2.*Phòng chờ Bông Sen 2.*International Terminal T2.*Level 2.*Gate 18/is, 'the guide should provide the Lotus Lounge name and exact location in both languages');
assert.match(guide, /Xin vui lòng chỉ đường đến Cửa khởi hành của chuyến VN791.*departure gate for VN791/is, 'the guide should include the Vietnamese gate phrase and translation');
assert.doesNotMatch(guide, /07:30|21:00|opening hours|spend \d+.*lounge|lounge for \d+/i, 'the guide should not prescribe lounge timing');

assert.match(html, /id="todayFlightGuide"[^>]*data-open-flight-guide/, 'Today should include a flight-guide action');
assert.match(html, /id="tomorrowFlightGuide"[^>]*data-open-flight-guide/, 'Tomorrow should include a flight-guide action');
assert.match(html, /plan\.flightGuide.*data-open-flight-guide/, 'the Day 15 timeline should include a flight-guide action');
assert.match(html, /activity\.flightGuide.*data-open-flight-guide/, 'the Day 15 run sheet should include a flight-guide action');
assert.match(html, /day\.flightGuide.*Open flight &amp; lounge guide/, 'the Day 15 quick view should include a flight-guide action');
assert.match(html, /function openFlightGuide\(\)/, 'all entry points should open one shared flight guide');

for (const url of [
  'https://www.vietnamairlines.com/es/en/travel-information/airports-transit/transit-information',
  'https://www.vietnamairlines.com/gb/en/help-desk/common-topics/Baggage/support-baggage-for-connecting-flights',
  'https://www.vietnamairlines.com/in/en/travel-information/airports-transit/lotus-lounge',
  'https://www.narita-airport.jp/en/service/lounge/airport/',
  'https://vietnamairport.vn/tansonnhatairport/tin-tuc/thong-tin-dich-vu-2/dich-vu-phong-cho-hang-thuong-gia',
]) {
  assert.ok(guide.includes(url), `${url} should be available in the guide`);
}

console.log('Day 15 flight and lounge guide test passed');
