const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function cssRule(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} should have a CSS rule`);
  return match[1];
}

const todayView = cssRule('.today-view');
assert.match(
  todayView,
  /--accent:\s*#[0-9a-f]{3,6}/i,
  'Today should define the accent used by its primary run-sheet action'
);
assert.match(
  todayView,
  /--text:\s*#[0-9a-f]{3,6}/i,
  'Today should define readable text for its secondary actions'
);

const primaryAction = cssRule('.day-action.primary');
assert.match(primaryAction, /background:\s*var\(--accent\)/, 'the primary action should use the scoped accent');
assert.match(primaryAction, /color:\s*#fff/, 'the primary action should retain white text over its accent');

console.log('Today action contrast test passed');
