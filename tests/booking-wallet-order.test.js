const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) return '';
  const openingBrace = html.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function extractDeclaration(name, nextName) {
  const start = html.indexOf(`const ${name} =`);
  const end = html.indexOf(`const ${nextName} =`, start);
  if (start === -1 || end === -1) throw new Error(`Could not extract ${name}`);
  return html.slice(start, end);
}

function createHarness() {
  const bookingWallet = { rows: [], replaceChildren(...rows) { this.rows = rows; } };
  const hotelWallet = { replaceChildren() {} };
  const context = {
    Date,
    mapsUrl: () => '#',
    document: {
      createElement: () => ({ className: '', innerHTML: '', dataset: {} }),
      querySelector: (selector) => selector === '#bookingWallet' ? bookingWallet : hotelWallet
    },
    localPlaceIndex: new Map(),
    localPlaceAction: () => '',
    syncLocalPlaceDisplay() {}
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractDeclaration('tripData', 'bookings')}${extractDeclaration('bookings', 'hotels')}${extractDeclaration('hotels', 'travellers')}
    ${extractFunction('bookingHasElapsed')}
    ${extractFunction('orderedBookings')}
    ${extractFunction('renderWallets')}`,
    context
  );
  return { context, bookingWallet };
}

function walletNames(rows) {
  // The wallet now prefixes each name with a decorative emoji (e.g. "🥷🏻 Ninja Restaurant").
  // Strip that leading non-ASCII glyph so these assertions stay focused on booking order.
  return rows.map((row) => row.innerHTML.match(/<strong(?:\s[^>]*)?>(.*?)<\/strong>/)?.[1]?.replace(/^[^\x00-\x7F]+\s+/, ''));
}

function verifySameDayBookingCompletion() {
  const { context, bookingWallet } = createHarness();
  context.clock = {
    now: new Date('2026-08-06T12:00:00+09:00'),
    currentDate: '2026-08-06'
  };
  vm.runInContext('renderWallets(clock)', context);

  assert.deepEqual(
    walletNames(bookingWallet.rows),
    ['teamLab Planets', 'SHIBUYA SKY', 'Ninja Restaurant', 'Kodama 821 + Hikari 711', 'Kimono Miyabi Kyoto', 'USJ Express Pass + Super Nintendo World', 'Nozomi 18', 'Narita Express 35', 'Dior Café'],
    'upcoming bookings should be shown first and elapsed bookings should move to the end'
  );
  const shibuyaSky = bookingWallet.rows.find((row) => row.dataset.localPlace === 'shibuya-sky');
  assert.equal(shibuyaSky.dataset.englishDetail, 'Friday 7 August · 5:35PM · Admission confirmed');
  assert.match(shibuyaSky.dataset.localDetail, /^Friday 7 August · 5:35PM · Admission confirmed\n/);
  assert.match(shibuyaSky.dataset.localDetail, /東京都渋谷区渋谷2丁目24-12/);
  assert.match(bookingWallet.rows.at(-1).className, /is-past/, 'Dior Café should be marked past after its 10:30AM reservation');
}

function verifyNextBookingPromotion() {
  const { context, bookingWallet } = createHarness();
  context.clock = {
    now: new Date('2026-08-09T12:00:00+09:00'),
    currentDate: '2026-08-09'
  };
  vm.runInContext('renderWallets(clock)', context);

  assert.equal(walletNames(bookingWallet.rows)[0], 'Kodama 821 + Hikari 711', 'the booked Kyoto Green Car journey should appear first');
  assert.equal(walletNames(bookingWallet.rows)[1], 'Kimono Miyabi Kyoto', 'the next confirmed activity booking should follow the rail connection');
  assert.equal(walletNames(bookingWallet.rows)[2], 'USJ Express Pass + Super Nintendo World', 'the later USJ booking should remain with upcoming bookings');
  assert.equal(walletNames(bookingWallet.rows)[3], 'Nozomi 18', 'the confirmed Day 14 Shinkansen should appear in booking order');
  assert.equal(walletNames(bookingWallet.rows)[4], 'Narita Express 35', 'the confirmed airport train should follow the Shinkansen');
  assert.match(bookingWallet.rows[3].dataset.englishDetail, /12:06PM.*Green Car 8.*15-A\/15-B/, 'the Nozomi wallet row should show its time and seats');
  assert.match(bookingWallet.rows[4].dataset.englishDetail, /3:03PM.*Green Car 12.*3-C\/3-D/, 'the Narita Express wallet row should show its time and seats');
  assert.match(bookingWallet.rows[0].className, /\blocal-place\b/);
  assert.doesNotMatch(bookingWallet.rows[0].className, /\bis-past\b/);
  assert.match(bookingWallet.rows[1].className, /\blocal-place\b/);
  assert.doesNotMatch(bookingWallet.rows[1].className, /\bis-past\b/);
  assert.match(bookingWallet.rows[2].className, /\blocal-place\b/);
  assert.doesNotMatch(bookingWallet.rows[2].className, /\bis-past\b/);
  assert.ok(bookingWallet.rows.slice(5).every((row) => row.className.includes('is-past')), 'completed bookings should follow upcoming bookings');
}

verifySameDayBookingCompletion();
verifyNextBookingPromotion();
console.log('booking wallet order test passed');
