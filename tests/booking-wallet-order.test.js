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
      createElement: () => ({ className: '', innerHTML: '' }),
      querySelector: (selector) => selector === '#bookingWallet' ? bookingWallet : hotelWallet
    }
  };
  vm.createContext(context);
  vm.runInContext(
    `${extractDeclaration('bookings', 'hotels')}${extractDeclaration('hotels', 'dayPlans')}
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
  return rows.map((row) => row.innerHTML.match(/<strong>(.*?)<\/strong>/)?.[1]?.replace(/^[^\x00-\x7F]+\s+/, ''));
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
    ['teamLab Planets', 'Ninja Restaurant', 'Kimono Miyabi Kyoto', 'Dior Café'],
    'upcoming bookings should be shown first and elapsed bookings should move to the end'
  );
  assert.match(bookingWallet.rows.at(-1).className, /is-past/, 'Dior Café should be marked past after its 10:30AM reservation');
}

function verifyNextBookingPromotion() {
  const { context, bookingWallet } = createHarness();
  context.clock = {
    now: new Date('2026-08-09T12:00:00+09:00'),
    currentDate: '2026-08-09'
  };
  vm.runInContext('renderWallets(clock)', context);

  assert.equal(walletNames(bookingWallet.rows)[0], 'Kimono Miyabi Kyoto', 'the next confirmed booking should appear first');
  assert.equal(bookingWallet.rows[0].className, 'wallet-item');
  assert.ok(bookingWallet.rows.slice(1).every((row) => row.className.includes('is-past')), 'completed bookings should follow the next booking');
}

verifySameDayBookingCompletion();
verifyNextBookingPromotion();
console.log('booking wallet order test passed');
