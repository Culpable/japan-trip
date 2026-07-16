const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /id="todayView"[^>]*hidden/, 'the page should include a dedicated in-trip Today view');
assert.match(html, /id="todayNextTitle"/, 'Today should surface the next activity');
assert.match(html, /id="todayLeaveBy"/, 'Today should surface a leave-by time');
assert.match(html, /id="todayTransit"/, 'Today should surface the day transit plan');
assert.match(html, /id="todayWeather"/, 'Today should link to live destination weather');
assert.match(html, /id="todayHotel"/, 'Today should surface tonight’s hotel');
assert.match(html, /id="todayRunSheet"/, 'Today should preview the live run sheet');
assert.match(html, /id="todayFullRoute"/, 'Today should provide a clear Full route action');

assert.match(html, /function showTodayMode\(clock[\s\S]*itineraryView = 'today'/, 'Today mode should record the active view');
assert.match(html, /function showTodayMode\(clock[\s\S]*region\.hidden = true/, 'Today mode should focus the home screen by hiding route regions');
assert.match(html, /function showFullRoute\([\s\S]*itineraryView = 'route'/, 'Full route should record the active view');
assert.match(html, /function renderTodayView\(clock\)/, 'the Today briefing should be rendered from the live trip clock');
assert.match(html, /if \(clock\.inTrip && itineraryView === 'auto'\) showTodayMode\(clock\)/, 'an in-progress trip should open in Today mode by default');
assert.match(html, /body\.is-in-trip \.hero-bottom\s*\{[^}]*display:\s*none/, 'the in-trip hero should compact so Today content reaches the first viewport');

console.log('today-first mode test passed');
