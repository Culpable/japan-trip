const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the itinerary presents the current route without revision-history annotations', () => {
  assert.doesNotMatch(
    source,
    /\brevis(?:ed|ion)\b|original three-city rush/i,
    'route revision badges, notes and footer copy should not appear in the current itinerary'
  );
});
