const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
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
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return html.slice(start, end);
}

const context = vm.createContext({});
vm.runInContext(`${extractDeclaration('tripData', 'bookings')}; this.model = tripData;`, context);
const tripData = JSON.parse(vm.runInContext('JSON.stringify(model)', context));
const updateTripState = extractFunction('updateTripState');

assert.equal(tripData[2].location, 'Guangzhou', 'Day 3 should use its exact destination');
assert.equal(tripData[11].location, 'Nara', 'Day 12 should use its exact destination');
assert.match(
  updateTripState,
  /const\s+(?:day|currentDay)\s*=\s*tripData\[clock\.dayNumber\s*-\s*1\]/,
  'the in-trip hero should select the canonical day from tripData'
);
assert.match(
  updateTripState,
  /const\s+location\s*=\s*(?:day|currentDay)\.location/,
  'the in-trip hero should derive its location from the canonical day'
);
assert.doesNotMatch(
  updateTripState,
  /locationForDay\(/,
  'the in-trip hero must not use a parallel hardcoded location map'
);

console.log('canonical hero location test passed');
