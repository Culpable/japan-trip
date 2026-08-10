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
assert.equal(day.usjGuide, true, 'Day 13 should expose the USJ Express Pass guide');

const usj = day.activities.find((activity) => activity.id === 'universal-studios');
assert.ok(usj, 'Day 13 should include Universal Studios Japan');
assert.equal(usj.usjGuide, true, 'the booked USJ activity should expose the Express Pass guide');
assert.equal(usj.time, '11:50AM', 'the USJ activity should begin with the first booked ride window');
assert.equal(usj.booking.statusLabel, 'Express Pass 8 · 2 people', 'the booking wallet should summarise the pass and party size');

const guideStart = html.indexOf('<dialog class="trip-dialog usj-pass-dialog"');
const guideEnd = html.indexOf('</dialog>', guideStart);
const guide = html.slice(guideStart, guideEnd);
assert.ok(guideStart > -1 && guideEnd > guideStart, 'the page should include a dedicated USJ Express Pass modal');
assert.match(guide, /Universal Express Pass 8\s*-\s*Minecart &amp; Fantasy Special/i, 'the modal should name the booked pass');
assert.match(guide, /Thursday 13 August 2026/i, 'the modal should show the booking date');
assert.match(guide, /2 people/i, 'the modal should show the number of travellers');

for (const [name, time] of [
  ['Flight of the Hippogriff', '11:50–12:20'],
  ['SUPER NINTENDO WORLD Area Entry', '14:00–15:00'],
  ["Mario Kart: Koopa's Challenge", '14:00–14:30'],
  ["Yoshi's Adventure", '14:30–15:00'],
  ['Mine Cart Madness', '15:00–15:30'],
  ["Illumination’s Villain-Con Minion Blast", '16:20–16:50']
]) {
  assert.match(guide, new RegExp(`${time}[\\s\\S]*?${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${name} should show its booked time window`);
}

assert.match(guide, /フライト・オブ・ザ・ヒッポグリフ/, 'the modal should include the Hippogriff local name');
assert.match(guide, /スーパー・ニンテンドー・ワールド/, 'the modal should include the area local name');
assert.match(guide, /マリオカート ～クッパの挑戦状～/, 'the modal should include the Mario Kart local name');
assert.match(guide, /ヨッシー・アドベンチャー/, 'the modal should include the Yoshi local name');
assert.match(guide, /ドンキーコングのクレイジー・トロッコ/, 'the modal should include the Mine Cart local name');
assert.match(guide, /ミニオン・ハチャメチャ・ミッション ～大悪党への道～/, 'the modal should include the Minion local name');
assert.match(guide, /Area Entry.*contains.*Mario Kart.*Yoshi/is, 'the modal should explain how the Super Nintendo World windows fit together');
assert.doesNotMatch(guide, /reservation number|booking identifier|card number|pickup code/i, 'the modal should not expose sensitive booking details');

assert.match(html, /id="todayUsjGuide"[^>]*data-open-usj-guide/, 'Today should include a USJ guide action');
assert.match(html, /plan\.usjGuide.*data-open-usj-guide/, 'the Day 13 timeline should include a USJ guide action');
assert.match(html, /day\.usjGuide.*data-open-usj-guide/, 'the Day 13 quick view should include a USJ guide action');
assert.match(html, /activity\.usjGuide.*data-open-usj-guide/, 'the USJ run-sheet activity should include a guide action');
assert.match(html, /booking\.usjGuide.*data-open-usj-guide/, 'the booking wallet should include a USJ guide action');
assert.match(html, /function openUsjGuide\(\)/, 'all entry points should open one shared USJ guide');

console.log('USJ Express Pass guide test passed');
