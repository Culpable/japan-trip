// Unit tests for the pre-trip "countdown delight" data and pure helpers.
// Mirrors the other tests in this folder: slice the relevant code out of index.html and
// execute it inside a vm sandbox with just enough of the surrounding scope stubbed out.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// The delight data + helpers are one contiguous block that begins at `const travellers`
// and ends just before `const mapsUrl`. Extracting the whole block keeps every helper's
// closure intact.
function extractBlock(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return html.slice(start, end);
}

const block = extractBlock("const travellers = 'Jake & Helena';", 'const mapsUrl =');

// A minimal localStorage that the milestone + checklist helpers read and write.
function makeStorage(seed = {}) {
  const store = { ...seed };
  return {
    store,
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
  };
}

// A stand-alone copy of index.html's date-distance helper so daySeed works correctly.
function dayDistance(from, to) {
  const asUtc = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((asUtc(to) - asUtc(from)) / 86400000);
}

// Build a fresh sandbox for each scenario. `clock` drives the mocked trip clock so we can
// place "now" before or during the trip.
function sandbox({ storage = makeStorage(), clock = { currentDate: '2026-07-13' } } = {}) {
  const context = vm.createContext({
    Date, JSON, Math, console,
    localStorage: storage,
    startDate: '2026-08-01',
    dayDistance,
    previewableNow: () => new Date(),
    tripClock: () => clock,
  });
  vm.runInContext(block, context);
  return { context, storage, run: (expr) => vm.runInContext(expr, context) };
}

// --- "sleeps" language ------------------------------------------------------------
{
  const { run } = sandbox();
  assert.equal(run('sleepsLabel(1)'), '1 sleep', 'singular sleep');
  assert.equal(run('sleepsLabel(2)'), '2 sleeps', 'plural sleeps');
  assert.equal(run('sleepsLabel(19)'), '19 sleeps', 'nineteen sleeps');
}

// --- deterministic daily picks ----------------------------------------------------
{
  const { run } = sandbox();
  // Same day → same content, every time.
  assert.equal(
    run("pickForDay(japanesePhrases, '2026-07-13').romaji"),
    run("pickForDay(japanesePhrases, '2026-07-13').romaji"),
    'phrase of the day is stable within a day'
  );
  // Consecutive days advance the seed by exactly one.
  assert.equal(run("daySeed('2026-07-14') - daySeed('2026-07-13')"), 1, 'seed advances one per day');
  // Picks stay inside the source list.
  assert.equal(run("countdownTeasers.includes(pickForDay(countdownTeasers, '2026-07-13'))"), true, 'teaser is a real list member');
}

// --- hand-written dated notes -----------------------------------------------------
{
  const { run } = sandbox();
  assert.equal(typeof run("noteForDate('2026-07-13')"), 'string', 'today has a note');
  assert.equal(run("noteForDate('2020-01-01')"), null, 'unknown date has no note');
}

// --- milestone celebration fires once per device ----------------------------------
{
  const { run, storage } = sandbox();
  assert.equal(run('pendingMilestone(6)'), null, 'six sleeps is not a milestone');
  assert.equal(run('pendingMilestone(7)'), 7, 'seven sleeps is a fresh milestone');
  run('recordMilestone(7)');
  assert.equal(run('pendingMilestone(7)'), null, 'a recorded milestone will not fire again');
  assert.deepEqual(JSON.parse(storage.store['jalena-trip-milestones-v1']), [7], 'milestone is persisted');
  // Every milestone threshold has a matching message.
  assert.equal(run('MILESTONES.every((days) => Boolean(milestoneMessages[days]))'), true, 'all milestones have copy');
}

// --- shared checklist persistence -------------------------------------------------
{
  const { run } = sandbox();
  assert.equal(run('JSON.stringify(readChecklist())'), '{}', 'empty checklist by default');
  run("writeChecklist({ pack: true, esim: false })");
  assert.equal(run("readChecklist().pack"), true, 'checklist round-trips a ticked item');
  assert.equal(run("readChecklist().esim"), false, 'checklist round-trips an unticked item');
}
{
  // Corrupt storage must never throw; it degrades to an empty object.
  const { run } = sandbox({ storage: makeStorage({ 'jalena-trip-checklist-v1': 'not-json{' }) });
  assert.equal(run('JSON.stringify(readChecklist())'), '{}', 'corrupt checklist storage falls back to empty');
}

// --- Pikachu's pre-trip mood ------------------------------------------------------
{
  // Before the trip: a mood with an accessory, a line, and three tips (phrase + sleeps + mood).
  const { run } = sandbox({ clock: { currentDate: '2026-07-13' } });
  assert.equal(run('preTripMood() !== null'), true, 'mood exists before the trip');
  assert.equal(run('typeof preTripMood().accessory'), 'string', 'mood has an accessory emoji');
  assert.equal(run('preTripMood().tips.length'), 3, 'mood teaches three lines');
  assert.equal(run("preTripMood().tips[0].includes('(')"), true, 'first tip is the phrase of the day');
  assert.equal(run("preTripMood().tips[1].includes('19 sleeps')"), true, 'second tip counts the sleeps');
}
{
  // Once the trip has started, the mood bows out so region costumes take over.
  const { run } = sandbox({ clock: { currentDate: '2026-08-05' } });
  assert.equal(run('preTripMood()'), null, 'no pre-trip mood during the trip');
}

console.log('countdown delight test passed');
