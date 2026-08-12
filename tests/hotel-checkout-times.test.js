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
const stays = Object.fromEntries(context.tripData.map((day) => [day.hotel.id, day.hotel]));

const expectedCheckoutTimes = {
  shenzhen: '12:00PM',
  'tokyo-ginza': '11:00AM',
  fuji: '10:00AM',
  kyoto: '12:00PM',
  osaka: '11:00AM',
  narita: '11:00AM'
};

for (const [stayId, checkoutTime] of Object.entries(expectedCheckoutTimes)) {
  assert.equal(stays[stayId].checkoutTime, checkoutTime, `${stayId} should store its confirmed checkout time`);
}

assert.equal(stays['hong-kong-airport'].checkoutTime, undefined, 'The Silveri should not show an unconfirmed checkout time');
assert.match(html, /id="hotelNowCheckout"[^>]*hidden/, 'the current hotel card should include the standard checkout badge');
assert.match(html, /id="todayHotelCheckout"[^>]*hidden/, 'the Today hotel card should include the standard checkout badge');
assert.match(html, /hotel\.checkoutTime \? `<p class="stay-checkout">\$\{actionIcons\.checkout\}/, 'Day dialogs should render the checkout badge from hotel data');
assert.match(html, /hotel\.checkoutTime \? `<p class="stay-checkout">\$\{checkoutIcon\}/, 'the booking wallet should render the checkout badge from hotel data');

console.log('hotel checkout times test passed');
