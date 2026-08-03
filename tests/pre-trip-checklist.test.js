const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const listStart = source.indexOf('const preTripTasks = [');
const listEnd = source.indexOf('];', listStart);
const checklistSource = source.slice(listStart, listEnd);

test('the pre-trip checklist excludes already resolved or unnecessary tasks', () => {
  assert.notEqual(listStart, -1, 'the pre-trip checklist should be present');
  assert.doesNotMatch(checklistSource, /International Driving Permit|id:\s*'idp'/);
  assert.doesNotMatch(checklistSource, /USJ Express Pass|id:\s*'book-usj'/);
  assert.doesNotMatch(checklistSource, /Shibuya Sky|id:\s*'book-shibuya'/);
  assert.equal((checklistSource.match(/\{ id:/g) || []).length, 4, 'four checklist tasks should remain');
});

test('today mode does not update the removed urgent booking banner', () => {
  assert.doesNotMatch(source, /document\.querySelector\('\.urgent'\)\.hidden/);
});
