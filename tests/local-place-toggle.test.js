const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Hotel names and addresses must be stored in the page so the taxi card also works offline.
assert.match(html, /localName:\s*'深圳东海朗廷酒店'/, 'the Shenzhen stay should include its local hotel name');
assert.match(html, /localAddress:\s*'中国广东省深圳市福田区深南大道7888号'/, 'the Shenzhen stay should include its local address');
assert.match(html, /localName:\s*'YOTEL 東京 銀座'/, 'the Tokyo stay should include its Japanese hotel name');
assert.match(html, /localName:\s*'精進レークホテル'/, 'the Fuji stay should use the hotel’s official Japanese name');
assert.match(html, /localName:\s*'香港銀樾美憬閣精選酒店'/, 'the Hong Kong stay should use Traditional Chinese');
assert.match(html, /localLang:\s*'zh-Hant'/, 'Hong Kong local text should declare Traditional Chinese');

const tripDataStart = html.indexOf('const tripData =');
const tripDataEnd = html.indexOf('const bookings =', tripDataStart);
const context = {};
vm.createContext(context);
vm.runInContext(`${html.slice(tripDataStart, tripDataEnd)}; this.tripData = tripData;`, context);

const itineraryPlaces = context.tripData.flatMap((day) => [day, day.transit, ...day.activities]);
assert.equal(context.tripData.length, 15, 'all 15 itinerary days should be represented');
assert.equal(itineraryPlaces.filter((place) => place !== undefined).length, 85, 'all day headings and itinerary moments should be represented');
itineraryPlaces.forEach((place) => {
  assert.ok(place.localName, `${place.id} should include a local name`);
  assert.ok(place.localLanguage, `${place.id} should identify its local language`);
  assert.ok(place.localLang, `${place.id} should include a language code`);
});

const placesById = new Map(itineraryPlaces.map((place) => [place.id, place]));
assert.equal(placesById.get('final-shenzhen').localLang, 'zh-Hans', 'mainland China moments should use Simplified Chinese');
assert.equal(placesById.get('cross-hong-kong').localLang, 'zh-Hant', 'Hong Kong moments should use Traditional Chinese');
assert.equal(placesById.get('teamlab-planets').localLang, 'ja', 'Japan moments should use Japanese');
assert.match(placesById.get('cx450-flight').localName, /香港國際機場.*成田空港/, 'cross-border routes should preserve each location’s local script');

assert.match(html, /function toggleLocalPlace\(placeId\)/, 'one shared control should toggle a place between English and local text');
assert.match(html, /data-local-toggle/, 'local-name controls should use one delegated interaction');
assert.match(html, /Show local name/, 'all traveller-facing controls should be labelled in English');
assert.match(html, /Show English/, 'the control should make the return action clear');
assert.match(html, /id="todayHotelLocal"/, 'the live Today view should expose the local-name control');
assert.match(html, /id="hotelNowLocal"/, 'the current-hotel utility should expose the local-name control');
assert.match(html, /local-name-action/, 'the booking wallet should use the same local-name action');
assert.match(html, /id="todayNextLocal"/, 'the Today focus moment should expose the local-name control');
assert.match(html, /id="todayTransitLocal"/, 'the Today transit card should expose the local-name control');
assert.match(html, /id="nextBookingLocal"/, 'the next confirmed moment should expose the local-name control');
assert.match(html, /const localPlaceIndex = new Map/, 'one shared index should synchronise every local place and moment');
assert.match(html, /button\.querySelector\('span'\) \|\| button/, 'text-only local buttons should update without stopping the page render');

console.log('local place toggle test passed');
