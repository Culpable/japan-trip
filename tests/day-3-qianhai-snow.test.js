const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const tripDataStart = html.indexOf('const tripData =');
const tripDataEnd = html.indexOf('const bookings =', tripDataStart);
const context = {};
vm.createContext(context);
vm.runInContext(`${html.slice(tripDataStart, tripDataEnd)}; this.tripData = tripData;`, context);

const day = context.tripData.find((item) => item.date === '2026-08-03');
assert.ok(day, '3 August should exist in the itinerary');
assert.equal(day.title, 'Qianhai Snow World + Guangzhou Circle', 'the Day 3 timeline should feature the snow activity');
assert.equal(day.weatherCity, 'Shenzhen', 'Today weather should use the first Day 3 destination');
assert.match(day.mapQuery, /HUAFA SNOW BONSKI/, 'the day map should open the snow venue');
assert.match(day.transit.route, /Qianhai Snow World/, 'the first Day 3 transfer should lead to the snow venue');

const snow = day.activities.find((activity) => activity.id === 'qianhai-snow-world');
assert.ok(snow, 'the snow activity should appear in the Day 3 event list');
assert.equal(snow.order, 1, 'the snow activity should be the first Day 3 event');
assert.equal(snow.localName, '前往华发冰雪热雪奇迹', 'the activity should include its current Simplified Chinese name');
assert.equal(snow.localAddress, '广东省深圳市宝安区滨江大道666号华发冰雪热雪奇迹', 'the activity should include the taxi-ready Simplified Chinese address');
assert.equal(snow.localLang, 'zh-Hans', 'the local place card should use Simplified Chinese');
assert.match(snow.detail, /10:00AM–10:00PM/, 'the activity should show its opening hours');
assert.match(snow.detail, /last entry 8:00PM/, 'the activity should show its last entry time');
assert.match(snow.detail, /bring original passport/, 'the activity should show the identity document requirement');
assert.equal(snow.durationMinutes, 240, 'the run sheet should allow four hours within Klook’s three-to-five-hour estimate');
assert.equal(snow.detailsLink, 'https://www.klook.com/en-US/activity/171780-shenzhen-huafa-snow-bonski/', 'the event should retain the supplied Klook page');
assert.equal(snow.detailsLabel, 'Klook details', 'the external link should not imply an unconfirmed reservation');

const guangzhouRail = day.activities.find((activity) => activity.id === 'guangzhou-rail');
assert.ok(guangzhouRail, 'the existing Guangzhou transfer should remain in the event list');
assert.ok(guangzhouRail.order > snow.order, 'the Guangzhou entries should follow the snow activity');
assert.match(html, /const detailsAction = activity\.detailsLink/, 'the day run sheet should show the Klook details action');
assert.match(html, /focus\?\.reservationLink \|\| focus\?\.detailsLink/, 'Today should expose the activity details action');

console.log('Day 3 Qianhai Snow World test passed');
