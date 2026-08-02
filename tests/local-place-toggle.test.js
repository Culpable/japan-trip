const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Hotel names and addresses must be stored in the page so the taxi card also works offline.
assert.match(html, /localName:\s*'深圳东海朗廷酒店'/, 'the Shenzhen stay should include its local hotel name');
assert.match(html, /localAddress:\s*'中国广东省深圳市福田区深南大道7888号'/, 'the Shenzhen stay should include its local address');
assert.match(html, /localName:\s*'YOTEL 東京 銀座'/, 'the Tokyo stay should include its Japanese hotel name');
assert.match(html, /localName:\s*'精進レークホテル'/, 'the Fuji stay should use the hotel’s official Japanese name');

assert.match(html, /function toggleLocalPlace\(placeId\)/, 'one shared control should toggle a place between English and local text');
assert.match(html, /data-local-toggle/, 'local-name controls should use one delegated interaction');
assert.match(html, /Show local name/, 'all traveller-facing controls should be labelled in English');
assert.match(html, /Show English/, 'the control should make the return action clear');
assert.match(html, /id="todayHotelLocal"/, 'the live Today view should expose the local-name control');
assert.match(html, /id="hotelNowLocal"/, 'the current-hotel utility should expose the local-name control');
assert.match(html, /local-name-action/, 'the booking wallet should use the same local-name action');

console.log('local place toggle test passed');
