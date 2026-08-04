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

const day = context.tripData.find((item) => item.date === '2026-08-04');
assert.ok(day, '4 August should exist in the itinerary');
assert.equal(day.borderGuide, true, 'Day 4 should expose the border guide');
assert.equal(day.hotel.borderGuide, true, 'The Silveri booking should expose the border guide');
assert.equal(day.transit.route, 'The Langham Shenzhen → The Silveri Hong Kong', 'the Day 4 route should name the real start and hotel destination');
assert.match(day.transit.detail, /DiDi to Futian Port.*3 MTR lines to Tung Chung/, 'the Day 4 transit summary should match the complete route');

assert.match(html, /id="borderGuideDialog"/, 'the page should include a dedicated border guide modal');
for (let step = 1; step <= 9; step += 1) {
  assert.match(html, new RegExp(`id="border-step-${step}"`), `the complete guide should include step ${step}`);
}
assert.match(html, /Futian Port is open 6:30AM–10:30PM/, 'the guide should show current official port hours');
assert.match(html, /福田站.*福田高铁站.*皇岗口岸/, 'the DiDi warning should retain all three wrong destinations');
assert.match(html, /请送我们到福田口岸的出境大厅/, 'the guide should include the Simplified Chinese DiDi phrase');
assert.match(html, /請問港鐵站在哪裡/, 'the guide should include the Traditional Chinese MTR phrase');
assert.match(html, /East Rail Line.*Tuen Ma Line.*Tung Chung Line/s, 'the guide should include all three MTR legs');
assert.match(html, /Mong Kok East \/ 旺角東/, 'the first train should include the station-before reminder');
assert.match(html, /East Tsim Sha Tsui \/ 尖東.*Austin \/ 柯士甸.*Nam Cheong \/ 南昌/, 'the Hung Hom transfer should include all intermediate stations');
assert.match(html, /Lai King \/ 荔景.*Tsing Yi \/ 青衣.*Sunny Bay \/ 欣澳.*Tung Chung \/ 東涌/, 'the final train should include all intermediate stations');
assert.match(html, /Level 3 or Level 7/, 'the hotel walk should include the correct lift levels');
assert.match(html, /lobby on Level 9/, 'the hotel walk should include the lobby level');
assert.match(html, /香港銀樾美憬閣精選酒店/, 'the guide should include the hotel name in Traditional Chinese');
assert.match(html, /香港東涌達東路16號/, 'the guide should include the hotel address in Traditional Chinese');
assert.match(html, /Do not order an Uber after entering Hong Kong/, 'the guide should retain the final transport warning');

assert.match(html, /id="todayBorderGuide"[^>]*data-open-border-guide/, 'Today should include a border guide action');
assert.match(html, /plan\.borderGuide.*data-open-border-guide/, 'the Day 4 timeline should include a border guide action');
assert.match(html, /day\.borderGuide.*Open border guide/, 'the Day 4 quick view should include a border guide action');
assert.match(html, /hotel\.borderGuide.*Border guide/, 'The Silveri booking row should include a border guide action');
assert.match(html, /function openBorderGuide\(\)/, 'all entry points should open one shared guide');
assert.match(html, /document\.querySelector\?\.\('dialog\[open\]'\)/, 'stacked Day and Booking dialogs should retain the background scroll lock');

for (const url of [
  'https://www.mtr.com.hk/en/customer/services/system_map.html',
  'https://www.mtr.com.hk/en/customer/tickets/index.php',
  'https://www.sz.gov.cn/en_szgov/news/notices/content/post_12593648.html',
  'https://www.sz.gov.cn/en_szgov/news/infocus/modern/checkpoints/content/post_12256697.html',
  'https://thesilveri-hongkong.com/destination-guide/'
]) {
  assert.ok(html.includes(url), `${url} should remain available in the guide`);
}

const mapPath = path.join(root, 'assets', 'silveri-walking-map.jpg');
assert.ok(fs.statSync(mapPath).size > 100_000, 'the official Silveri walking map should be stored for offline use');

console.log('Day 4 border guide test passed');
